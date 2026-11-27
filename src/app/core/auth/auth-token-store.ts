import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'portfolio-admin-token';
/** One minute of leeway absorbs clock skew around the JWT expiry boundary. */
const EXPIRY_LEEWAY_MS = 60_000;

interface StoredAuth {
  token: string;
  expiresAt: number;
}

/**
 * Holds the admin JWT and its expiry. Kept separate from `AuthService` so the
 * HTTP interceptor can read it without injecting a service that depends on
 * HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  private readonly stored = this.read();

  readonly token = signal<string | null>(this.stored?.token ?? null);
  readonly expiresAt = signal<number | null>(this.stored?.expiresAt ?? null);

  set(token: string, expiresAt: number): void {
    this.token.set(token);
    this.expiresAt.set(expiresAt);
    this.persist();
  }

  clear(): void {
    this.token.set(null);
    this.expiresAt.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }

  isExpired(now: number = Date.now()): boolean {
    const expiresAt = this.expiresAt();
    return !this.token() || expiresAt === null || now >= expiresAt - EXPIRY_LEEWAY_MS;
  }

  private persist(): void {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: this.token(), expiresAt: this.expiresAt() }),
      );
    } catch {
      // Storage can be unavailable (private mode); the signals still work.
    }
  }

  private read(): StoredAuth | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      const candidate = parsed as Partial<StoredAuth>;
      if (typeof candidate.token !== 'string' || typeof candidate.expiresAt !== 'number') {
        return null;
      }

      return { token: candidate.token, expiresAt: candidate.expiresAt };
    } catch {
      // Legacy raw-token values and malformed JSON are treated as no session.
      return null;
    }
  }
}

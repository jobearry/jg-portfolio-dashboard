import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'portfolio-admin-token';

/**
 * Holds the admin JWT only. Kept separate from `AuthService` so the HTTP
 * interceptor can read it without injecting a service that depends on HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  readonly token = signal<string | null>(this.read());

  set(token: string): void {
    this.token.set(token);
    try {
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch {
      // Storage can be unavailable (private mode); the in-memory signal still works.
    }
  }

  clear(): void {
    this.token.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }

  private read(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}

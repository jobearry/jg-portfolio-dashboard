import { inject, Injectable, signal } from '@angular/core';
import { ApiClient } from '../api/api-client';
import { AuthClaims } from '../../features/dashboard/core/models/auth-claims';
import { AuthTokenStore } from './auth-token-store';

export type AuthStatus = 'anonymous' | 'validating' | 'authenticated' | 'error';

/** Validates a manually supplied JWT against `GET v1/auth/me`. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly store = inject(AuthTokenStore);

  readonly status = signal<AuthStatus>(
    this.store.token() && !this.store.isExpired() ? 'authenticated' : 'anonymous',
  );
  readonly error = signal<string | null>(null);

  async verify(rawToken: string): Promise<boolean> {
    const token = rawToken.trim();

    if (!token) {
      this.status.set('error');
      this.error.set('Enter a token to unlock the dashboard.');
      return false;
    }

    this.status.set('validating');
    this.error.set(null);
    // Store before the request so the interceptor can attach the Bearer header.
    this.store.set(token, 0);

    try {
      const claims = await this.api.get<AuthClaims>('v1/auth/me');
      const expiresAt = Number(claims.exp?.[0]) * 1000;

      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        throw new Error('auth response has no usable expiry');
      }

      this.store.set(token, expiresAt);
      this.status.set('authenticated');
      return true;
    } catch {
      this.store.clear();
      this.status.set('error');
      this.error.set('That token was rejected. Check it and try again.');
      return false;
    }
  }

  clearError(): void {
    this.error.set(null);
  }

  clear(): void {
    this.store.clear();
    this.status.set('anonymous');
    this.error.set(null);
  }
}

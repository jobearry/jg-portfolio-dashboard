import { Injectable, signal } from '@angular/core';

/**
 * Cross-component signal for opening the token dialog. Kept free of HTTP and
 * router dependencies so guards and interceptors can request the gate safely.
 */
@Injectable({ providedIn: 'root' })
export class AuthGateService {
  readonly unlockRequested = signal(false);

  requestUnlock(): void {
    this.unlockRequested.set(true);
  }

  consume(): void {
    this.unlockRequested.set(false);
  }
}

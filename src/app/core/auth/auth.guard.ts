import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthGateService } from './auth-gate.service';
import { AuthTokenStore } from './auth-token-store';

/** Keeps direct dashboard URLs behind the same gate as the dashboard link. */
export const authGuard: CanActivateFn = () => {
  const store = inject(AuthTokenStore);

  if (store.token() && !store.isExpired()) {
    return true;
  }

  store.clear();
  inject(AuthGateService).requestUnlock();

  return inject(Router).createUrlTree(['/']);
};

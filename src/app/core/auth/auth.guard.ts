import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthTokenStore } from './auth-token-store';

/** Keeps direct dashboard URLs behind the same gate as the dashboard link. */
export const authGuard: CanActivateFn = () => {
  if (inject(AuthTokenStore).token()) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};

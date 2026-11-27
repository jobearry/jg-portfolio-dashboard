import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthGateService } from './auth-gate.service';
import { AuthTokenStore } from './auth-token-store';

/** Sends the admin JWT as a Bearer token and reopens the gate on rejection. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthTokenStore);
  const gate = inject(AuthGateService);
  const router = inject(Router);
  const token = store.token();
  const outgoing = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      // /auth/me failures are validation outcomes, shown in the open dialog.
      const isValidation = request.url.endsWith('/v1/auth/me');
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;

      if (isUnauthorized && !isValidation && token) {
        store.clear();
        gate.requestUnlock();
        void router.navigate(['/']);
      }

      return throwError(() => error);
    }),
  );
};

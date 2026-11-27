import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthGateService } from './auth-gate.service';
import { authGuard } from './auth.guard';
import { AuthTokenStore } from './auth-token-store';

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  const redirect = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('returns true when an unexpired token is stored', () => {
    TestBed.inject(AuthTokenStore).set('valid.jwt.token', Date.now() + 3_600_000);

    expect(run()).toBe(true);
  });

  it('redirects to the résumé when no token is stored', () => {
    expect(run() instanceof UrlTree).toBe(true);
    expect(redirect(run())).toBe('/');
  });

  it('clears an expired token, requests the gate, and redirects', () => {
    const store = TestBed.inject(AuthTokenStore);
    const gate = TestBed.inject(AuthGateService);
    store.set('expired.jwt.token', Date.now() - 1_000);

    expect(run() instanceof UrlTree).toBe(true);
    expect(store.token()).toBeNull();
    expect(gate.unlockRequested()).toBe(true);
    expect(redirect(run())).toBe('/');
  });
});

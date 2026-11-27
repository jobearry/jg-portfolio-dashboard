import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { type MockInstance, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthGateService } from './auth-gate.service';
import { authInterceptor } from './auth.interceptor';
import { AuthTokenStore } from './auth-token-store';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let store: AuthTokenStore;
  let gate: AuthGateService;
  let navigate: MockInstance;

  const OVERVIEW = `${environment.portfolioApi}/v1/overview`;
  const ME = `${environment.portfolioApi}/v1/auth/me`;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    store = TestBed.inject(AuthTokenStore);
    gate = TestBed.inject(AuthGateService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('sends the stored token as a Bearer header', async () => {
    store.set('stored.jwt.token', Date.now() + 3_600_000);
    const result = firstValueFrom(client.get(OVERVIEW));

    const request = http.expectOne(OVERVIEW);
    expect(request.request.headers.get('Authorization')).toBe('Bearer stored.jwt.token');
    request.flush([]);
    await result;
  });

  it('clears the token, requests the gate, and returns home on a 401', async () => {
    store.set('rejected.jwt.token', Date.now() + 3_600_000);
    const result = firstValueFrom(client.get(OVERVIEW)).catch(() => null);

    http.expectOne(OVERVIEW).flush({}, { status: 401, statusText: 'Unauthorized' });
    await result;

    expect(store.token()).toBeNull();
    expect(gate.unlockRequested()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('leaves /auth/me 401s to the open dialog', async () => {
    store.set('bad.jwt.token', Date.now() + 3_600_000);
    const result = firstValueFrom(client.get(ME)).catch(() => null);

    http.expectOne(ME).flush({}, { status: 401, statusText: 'Unauthorized' });
    await result;

    expect(store.token()).toBe('bad.jwt.token');
    expect(gate.unlockRequested()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

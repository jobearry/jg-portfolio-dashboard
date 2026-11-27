import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AuthTokenStore } from './auth-token-store';

describe('AuthService', () => {
  let http: HttpTestingController;
  let service: AuthService;
  let store: AuthTokenStore;

  const meRequest = () => http.expectOne(`${environment.portfolioApi}/v1/auth/me`);
  const claims = (expSeconds = Math.floor(Date.now() / 1000) + 3600) => ({
    sub: ['portfolio-api'],
    role: ['Admin'],
    exp: [String(expSeconds)],
  });

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
    store = TestBed.inject(AuthTokenStore);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => http.verify());

  it('verify_WhenTokenIsValid_SendsBearerTokenAndStoresExpiry', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const result = service.verify('  good.jwt.token  ');
    const request = meRequest();

    expect(request.request.headers.get('Authorization')).toBe('Bearer good.jwt.token');
    request.flush(claims(expiresAt));

    await expect(result).resolves.toBe(true);
    expect(store.token()).toBe('good.jwt.token');
    expect(store.expiresAt()).toBe(expiresAt * 1000);
    expect(service.status()).toBe('authenticated');
    expect(JSON.parse(sessionStorage.getItem('portfolio-admin-token') ?? '{}')).toEqual({
      token: 'good.jwt.token',
      expiresAt: expiresAt * 1000,
    });
  });

  it('verify_WhenApiRejectsToken_ClearsTokenAndSetsError', async () => {
    const result = service.verify('expired.jwt.token');
    meRequest().flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(result).resolves.toBe(false);
    expect(store.token()).toBeNull();
    expect(sessionStorage.getItem('portfolio-admin-token')).toBeNull();
    expect(service.status()).toBe('error');
    expect(service.error()).toBeTruthy();
  });

  it('verify_WhenClaimsHaveNoExp_RejectsToken', async () => {
    const result = service.verify('no-exp.jwt.token');
    meRequest().flush({ sub: ['portfolio-api'], role: ['Admin'] });

    await expect(result).resolves.toBe(false);
    expect(store.token()).toBeNull();
    expect(service.status()).toBe('error');
  });

  it('verify_WhenTokenIsBlank_ReturnsErrorWithoutCallingApi', async () => {
    await expect(service.verify('   ')).resolves.toBe(false);

    expect(service.status()).toBe('error');
    expect(service.error()).toBeTruthy();
    http.expectNone(() => true);
  });

  it('clear_RemovesTokenAndResetsStatus', async () => {
    const result = service.verify('good.jwt.token');
    meRequest().flush(claims());
    await result;

    service.clear();

    expect(store.token()).toBeNull();
    expect(service.status()).toBe('anonymous');
    expect(service.error()).toBeNull();
  });

  it('token_WhenLegacyRawTokenWasStored_IgnoresIt', () => {
    sessionStorage.setItem('portfolio-admin-token', 'restored.jwt.token');

    expect(new AuthTokenStore().token()).toBeNull();
  });
});

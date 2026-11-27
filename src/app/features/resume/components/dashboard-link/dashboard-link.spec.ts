import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { type MockInstance, vi } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { AuthGateService } from '../../../../core/auth/auth-gate.service';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { AuthTokenStore } from '../../../../core/auth/auth-token-store';
import { DashboardLink } from './dashboard-link';

describe('DashboardLink', () => {
  let fixture: ComponentFixture<DashboardLink>;
  let http: HttpTestingController;
  let navigate: MockInstance;

  const element = () => fixture.nativeElement as HTMLElement;
  const trigger = () =>
    element().querySelector('button[aria-label="View dashboard"]') as HTMLButtonElement;
  const dialog = () => element().querySelector('[role="dialog"]');
  const input = () => element().querySelector('#dashboard-token') as HTMLInputElement;

  const fill = (value: string) => {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = () => {
    element()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  const settle = async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [DashboardLink],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(DashboardLink);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('renders a button rather than a direct dashboard link', () => {
    expect(trigger()).toBeTruthy();
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(element().querySelector('a[aria-label="View dashboard"]')).toBeNull();
  });

  it('opens the token dialog and focuses the input', async () => {
    trigger().click();
    fixture.detectChanges();
    await Promise.resolve();

    expect(dialog()).toBeTruthy();
    expect(document.activeElement).toBe(input());
  });

  it('shows an error and stays open when the token is rejected', async () => {
    trigger().click();
    fixture.detectChanges();
    fill('rejected.jwt.token');

    submit();
    http
      .expectOne(`${environment.portfolioApi}/v1/auth/me`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(dialog()).toBeTruthy();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('rejected');
    expect(navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(AuthTokenStore).token()).toBeNull();
  });

  it('navigates to the dashboard when the token is accepted', async () => {
    trigger().click();
    fixture.detectChanges();
    fill('valid.jwt.token');

    submit();
    http.expectOne(`${environment.portfolioApi}/v1/auth/me`).flush({
      sub: ['portfolio-api'],
      role: ['Admin'],
      exp: [String(Math.floor(Date.now() / 1000) + 3600)],
    });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(dialog()).toBeNull();
    expect(TestBed.inject(AuthTokenStore).token()).toBe('valid.jwt.token');
  });

  it('opens the dialog automatically when the gate requests an unlock', async () => {
    TestBed.inject(AuthGateService).requestUnlock();
    await settle();

    expect(dialog()).toBeTruthy();
    expect(TestBed.inject(AuthGateService).unlockRequested()).toBe(false);
  });
});

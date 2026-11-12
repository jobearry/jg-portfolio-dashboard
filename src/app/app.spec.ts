import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { ShellStateService } from './features/dashboard/shell/shell-state.service';
import { environment } from '../environments/environment';

describe('App shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the shell and the routed page for /dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/dashboard');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-shell-sidebar')).toBeTruthy();
    expect(element.querySelector('app-shell-header')).toBeTruthy();
    expect(router.url).toBe('/dashboard');
  });

  it('redirects unknown paths to /dashboard', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/does-not-exist');

    expect(router.url).toBe('/dashboard');
  });

  it('serves the resume landing page at /', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const resumeShell = element.querySelector('app-home > main');
    expect(router.url).toBe('/');
    expect(element.querySelector('app-shell-sidebar')).toBeFalsy();
    expect(element.querySelector('app-maintenance')).toBeFalsy();
    expect(resumeShell?.classList.contains('mx-auto')).toBe(true);
    expect(resumeShell?.classList.contains('max-w-6xl')).toBe(true);
    expect(resumeShell?.classList.contains('sm:pt-10')).toBe(true);
    expect(element.querySelector('app-hero')).toBeTruthy();
    expect(element.querySelector('app-resume-header')).toBeTruthy();
    expect(element.querySelector('app-resume-footer')).toBeTruthy();
    expect(element.querySelector('a[href="/dashboard"]')).toBeTruthy();
    const profileImage = element.querySelector('#hero-image');
    expect(profileImage?.getAttribute('src')).toBe(`${environment.imgDir}/jg-profile.png`);
    expect(profileImage?.classList.contains('size-24')).toBe(true);
    expect(profileImage?.classList.contains('sm:size-28')).toBe(true);
    expect(profileImage?.classList.contains('md:size-32')).toBe(true);
    expect(profileImage?.classList.contains('rounded-full')).toBe(true);
    expect(profileImage?.classList.contains('object-cover')).toBe(true);
  });

  it('releases the mobile sidebar scroll lock when View profile opens the résumé', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const sidebarState = TestBed.inject(ShellStateService);
    const previousOverflow = document.body.style.overflow;

    await router.navigateByUrl('/dashboard');
    await fixture.whenStable();
    fixture.detectChanges();

    sidebarState.openMobile();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    const element = fixture.nativeElement as HTMLElement;
    (
      element.querySelector('app-user-menu button[aria-haspopup="menu"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (element.querySelector('a[role="menuitem"][href="/"]') as HTMLAnchorElement).click();

    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(router.url).toBe('/');
    expect(element.querySelector('app-shell-sidebar')).toBeFalsy();
    expect(sidebarState.mobileOpen()).toBe(false);
    expect(document.body.style.overflow).toBe(previousOverflow);
  });

  it('serves the projects page at /projects', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/projects');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(router.url).toBe('/projects');
    expect(element.querySelector('app-shell-sidebar')).toBeFalsy();
    expect(element.querySelectorAll('app-block').length).toBeGreaterThanOrEqual(2);
    expect(element.querySelector('app-github')).toBeTruthy();
    expect(element.querySelector('a[href="/dashboard"]')).toBeTruthy();
  });

  it('redirects the legacy /profile path to the résumé at /', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/profile');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(router.url).toBe('/');
    expect(element.querySelector('app-shell-sidebar')).toBeFalsy();
    expect(element.querySelector('app-hero')).toBeTruthy();
  });

  it('keeps every live route reachable', async () => {
    const router = TestBed.inject(Router);

    for (const path of ['/timeline', '/blog']) {
      await router.navigateByUrl(path);
      expect(router.url).toBe(path);
    }
  });

  it('derives the header title from the active route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/timeline');
    await fixture.whenStable();
    fixture.detectChanges();

    const heading = (fixture.nativeElement as HTMLElement).querySelector('header h1');
    expect(heading?.textContent?.trim()).toBe('Timeline');
  });

  it('marks the active sidebar link with aria-current', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/blog');
    await fixture.whenStable();
    fixture.detectChanges();

    const active = (fixture.nativeElement as HTMLElement).querySelector('a[aria-current="page"]');
    expect(active?.textContent).toContain('Blog');
  });
});

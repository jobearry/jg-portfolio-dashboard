import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthTokenStore } from '../../../../core/auth/auth-token-store';
import { UserMenu } from './user-menu';

describe('UserMenu', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [UserMenu],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  function create() {
    const fixture = TestBed.createComponent(UserMenu);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;

    return { fixture, element, trigger };
  }

  it('opens the menu from the trigger', () => {
    const { fixture, element, trigger } = create();

    trigger.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="menu"]')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('links View profile to the résumé at /', () => {
    const { fixture, element, trigger } = create();

    trigger.click();
    fixture.detectChanges();

    const profileLink = element.querySelector('a[role="menuitem"]');
    expect(profileLink?.getAttribute('href')).toBe('/');
  });

  it('switches the theme, then closes the menu', () => {
    const { fixture, element, trigger } = create();
    trigger.click();
    fixture.detectChanges();

    const themeItem = element.querySelector(
      '[role="menu"] button[role="menuitem"]',
    ) as HTMLButtonElement;
    expect(themeItem.textContent).toContain('Switch to light mode');

    themeItem.click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(element.querySelector('[role="menu"]')).toBeFalsy();
  });

  it('supports arrow navigation and Escape', async () => {
    const { fixture, element, trigger } = create();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await Promise.resolve();

    const items = Array.from(element.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    expect(document.activeElement).toBe(items[0]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);

    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelector('[role="menu"]')).toBeFalsy();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on an outside pointerdown', () => {
    const { fixture, element, trigger } = create();
    trigger.click();
    fixture.detectChanges();

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelector('[role="menu"]')).toBeFalsy();
  });

  it('shows the remaining session time in the menu', () => {
    TestBed.inject(AuthTokenStore).set('secret.jwt.token', Date.now() + 10 * 60_000);

    const { fixture, element, trigger } = create();
    trigger.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="menu"]')?.textContent).toContain('Session expires in 10m');
  });

  it('hides the countdown when no session is stored', () => {
    const { fixture, element, trigger } = create();
    trigger.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="menu"]')?.textContent).not.toContain('Session expires in');
  });

  it('clears the token and returns to the résumé when locking', () => {
    const store = TestBed.inject(AuthTokenStore);
    store.set('secret.jwt.token', Date.now() + 3_600_000);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const { fixture, element, trigger } = create();
    trigger.click();
    fixture.detectChanges();

    const lockItem = [
      ...element.querySelectorAll<HTMLElement>('[role="menu"] button[role="menuitem"]'),
    ].find((item) => item.textContent?.includes('Lock dashboard')) as HTMLButtonElement;
    lockItem.click();
    fixture.detectChanges();

    expect(store.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(element.querySelector('[role="menu"]')).toBeFalsy();
  });
});

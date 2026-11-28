import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;

  const element = () => fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element().querySelector(`#${id}`) as HTMLElement;

  function render(): void {
    fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.setItem('portfolio-theme', 'dark');
    await TestBed.configureTestingModule({
      imports: [Settings],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('portfolio-theme');
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('renders only the appearance control', () => {
    render();

    expect(byId('theme-light')).toBeTruthy();
    expect(byId('theme-dark')).toBeTruthy();
    expect(element().textContent).toContain('Appearance');
    expect(element().querySelector('[data-testid="category-form"]')).toBeNull();
    expect(element().querySelector('[data-testid="skill-form"]')).toBeNull();
  });

  it('theme_UsesSegmentedControlToSetLightAndDark', () => {
    render();

    const light = byId('theme-light') as HTMLButtonElement;
    const dark = byId('theme-dark') as HTMLButtonElement;

    expect(dark.getAttribute('aria-pressed')).toBe('true');

    light.click();
    fixture.detectChanges();

    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('portfolio-theme')).toBe('light');

    dark.click();
    fixture.detectChanges();

    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('portfolio-theme')).toBe('dark');
  });
});

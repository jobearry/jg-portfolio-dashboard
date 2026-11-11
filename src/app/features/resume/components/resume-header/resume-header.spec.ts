import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResumeHeader } from './resume-header';

describe('ResumeHeader', () => {
  const render = () => {
    const fixture = TestBed.createComponent(ResumeHeader);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('renders the initials brand, section navigation, and app controls', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;

    const brand = element.querySelector('a[aria-label="Jonathan Golimlim, home"]');
    expect(brand?.getAttribute('href')).toBe('/');
    expect(brand?.textContent).toContain('JG');

    const links = [...element.querySelectorAll('nav a')];
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'About',
      'Experience',
      'Tech Stack',
      'Work',
      'Contact',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/#about',
      '/#experience',
      '/#tech-stack',
      '/#work',
      '/#contact',
    ]);

    expect(element.querySelector('a[aria-label="View dashboard"]')?.getAttribute('href')).toBe(
      '/dashboard',
    );
  });

  it('exposes a theme toggle with an action-specific label', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector('button') as HTMLButtonElement;

    const initialLabel = toggle.getAttribute('aria-label');
    expect(initialLabel).toMatch(/^Switch to (light|dark) theme$/);

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-label')).not.toBe(initialLabel);
  });
});

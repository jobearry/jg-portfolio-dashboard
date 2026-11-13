import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecentRepositories } from './recent-repositories';

describe('RecentRepositories', () => {
  let http: HttpTestingController;

  const request = () => http.expectOne((req) => req.url.endsWith('/repositories'));

  const render = () => {
    const fixture = TestBed.createComponent(RecentRepositories);
    fixture.detectChanges();
    return fixture;
  };

  const settle = async (fixture: ReturnType<typeof render>) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  const repository = (id: number) => ({
    id,
    name: `repo-${id}`,
    fullName: `jobearry/repo-${id}`,
    htmlUrl: `https://github.com/jobearry/repo-${id}`,
    description: `Description ${id}`,
    language: 'TypeScript',
    topics: ['angular', 'dotnet'],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows only the first three repositories returned by the API as cards', async () => {
    const fixture = render();
    request().flush([repository(1), repository(2), repository(3), repository(4)]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(
      [...element.querySelectorAll('li h3')].map((heading) => heading.textContent?.trim()),
    ).toEqual(['repo-1', 'repo-2', 'repo-3']);
    expect(element.textContent).toContain('Description 1');
    expect(element.textContent).toContain('TypeScript');
    expect(element.textContent).toContain('angular');
    const link = element.querySelector('li a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://github.com/jobearry/repo-1');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('links to the projects page for the full list', async () => {
    const fixture = render();
    request().flush([repository(1), repository(2)]);
    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector('a[href="/projects"]');

    expect(link?.getAttribute('href')).toBe('/projects');
    expect(link?.classList.contains('text-accent-brand')).toBe(true);
    expect(element.querySelector('.h-54')).toBeNull();
    expect(element.querySelector('.overflow-y-auto')).toBeNull();
  });

  it('shows a loading state while the request is pending', () => {
    const fixture = render();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-skeleton')).not.toBeNull();
    request().flush([]);
  });

  it('shows an empty message when no repositories are returned', async () => {
    const fixture = render();
    request().flush([]);

    await settle(fixture);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('No public repositories');
  });

  it('shows an error and retries the repository request', async () => {
    const fixture = render();
    request().flush('boom', { status: 503, statusText: 'Unavailable' });

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('503');
    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    request().flush([repository(1)]);

    await settle(fixture);

    expect(element.querySelector('li h3')?.textContent?.trim()).toBe('repo-1');
  });
});

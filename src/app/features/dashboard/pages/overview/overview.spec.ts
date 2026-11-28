import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { site } from '../../../../core/config/site.config';
import { OverviewItem } from '../../core/models/overview-item';
import { Overview } from './overview';

const GITHUB_PATH = `github/owner/${site.github.username}/repositories/count`;
const NOTION_PATH = `notion/${site.notion.pageId}/count`;

describe('Overview', () => {
  let http: HttpTestingController;

  const overviewRequest = () => http.expectOne((req) => req.url.endsWith('/v1/overview'));
  const githubRequest = () => http.expectOne((req) => req.url.includes(GITHUB_PATH));
  const notionRequest = () => http.expectOne((req) => req.url.includes(NOTION_PATH));

  const flushOverview = (content: OverviewItem[] = []) => overviewRequest().flush(content);
  const flushGithub = (count = 14) => githubRequest().flush({ key: 'githubRepositories', count });
  const flushNotion = (count = 23) => notionRequest().flush({ key: 'notionPages', count });

  const settle = async (fixture: ComponentFixture<Overview>) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  const element = (fixture: ComponentFixture<Overview>) => fixture.nativeElement as HTMLElement;

  const cardFor = (fixture: ComponentFixture<Overview>, key: string) =>
    element(fixture).querySelector(`[data-metric-key="${key}"]`) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders a retryable error instead of a stuck skeleton when the overview request fails', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    overviewRequest().flush('boom', { status: 500, statusText: 'Server Error' });
    flushGithub();
    flushNotion();

    await settle(fixture);

    const error = element(fixture).querySelector('[role="alert"]');
    expect(element(fixture).querySelector('app-skeleton')).toBeNull();
    expect(error?.textContent).toContain('500');
    expect(error?.querySelector('button')?.textContent).toContain('Try again');
    expect(cardFor(fixture, 'githubRepositories')?.textContent).toContain('14');
    expect(cardFor(fixture, 'notionPages')?.textContent).toContain('23');
  });

  it('uses the shared centered content column', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview();
    flushGithub();
    flushNotion();

    await settle(fixture);

    const section = element(fixture).querySelector('section');
    expect(section?.classList.contains('mx-auto')).toBe(true);
    expect(section?.classList.contains('max-w-5xl')).toBe(true);
    expect(section?.classList.contains('px-2')).toBe(true);
    expect(section?.classList.contains('sm:px-6')).toBe(true);
    expect(section?.classList.contains('lg:px-10')).toBe(true);
  });

  it('renders an empty state when the API returns no metrics', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview();
    flushGithub();
    flushNotion();

    await settle(fixture);

    expect(element(fixture).querySelector('[role="status"]')?.textContent).toContain(
      'No overview metrics',
    );
    expect(cardFor(fixture, 'projects')).toBeNull();
    expect(cardFor(fixture, 'githubRepositories')?.textContent).toContain('14');
  });

  it('renders an informational metric card with its subtitle and no action button', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview([{ key: 'projects', count: 3 }]);
    flushGithub();
    flushNotion();

    await settle(fixture);

    const card = cardFor(fixture, 'projects');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('PROJECTS');
    expect(card?.textContent).toContain('Selected work and portfolio projects');
    expect(card?.textContent).toContain('3');
    expect(card?.querySelector('button')).toBeNull();
    expect(element(fixture).querySelector('app-skeleton')).toBeNull();
    expect(element(fixture).querySelector('header')?.textContent).toContain(site.profile.name);

    const grid = card?.parentElement;
    expect(grid?.classList.contains('grid-cols-2')).toBe(true);
    expect(grid?.classList.contains('lg:grid-cols-3')).toBe(true);
  });

  it('renders dynamic metric keys in uppercase with key-derived subtitle copy', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview([{ key: 'open_roles', count: 2 }]);
    flushGithub();
    flushNotion();

    await settle(fixture);

    const card = cardFor(fixture, 'open_roles');
    expect(card?.querySelector('h3')?.textContent).toContain('OPEN ROLES');
    expect(card?.textContent).toContain('Overview of open roles');
  });

  it('renders a matching subtitle for each known overview metric', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview([
      { key: 'projects', count: 5 },
      { key: 'skills', count: 21 },
      { key: 'recommendations', count: 2 },
    ]);
    flushGithub();
    flushNotion();

    await settle(fixture);

    const subtitles = ['projects', 'skills', 'recommendations'].map((key) =>
      cardFor(fixture, key)?.querySelector('[data-subtitle]')?.textContent?.trim(),
    );
    expect(subtitles).toEqual([
      'Selected work and portfolio projects',
      'Technologies and tools in my toolkit',
      'Feedback from people I have worked with',
    ]);
  });

  it('renders the GitHub repository and Notion page counts', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview([{ key: 'projects', count: 3 }]);
    flushGithub(14);
    flushNotion(23);

    await settle(fixture);

    const github = cardFor(fixture, 'githubRepositories');
    expect(github?.textContent).toContain('GITHUB REPOSITORIES');
    expect(github?.textContent).toContain('14');
    expect(github?.textContent).toContain('Public repositories on GitHub');

    const notion = cardFor(fixture, 'notionPages');
    expect(notion?.textContent).toContain('NOTION PAGES');
    expect(notion?.textContent).toContain('23');
    expect(notion?.textContent).toContain('Blog posts through my Notion workspace');
  });

  it('keeps the other metrics visible when a count fails and retries only that count', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    flushOverview([{ key: 'projects', count: 3 }]);
    githubRequest().flush('boom', { status: 503, statusText: 'Unavailable' });
    flushNotion();

    await settle(fixture);

    const failed = cardFor(fixture, 'githubRepositories');
    expect(failed?.querySelector('[role="alert"]')?.textContent).toContain('503');
    expect(failed?.querySelector('button')?.textContent).toContain('Try again');
    expect(cardFor(fixture, 'projects')?.textContent).toContain('3');
    expect(cardFor(fixture, 'notionPages')?.textContent).toContain('23');

    failed?.querySelector('button')?.click();
    fixture.detectChanges();

    http.expectNone((req) => req.url.endsWith('/v1/overview'));
    http.expectNone((req) => req.url.includes(NOTION_PATH));
    githubRequest().flush({ key: 'githubRepositories', count: 15 });

    await settle(fixture);

    const retried = cardFor(fixture, 'githubRepositories');
    expect(retried?.textContent).toContain('15');
    expect(retried?.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows metric skeletons while the requests are in flight', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.detectChanges();

    expect(element(fixture).querySelectorAll('app-skeleton').length).toBe(3);
    expect(cardFor(fixture, 'githubRepositories')?.querySelector('[role="status"]')).not.toBeNull();
    expect(cardFor(fixture, 'notionPages')?.querySelector('[role="status"]')).not.toBeNull();

    flushOverview([{ key: 'projects', count: 1 }]);
    flushGithub();
    flushNotion();

    await settle(fixture);

    expect(element(fixture).querySelectorAll('app-skeleton').length).toBe(0);
  });
});

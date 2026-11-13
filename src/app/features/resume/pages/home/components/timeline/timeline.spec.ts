import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Timeline } from './timeline';

describe('Resume Timeline', () => {
  let http: HttpTestingController;

  const experiencesRequest = () =>
    http.expectOne((request) =>
      request.urlWithParams.endsWith('/v1/experience?includeProjects=false'),
    );

  const render = () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    return fixture;
  };

  const settle = async (fixture: ReturnType<typeof render>) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  const experience = (
    id: number,
    company: string,
    role: string,
    startedAt = '2024-01-01',
    finishedAt: string | null = null,
    responsibility = 'This responsibility should appear',
  ) => ({
    id,
    company,
    description: 'This description should not appear',
    durationMonths: 12,
    finishedAt,
    responsibility,
    role,
    startedAt,
    type: 'Full time',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders the newest three experiences with period, role, company, type, and detail', async () => {
    const fixture = render();
    experiencesRequest().flush([
      experience(1, 'Acme', 'Software Engineer', '2022-01-01', '2024-06-01', 'Built the portal.'),
      experience(2, 'Globex', 'Developer', '2024-01-01', null, 'Led the platform team.'),
      experience(3, 'Initech', 'Engineer', '2020-01-01', '2022-01-01'),
      experience(4, 'Umbrella', 'Intern', '2019-01-01', '2020-01-01'),
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('li')).toHaveLength(3);
    expect(
      [...element.querySelectorAll('li h3')].map((heading) => heading.textContent?.trim()),
    ).toEqual(['Developer', 'Software Engineer', 'Engineer']);
    expect(
      [...element.querySelectorAll('li p.font-mono')].map((period) => period.textContent?.trim()),
    ).toEqual(['2024 — Present', '2022 — 2024', '2020 — 2022']);
    expect(element.textContent).toContain('Globex');
    expect(element.textContent).toContain('Full time');
    expect(element.textContent).toContain('Built the portal.');
    expect(element.textContent).toContain('Led the platform team.');
    expect(element.textContent).not.toContain('This description should not appear');
  });

  it('falls back to the description when a responsibility is empty', async () => {
    const fixture = render();
    experiencesRequest().flush([
      {
        ...experience(1, 'Acme', 'Software Engineer'),
        responsibility: '',
        description: 'Fallback description',
      },
    ]);

    await settle(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Fallback description');
  });

  it('places invalid start dates after valid entries and omits their period', async () => {
    const fixture = render();
    experiencesRequest().flush([
      experience(1, 'Acme', 'Software Engineer', 'not-a-date'),
      experience(2, 'Globex', 'Developer', '2024-01-01'),
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(
      [...element.querySelectorAll('li h3')].map((heading) => heading.textContent?.trim()),
    ).toEqual(['Developer', 'Software Engineer']);
    expect(element.querySelectorAll('li p.font-mono')).toHaveLength(1);
    expect(element.textContent).toContain('2024 — Present');
    expect(element.textContent).not.toContain('Invalid');
    expect(element.textContent).not.toContain('NaN');
  });

  it('shows a loading state while the request is pending', () => {
    const fixture = render();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-skeleton')).not.toBeNull();
    experiencesRequest().flush([]);
  });

  it('shows an empty state when the API returns no experiences', async () => {
    const fixture = render();
    experiencesRequest().flush([]);

    await settle(fixture);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('No experience has been published');
  });

  it('shows an error and retries the experience request', async () => {
    const fixture = render();
    experiencesRequest().flush('boom', { status: 503, statusText: 'Unavailable' });

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('503');
    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    experiencesRequest().flush([experience(1, 'Acme', 'Software Engineer')]);

    await settle(fixture);

    expect(element.textContent).toContain('Acme');
    expect(element.textContent).toContain('Software Engineer');
  });
});

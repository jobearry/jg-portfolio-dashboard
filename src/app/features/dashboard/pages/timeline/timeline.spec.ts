import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ExperienceTimeline } from '../../core';
import { Timeline } from './timeline';

describe('Timeline', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const base: ExperienceTimeline = {
    id: 1,
    company: 'Acme',
    startedAt: '2020-01-01',
    finishedAt: null,
    durationMonths: 12,
    description: 'Built things',
    role: 'Engineer',
    responsibility: 'Shipped features',
    type: 'Full-time',
    projects: null,
  };

  async function render(payload: ExperienceTimeline[]): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();

    http.expectOne((request) => request.url.includes('v1/experience')).flush(payload);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('renders the start year only when the date is valid', async () => {
    const element = await render([base, { ...base, id: 2, startedAt: 'not-a-date' }]);
    const year = element.querySelector('.tabular-nums');

    expect(element.textContent).toContain('2020');
    expect(element.querySelectorAll('.tabular-nums').length).toBe(1);
    expect(year?.classList.contains('border-accent-brand/30')).toBe(true);
    expect(year?.classList.contains('bg-accent-brand/10')).toBe(true);
    expect(year?.classList.contains('text-accent-brand')).toBe(true);
    expect(element.textContent).not.toContain('Invalid');
    expect(element.textContent).not.toContain('NaN');
  });

  it('orders experiences by start date descending', async () => {
    const element = await render([
      { ...base, id: 1, company: 'Older', startedAt: '2020-01-01' },
      { ...base, id: 2, company: 'Middle', startedAt: '2022-01-01' },
      { ...base, id: 3, company: 'Newest', startedAt: '2024-06-01' },
    ]);

    expect(
      [...element.querySelectorAll('li > div h3')].map((heading) => heading.textContent),
    ).toEqual(['Newest', 'Middle', 'Older']);
  });

  it('renders nested projects and tech chips', async () => {
    const element = await render([
      {
        ...base,
        projects: [
          {
            id: 9,
            projectName: 'Portal',
            description: 'Internal dashboard',
            contribution: '',
            techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
          },
        ],
      },
    ]);

    expect(element.textContent).toContain('Portal');
    expect(element.textContent).toContain('Angular');
  });

  it('shows an empty state when there is no experience', async () => {
    const element = await render([]);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('No experience');
    expect(element.querySelectorAll('li').length).toBe(0);
  });
});

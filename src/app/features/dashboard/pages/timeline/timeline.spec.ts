import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ExperienceTimeline } from '../../core';
import { Timeline } from './timeline';

@Component({ template: '' })
class ExperienceProjectsStub {}

describe('Timeline', () => {
  let http: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'dashboard/experience/:experienceId/projects',
            component: ExperienceProjectsStub,
          },
        ]),
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function setup(payload: ExperienceTimeline[]): Promise<ComponentFixture<Timeline>> {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();

    http.expectOne((request) => request.url.includes('v1/experience')).flush(payload);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    return fixture;
  }

  async function render(payload: ExperienceTimeline[]): Promise<HTMLElement> {
    return (await setup(payload)).nativeElement as HTMLElement;
  }

  function fill(element: HTMLElement, id: string, value: string): void {
    const input = element.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submitForm(element: HTMLElement): void {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
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

  it('uses a centered content column with larger responsive gutters', async () => {
    const element = await render([base]);
    const section = element.querySelector('section');

    expect(section?.classList.contains('mx-auto')).toBe(true);
    expect(section?.classList.contains('max-w-5xl')).toBe(true);
    expect(section?.classList.contains('px-2')).toBe(true);
    expect(section?.classList.contains('sm:px-6')).toBe(true);
    expect(section?.classList.contains('lg:px-10')).toBe(true);
  });

  it('renders one ordered vertical timeline entry per experience', async () => {
    const element = await render([base, { ...base, id: 2, company: 'Second' }]);
    const list = element.querySelector('ol');
    const entries = [...element.querySelectorAll('ol > li')];
    const cards = [...element.querySelectorAll('ol > li > article')];

    expect(list?.classList.contains('border-l')).toBe(true);
    expect(list?.classList.contains('space-y-6')).toBe(true);
    expect(list?.classList.contains('grid')).toBe(false);
    expect(entries).toHaveLength(2);
    expect(
      entries.every((entry) => {
        const node = entry.firstElementChild;

        return (
          node?.getAttribute('aria-hidden') === 'true' &&
          node.classList.contains('bg-accent-brand') &&
          node.classList.contains('rounded-full')
        );
      }),
    ).toBe(true);
    expect(cards.every((card) => card.classList.contains('min-h-64'))).toBe(true);
  });

  it('places the edit action in the upper-right card actions', async () => {
    const element = await render([base]);
    const card = element.querySelector('ol > li > article') as HTMLElement;
    const button = card.querySelector(
      'button[aria-label="Edit experience at Acme"]',
    ) as HTMLButtonElement;
    const header = card.firstElementChild?.firstElementChild as HTMLElement;
    const actions = button.parentElement as HTMLElement;

    expect(button.textContent).not.toContain('Edit');
    expect(button.title).toBe('Edit experience');
    expect(button.querySelector('ng-icon')).not.toBeNull();
    expect(header.classList.contains('justify-between')).toBe(true);
    expect(header.firstElementChild?.contains(button)).toBe(false);
    expect(actions.classList.contains('shrink-0')).toBe(true);
    expect(actions.lastElementChild).toBe(button);
  });

  it('renders an icon-only View projects link with a tooltip beside the pencil', async () => {
    const element = await render([base]);
    const link = element.querySelector(
      'a[aria-label="View projects at Acme"]',
    ) as HTMLAnchorElement;

    expect(link.textContent).not.toContain('View projects');
    expect(link.title).toBe('View projects');
    expect(link.getAttribute('href')).toBe('/dashboard/experience/1/projects');
    expect(link.classList.contains('size-9')).toBe(true);
    expect(link.querySelector('ng-icon')).not.toBeNull();
    expect(
      link.parentElement?.contains(
        element.querySelector('button[aria-label="Edit experience at Acme"]'),
      ),
    ).toBe(true);
  });

  it('orders experiences by start date descending', async () => {
    const element = await render([
      { ...base, id: 1, company: 'Older', startedAt: '2020-01-01' },
      { ...base, id: 2, company: 'Middle', startedAt: '2022-01-01' },
      { ...base, id: 3, company: 'Newest', startedAt: '2024-06-01' },
    ]);

    expect(
      [...element.querySelectorAll('ol > li > article h3')].map((heading) => heading.textContent),
    ).toEqual(['Newest', 'Middle', 'Older']);
  });

  it('does not render inline project blocks in timeline cards', async () => {
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

    expect(element.textContent).not.toContain('Portal');
    expect(element.textContent).not.toContain('Angular');
    expect(element.querySelector('a[aria-label="View projects at Acme"]')).not.toBeNull();
  });

  it('View projects_WhenClicked_NavigatesToTheRoutedProjectsPage', async () => {
    const fixture = await setup([base]);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('a[aria-label="View projects at Acme"]') as HTMLAnchorElement).click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/dashboard/experience/1/projects');
    expect(element.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('shows an empty state with the add action when there is no experience', async () => {
    const element = await render([]);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('No experience');
    expect(element.querySelectorAll('li').length).toBe(0);
    expect(element.querySelector('button[aria-label="Add experience"]')).not.toBeNull();
  });

  it('renders the add action in a toolbar separate from the page header', async () => {
    const element = await render([base]);
    const header = element.querySelector('app-page-header') as HTMLElement;
    const button = element.querySelector('button[aria-label="Add experience"]') as HTMLElement;
    const toolbar = button.parentElement as HTMLElement;

    expect(header.contains(button)).toBe(false);
    expect(header.parentElement).not.toBe(toolbar);
    expect(toolbar.classList.contains('flex')).toBe(true);
    expect(toolbar.classList.contains('flex-wrap')).toBe(true);
    expect(toolbar.classList.contains('items-center')).toBe(true);
    expect(toolbar.classList.contains('justify-between')).toBe(true);
    expect(toolbar.querySelector('p')?.textContent).toContain('Manage experience entries');
    expect(button.classList.contains('w-fit')).toBe(false);
  });

  it('renders a Present range and duration metadata for current roles', async () => {
    const element = await render([{ ...base, durationMonths: 14, finishedAt: null }]);

    expect(element.textContent).toContain('2020 – Present');
    expect(element.textContent).toContain('1 yr 2 mos');
    expect(element.textContent).toContain('Full-time');
  });

  it('opens the add form from the toolbar action', async () => {
    const fixture = await setup([base]);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('button[aria-label="Add experience"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Add experience');
  });

  it('opens the edit form prefilled from a card action', async () => {
    const fixture = await setup([base]);
    const element = fixture.nativeElement as HTMLElement;

    (
      element.querySelector('button[aria-label="Edit experience at Acme"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect((element.querySelector('#experience-company') as HTMLInputElement).value).toBe('Acme');
  });

  it('create_SubmitsPayloadAndReloadsTheList', async () => {
    const fixture = await setup([base]);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('button[aria-label="Add experience"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fill(element, 'experience-company', 'NewCo');
    fill(element, 'experience-role', 'Lead');
    fill(element, 'experience-started-at', '2024-01-01');
    fixture.detectChanges();
    submitForm(element);
    fixture.detectChanges();

    const post = http.expectOne(`${environment.portfolioApi}/v1/admin/experience`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toMatchObject({ company: 'NewCo', role: 'Lead' });
    post.flush({ ...base, id: 2, company: 'NewCo', startedAt: '2024-01-01T00:00:00Z' });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    http
      .expectOne((request) => request.url.includes('v1/experience'))
      .flush([{ ...base, id: 2, company: 'NewCo', startedAt: '2024-01-01' }]);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeFalsy();
    expect(element.textContent).toContain('NewCo');
  });

  it('create_WhenUnauthorized_LeavesErrorToTheAuthInterceptor', async () => {
    const fixture = await setup([base]);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('button[aria-label="Add experience"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fill(element, 'experience-company', 'NewCo');
    fill(element, 'experience-role', 'Lead');
    fill(element, 'experience-started-at', '2024-01-01');
    fixture.detectChanges();
    submitForm(element);
    fixture.detectChanges();

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/experience`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeFalsy();
    expect(element.querySelector('[role="alert"]')).toBeFalsy();
  });

  it('create_WhenApiRejects_ShowsErrorAndKeepsFormOpen', async () => {
    const fixture = await setup([base]);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('button[aria-label="Add experience"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fill(element, 'experience-company', 'NewCo');
    fill(element, 'experience-role', 'Lead');
    fill(element, 'experience-started-at', '2024-01-01');
    fixture.detectChanges();
    submitForm(element);
    fixture.detectChanges();

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/experience`)
      .flush(
        { title: 'Bad Request', detail: 'Company is required.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeTruthy();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Company is required.');
  });
});

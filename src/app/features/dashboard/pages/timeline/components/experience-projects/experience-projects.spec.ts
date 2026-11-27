import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../../environments/environment';
import { ExperienceDto, ExperienceTimeline, ProjectDto } from '../../../../core';
import { ExperienceProjects } from './experience-projects';

describe('ExperienceProjects', () => {
  let fixture: ComponentFixture<ExperienceProjects>;
  let http: HttpTestingController;

  const experience: ExperienceTimeline = {
    id: 7,
    company: 'Acme',
    role: 'Engineer',
    startedAt: '2020-01-01',
    finishedAt: null,
    durationMonths: 12,
    description: 'Built things',
    responsibility: 'Shipped features',
    type: 'Full-time',
    projects: null,
  };

  const projectDto: ProjectDto = {
    id: 9,
    projectName: 'Portal',
    description: 'Internal dashboard',
    contribution: 'Frontend',
    techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
  };

  const loadUrl = `${environment.portfolioApi}/v1/experience/7`;

  function dtoWith(projects: ProjectDto[] | null): ExperienceDto {
    return {
      id: experience.id,
      company: experience.company,
      role: experience.role,
      startedAt: experience.startedAt,
      finishedAt: experience.finishedAt ?? null,
      durationMonths: experience.durationMonths,
      description: experience.description,
      responsibility: experience.responsibility,
      type: experience.type,
      projects,
    };
  }

  const element = () => fixture.nativeElement as HTMLElement;
  const input = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;

  async function tick(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  async function flushLoad(projects: ProjectDto[] | null): Promise<void> {
    http.expectOne(loadUrl).flush(dtoWith(projects));
    await tick();
  }

  function fillAddForm(): void {
    const name = input('project-name');
    name.value = 'Portal';
    name.dispatchEvent(new Event('input'));
    const description = element().querySelector('#project-description') as HTMLTextAreaElement;
    description.value = 'Internal dashboard';
    description.dispatchEvent(new Event('input'));
    const contribution = element().querySelector('#project-contribution') as HTMLTextAreaElement;
    contribution.value = 'Frontend';
    contribution.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceProjects],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperienceProjects);
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('experience', experience);
  });

  afterEach(() => http.verify());

  it('load_WhenExperienceHasProjects_RendersProjectDetails', async () => {
    fixture.detectChanges();
    await flushLoad([projectDto]);

    expect(element().textContent).toContain('Portal');
    expect(element().textContent).toContain('Internal dashboard');
    expect(element().textContent).toContain('Frontend');
    expect(element().textContent).toContain('Angular');
  });

  it('load_WhenExperienceHasNoProjects_RendersEmptyState', async () => {
    fixture.detectChanges();
    await flushLoad([]);

    expect(element().querySelector('[role="status"]')?.textContent).toContain('No projects yet');
  });

  it('load_WhenApiFails_RendersErrorAndRetries', async () => {
    fixture.detectChanges();
    http.expectOne(loadUrl).flush({}, { status: 503, statusText: 'Service Unavailable' });
    await tick();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('503');

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Try again'))
      ?.click();
    await flushLoad([]);

    expect(element().querySelector('[role="status"]')?.textContent).toContain('No projects yet');
  });

  it('add_WhenSubmitted_CreatesProjectAndReloadsTheExperience', async () => {
    fixture.detectChanges();
    await flushLoad([]);

    (element().querySelector('button[aria-label="Add project"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fillAddForm();
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();

    const post = http.expectOne(`${environment.portfolioApi}/v1/admin/experience/7/project`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      projectName: 'Portal',
      description: 'Internal dashboard',
      contribution: 'Frontend',
    });
    post.flush(projectDto);
    await tick();
    await flushLoad([projectDto]);

    expect(element().textContent).toContain('Portal');
    expect(element().querySelector('#project-name')).toBeFalsy();
  });

  it('add_WhenUnauthorized_EmitsUnauthorizedWithoutShowingFormError', async () => {
    let unauthorized = false;
    fixture.componentInstance.unauthorized.subscribe(() => (unauthorized = true));
    fixture.detectChanges();
    await flushLoad([]);

    (element().querySelector('button[aria-label="Add project"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fillAddForm();
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/experience/7/project`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(unauthorized).toBe(true);
    expect(element().querySelector('[role="alert"]')).toBeFalsy();
  });

  it('add_WhenApiRejects_ShowsFormErrorAndKeepsFormOpen', async () => {
    fixture.detectChanges();
    await flushLoad([]);

    (element().querySelector('button[aria-label="Add project"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fillAddForm();
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/experience/7/project`)
      .flush(
        { title: 'Bad Request', detail: 'Project name is required.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await tick();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'Project name is required.',
    );
    expect(element().querySelector('#project-name')).not.toBeNull();
  });

  it('close_WhenCloseButtonClicked_EmitsCancelled', async () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    fixture.detectChanges();
    await flushLoad([]);

    (element().querySelector('button[aria-label="Close dialog"]') as HTMLButtonElement).click();

    expect(cancelled).toBe(true);
  });
});

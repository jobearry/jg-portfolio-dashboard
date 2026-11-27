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
  const createUrl = `${environment.portfolioApi}/v1/admin/experience/7/project`;
  const updateUrl = `${environment.portfolioApi}/v1/admin/project/9`;

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

  async function initialLoad(projects: ProjectDto[] | null): Promise<void> {
    fixture.detectChanges();
    await flushLoad(projects);
  }

  function fillForm(name: string, description: string, contribution: string): void {
    const projectName = input('project-name');
    projectName.value = name;
    projectName.dispatchEvent(new Event('input'));
    const descriptionInput = element().querySelector('#project-description') as HTMLTextAreaElement;
    descriptionInput.value = description;
    descriptionInput.dispatchEvent(new Event('input'));
    const contributionInput = element().querySelector(
      '#project-contribution',
    ) as HTMLTextAreaElement;
    contributionInput.value = contribution;
    contributionInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function openAdd(): void {
    (element().querySelector('button[aria-label="Add project"]') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function openEdit(): void {
    (
      element().querySelector('button[aria-label="Edit project Portal"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
  }

  function submitForm(): void {
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
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
    await initialLoad([projectDto]);

    expect(element().textContent).toContain('Portal');
    expect(element().textContent).toContain('Internal dashboard');
    expect(element().textContent).toContain('Frontend');
    expect(element().textContent).toContain('Angular');
  });

  it('load_WhenExperienceHasNoProjects_RendersEmptyState', async () => {
    await initialLoad([]);

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

  it('add_WhenSubmitted_PostsOnlyTheProjectAndReloads', async () => {
    await initialLoad([]);
    openAdd();
    expect(element().querySelector('#stack-search')).toBeFalsy();
    fillForm('Portal', 'Internal dashboard', 'Frontend');
    submitForm();

    const post = http.expectOne(createUrl);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      projectName: 'Portal',
      description: 'Internal dashboard',
      contribution: 'Frontend',
    });
    post.flush(projectDto);
    await tick();
    http.expectNone(updateUrl);
    await flushLoad([projectDto]);

    expect(element().textContent).toContain('Portal');
    expect(element().querySelector('#project-name')).toBeFalsy();
  });

  it('add_WhenUnauthorized_EmitsUnauthorizedWithoutShowingFormError', async () => {
    let unauthorized = false;
    fixture.componentInstance.unauthorized.subscribe(() => (unauthorized = true));
    await initialLoad([]);
    openAdd();
    fillForm('Portal', '', '');
    submitForm();

    http.expectOne(createUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(unauthorized).toBe(true);
    expect(element().querySelector('[role="alert"]')).toBeFalsy();
  });

  it('add_WhenApiRejects_ShowsFormErrorAndKeepsFormOpen', async () => {
    await initialLoad([]);
    openAdd();
    fillForm('Portal', '', '');
    submitForm();

    http
      .expectOne(createUrl)
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

  it('renders an icon-only edit action with a tooltip', async () => {
    await initialLoad([projectDto]);

    const button = element().querySelector(
      'button[aria-label="Edit project Portal"]',
    ) as HTMLButtonElement;

    expect(button.textContent).not.toContain('Edit');
    expect(button.title).toBe('Edit project');
    expect(button.querySelector('ng-icon')).not.toBeNull();
  });

  it('edit_OpensTheFormPrefilledWithTheProject', async () => {
    await initialLoad([projectDto]);
    openEdit();

    expect(input('project-name').value).toBe('Portal');
    expect((element().querySelector('#project-description') as HTMLTextAreaElement).value).toBe(
      'Internal dashboard',
    );
    expect((element().querySelector('#project-contribution') as HTMLTextAreaElement).value).toBe(
      'Frontend',
    );
    expect(element().querySelector('#stack-search')).toBeFalsy();
  });

  it('edit_WhenSubmitted_PutsOnlyProjectFieldsAndUpdatesTheRow', async () => {
    await initialLoad([projectDto]);
    openEdit();
    fillForm('Portal 2', 'Updated dashboard', 'Lead');
    submitForm();

    const put = http.expectOne(updateUrl);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      projectName: 'Portal 2',
      description: 'Updated dashboard',
      contribution: 'Lead',
    });
    put.flush({
      ...projectDto,
      projectName: 'Portal 2',
      description: 'Updated dashboard',
      contribution: 'Lead',
    });
    await tick();

    expect(element().textContent).toContain('Portal 2');
    expect(element().textContent).toContain('Updated dashboard');
    expect(element().querySelector('#project-name')).toBeFalsy();
  });

  it('edit_WhenUnauthorized_EmitsUnauthorizedWithoutShowingFormError', async () => {
    let unauthorized = false;
    fixture.componentInstance.unauthorized.subscribe(() => (unauthorized = true));
    await initialLoad([projectDto]);
    openEdit();
    fillForm('Portal 2', '', '');
    submitForm();

    http.expectOne(updateUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(unauthorized).toBe(true);
    expect(element().querySelector('[role="alert"]')).toBeFalsy();
  });

  it('edit_WhenApiRejects_ShowsFormErrorAndKeepsFormOpen', async () => {
    await initialLoad([projectDto]);
    openEdit();
    fillForm('Portal 2', '', '');
    submitForm();

    http
      .expectOne(updateUrl)
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
    await initialLoad([]);

    (element().querySelector('button[aria-label="Close dialog"]') as HTMLButtonElement).click();

    expect(cancelled).toBe(true);
  });
});

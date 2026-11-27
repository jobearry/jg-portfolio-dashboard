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

  const stackDtos = [
    { id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' },
    { id: 2, stackName: 'Spring', imgSrc: null, category: 'Backend' },
  ];

  const loadUrl = `${environment.portfolioApi}/v1/experience/7`;
  const catalogUrl = `${environment.portfolioApi}/v1/skill`;
  const createUrl = `${environment.portfolioApi}/v1/admin/experience/7/project`;
  const replaceUrl = `${environment.portfolioApi}/v1/admin/project/9/tech-stacks`;

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

  async function flushCatalog(): Promise<void> {
    http.expectOne(catalogUrl).flush(stackDtos);
    await tick();
  }

  async function initialLoad(projects: ProjectDto[] | null): Promise<void> {
    fixture.detectChanges();
    await flushLoad(projects);
    await flushCatalog();
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

  function checkStack(id: number): void {
    const checkbox = element().querySelector(
      `input[type="checkbox"][value="${id}"]`,
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function openAdd(): void {
    (element().querySelector('button[aria-label="Add project"]') as HTMLButtonElement).click();
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
    await flushCatalog();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('503');

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Try again'))
      ?.click();
    await flushLoad([]);

    expect(element().querySelector('[role="status"]')?.textContent).toContain('No projects yet');
  });

  it('load_WhenCatalogFails_RendersPickerErrorAndRetries', async () => {
    fixture.detectChanges();
    await flushLoad([]);
    http.expectOne(catalogUrl).flush({}, { status: 503, statusText: 'Service Unavailable' });
    await tick();
    openAdd();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'Stacks could not be loaded.',
    );

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Try again'))
      ?.click();
    await flushCatalog();

    expect(element().querySelector('#stack-search')).not.toBeNull();
  });

  it('add_WhenSubmitted_CreatesProjectWithoutUnnecessaryStackWrite', async () => {
    await initialLoad([]);
    openAdd();
    fillAddForm();
    submitForm();

    const post = http.expectOne(createUrl);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      projectName: 'Portal',
      description: 'Internal dashboard',
      contribution: 'Frontend',
      techStackIds: [],
    });
    post.flush(projectDto);
    await tick();
    http.expectNone(replaceUrl);
    await flushLoad([projectDto]);

    expect(element().textContent).toContain('Portal');
    expect(element().querySelector('#project-name')).toBeFalsy();
  });

  it('add_WhenStacksSelected_CreatesProjectAndReplacesStacks', async () => {
    await initialLoad([]);
    openAdd();
    fillAddForm();
    checkStack(1);
    submitForm();

    const post = http.expectOne(createUrl);
    expect(post.request.body).toMatchObject({ techStackIds: [1] });
    post.flush(projectDto);
    await tick();

    const put = http.expectOne(replaceUrl);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ techStackIds: [1] });
    put.flush(projectDto);
    await tick();
    await flushLoad([projectDto]);

    expect(element().textContent).toContain('Angular');
    expect(element().querySelector('#project-name')).toBeFalsy();
  });

  it('add_WhenStackWriteFails_ShowsNoticeAndKeepsCreatedProject', async () => {
    await initialLoad([]);
    openAdd();
    fillAddForm();
    checkStack(1);
    submitForm();

    http.expectOne(createUrl).flush(projectDto);
    await tick();
    http
      .expectOne(replaceUrl)
      .flush(
        { title: 'Bad Request', detail: 'Invalid stack.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await tick();
    await flushLoad([projectDto]);

    expect(element().querySelector('#project-name')).toBeFalsy();
    expect(element().textContent).toContain('Project created, but tech stacks were not saved.');
    expect(element().textContent).toContain('Portal');
  });

  it('add_WhenUnauthorized_EmitsUnauthorizedWithoutShowingFormError', async () => {
    let unauthorized = false;
    fixture.componentInstance.unauthorized.subscribe(() => (unauthorized = true));
    await initialLoad([]);
    openAdd();
    fillAddForm();
    submitForm();

    http.expectOne(createUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();

    expect(unauthorized).toBe(true);
    expect(element().querySelector('[role="alert"]')).toBeFalsy();
  });

  it('add_WhenApiRejects_ShowsFormErrorAndKeepsFormOpen', async () => {
    await initialLoad([]);
    openAdd();
    fillAddForm();
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

  it('manage_WhenSaved_ReplacesStacksAndUpdatesTheProject', async () => {
    await initialLoad([projectDto]);

    (
      element().querySelector('button[aria-label="Manage stacks for Portal"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const angular = element().querySelector(
      'input[type="checkbox"][value="1"]',
    ) as HTMLInputElement;
    expect(angular.checked).toBe(true);
    checkStack(2);

    [...element().querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Save stacks'))
      ?.click();
    fixture.detectChanges();

    const put = http.expectOne(replaceUrl);
    expect(put.request.body).toEqual({ techStackIds: [1, 2] });
    put.flush({
      ...projectDto,
      techStacks: [
        ...(projectDto.techStacks ?? []),
        { id: 2, stackName: 'Spring', imgSrc: null, category: 'Backend' },
      ],
    });
    await tick();

    expect(element().textContent).toContain('Spring');
    expect(element().querySelector('#stack-search')).toBeFalsy();
  });

  it('close_WhenCloseButtonClicked_EmitsCancelled', async () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    await initialLoad([]);

    (element().querySelector('button[aria-label="Close dialog"]') as HTMLButtonElement).click();

    expect(cancelled).toBe(true);
  });
});

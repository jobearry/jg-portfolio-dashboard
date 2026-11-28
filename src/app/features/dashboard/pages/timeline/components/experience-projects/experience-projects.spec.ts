import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { ExperienceDto, ExperienceTimeline, ProjectDto } from '../../../../core';
import { ExperienceProjects } from './experience-projects';

@Component({ template: '' })
class ProjectDetailStub {}

@Component({ template: '' })
class TimelineStub {}

describe('ExperienceProjects', () => {
  let fixture: ComponentFixture<ExperienceProjects>;
  let http: HttpTestingController;
  let params: BehaviorSubject<ParamMap>;

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

  const element = () => fixture.nativeElement as HTMLElement;
  const input = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;

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

  async function settle(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  function render(): void {
    fixture = TestBed.createComponent(ExperienceProjects);
    fixture.detectChanges();
  }

  async function flushLoad(projects: ProjectDto[] | null): Promise<void> {
    http.expectOne(loadUrl).flush(dtoWith(projects));
    await settle();
  }

  async function initialLoad(projects: ProjectDto[] | null): Promise<void> {
    render();
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

  function submitForm(): void {
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    params = new BehaviorSubject<ParamMap>(convertToParamMap({ experienceId: '7' }));
    const route = {
      paramMap: params.asObservable(),
      get snapshot() {
        return { paramMap: params.value };
      },
    };

    await TestBed.configureTestingModule({
      imports: [ExperienceProjects],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'timeline', component: TimelineStub },
          { path: 'dashboard/project/:id', component: ProjectDetailStub },
        ]),
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('load_WhenExperienceIdIsInvalid_ShowsErrorWithoutRequestingTheApi', async () => {
    params.next(convertToParamMap({ experienceId: 'abc' }));
    render();
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'Invalid experience id',
    );
    http.expectNone(loadUrl);
  });

  it('load_WhenExperienceHasProjects_RendersProjectsPageAndDetails', async () => {
    await initialLoad([projectDto]);

    expect(element().querySelector('app-page-header')?.textContent).toContain('Projects at Acme');
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
    render();
    http.expectOne(loadUrl).flush({}, { status: 503, statusText: 'Service Unavailable' });
    await settle();

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
    await settle();
    await flushLoad([projectDto]);

    expect(element().textContent).toContain('Portal');
    expect(element().querySelector('#project-name')).toBeFalsy();
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
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(
      'Project name is required.',
    );
    expect(element().querySelector('#project-name')).not.toBeNull();
  });

  it('add_WhenUnauthorized_ClosesTheFormWithoutShowingFormError', async () => {
    await initialLoad([]);
    openAdd();
    fillForm('Portal', '', '');
    submitForm();

    http.expectOne(createUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(element().querySelector('#project-name')).toBeFalsy();
    expect(element().querySelector('[role="alert"]')).toBeFalsy();
  });

  it('list_WhenRendered_HasNoInlineProjectEditAction', async () => {
    await initialLoad([projectDto]);

    expect(element().querySelector('button[aria-label="Edit project Portal"]')).toBeFalsy();
  });

  it('view_WhenProjectLinkClicked_NavigatesToTheProjectScreen', async () => {
    await initialLoad([projectDto]);

    const link = element().querySelector(
      'a[aria-label="View project Portal"]',
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/dashboard/project/9');

    link.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/dashboard/project/9');
  });

  it('back_WhenLinkRendered_PointsToTheTimeline', async () => {
    await initialLoad([]);

    const link = element().querySelector('a[href="/timeline"]') as HTMLAnchorElement;
    expect(link?.textContent).toContain('Back to timeline');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProjectDto } from '../../core';
import { StackPicker } from '../timeline/components/stack-picker/stack-picker';
import { ProjectDetail } from './project';

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;
  let http: HttpTestingController;
  let params: BehaviorSubject<ParamMap>;

  const projectDto: ProjectDto = {
    id: 9,
    projectName: 'Portal',
    description: 'Internal dashboard',
    contribution: 'Frontend',
    techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
  };

  const stacks = [
    { id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' },
    { id: 2, stackName: 'Spring', imgSrc: null, category: 'Backend' },
  ];

  const projectUrl = `${environment.portfolioApi}/v1/project/9`;
  const fieldsUrl = `${environment.portfolioApi}/v1/admin/project/9`;
  const skillsUrl = `${environment.portfolioApi}/v1/skill`;
  const replaceUrl = `${environment.portfolioApi}/v1/admin/project/9/tech-stacks`;

  const element = () => fixture.nativeElement as HTMLElement;

  async function settle(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  function render(): void {
    fixture = TestBed.createComponent(ProjectDetail);
    fixture.detectChanges();
  }

  function flushLoad(dto: ProjectDto = projectDto): void {
    http.expectOne(projectUrl).flush(dto);
    http.expectOne(skillsUrl).flush(stacks);
  }

  async function initialLoad(dto: ProjectDto = projectDto): Promise<void> {
    render();
    flushLoad(dto);
    await settle();
  }

  function picker(): StackPicker {
    return fixture.debugElement.query(By.directive(StackPicker)).componentInstance as StackPicker;
  }

  function buttonWithText(text: string): HTMLButtonElement | undefined {
    return [...element().querySelectorAll('button')].find((button) =>
      button.textContent?.includes(text),
    ) as HTMLButtonElement | undefined;
  }

  function editButton(): HTMLButtonElement {
    return element().querySelector(
      'button[aria-label="Edit project details"]',
    ) as HTMLButtonElement;
  }

  function openEdit(): void {
    editButton().click();
    fixture.detectChanges();
  }

  function fillFields(name: string, description: string, contribution: string): void {
    const projectName = element().querySelector('#project-name') as HTMLInputElement;
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

  function submitFields(): void {
    element()
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true }));
    fixture.detectChanges();
  }

  function saveSkills(): void {
    buttonWithText('Save skills')?.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    params = new BehaviorSubject<ParamMap>(convertToParamMap({ id: '9' }));
    const route = {
      paramMap: params.asObservable(),
      get snapshot() {
        return { paramMap: params.value };
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('load_WhenProjectAndSkillsReturn_RendersDetailsAndSelectedChips', async () => {
    await initialLoad();

    expect(element().textContent).toContain('Portal');
    expect(element().textContent).toContain('Internal dashboard');
    expect(element().querySelector('#stack-search')).toBeTruthy();
    expect(element().querySelector('button[aria-label="Remove Angular"]')).toBeTruthy();
    expect(editButton().querySelector('ng-icon')).not.toBeNull();
    expect(editButton().title).toBe('Edit project');
    expect(element().querySelector('a[href="/timeline"]')?.textContent).toContain(
      'Back to timeline',
    );
  });

  it('load_WhenIdIsInvalid_ShowsErrorWithoutRequestingTheApi', async () => {
    params.next(convertToParamMap({ id: 'abc' }));
    render();
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('Invalid project id');
    http.expectNone(projectUrl);
    http.expectNone(skillsUrl);
  });

  it('load_WhenProjectIsMissing_ShowsErrorAndRetries', async () => {
    render();
    http.expectOne(projectUrl).flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne(skillsUrl).flush(stacks);
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('404');

    buttonWithText('Try again')?.click();
    flushLoad();
    await settle();

    expect(element().textContent).toContain('Portal');
  });

  it('load_WhenSkillsFail_ShowsErrorAndRetries', async () => {
    render();
    http.expectOne(projectUrl).flush(projectDto);
    http.expectOne(skillsUrl).flush({}, { status: 503, statusText: 'Service Unavailable' });
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('503');

    buttonWithText('Try again')?.click();
    flushLoad();
    await settle();

    expect(element().querySelector('#stack-search')).toBeTruthy();
  });

  it('saveSkills_WhenNothingChanged_KeepsSaveDisabled', async () => {
    await initialLoad();

    expect((buttonWithText('Save skills') as HTMLButtonElement).disabled).toBe(true);
  });

  it('saveSkills_WhenSelectionChanges_PutsOnlySelectedIdsAndUpdatesChips', async () => {
    await initialLoad();

    picker().selectionChange.emit([2]);
    fixture.detectChanges();
    saveSkills();

    const request = http.expectOne(replaceUrl);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ techStackIds: [2] });
    request.flush({
      ...projectDto,
      techStacks: [{ id: 2, stackName: 'Spring', imgSrc: null, category: 'Backend' }],
    });
    await settle();

    expect(element().querySelector('button[aria-label="Remove Spring"]')).toBeTruthy();
    expect(element().querySelector('button[aria-label="Remove Angular"]')).toBeFalsy();
    expect(element().querySelector('[role="status"]')?.textContent).toContain('Skills saved');
  });

  it('saveSkills_WhenApiRejects_ShowsFormErrorAndKeepsThePicker', async () => {
    await initialLoad();

    picker().selectionChange.emit([]);
    fixture.detectChanges();
    saveSkills();

    http
      .expectOne(replaceUrl)
      .flush(
        { title: 'Bad Request', detail: 'Unknown tech stack.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('Unknown tech stack.');
    expect(element().querySelector('#stack-search')).toBeTruthy();
    expect(element().querySelector('button[aria-label="Remove Angular"]')).toBeFalsy();
  });

  it('saveSkills_WhenUnauthorized_ShowsTheErrorState', async () => {
    await initialLoad();

    picker().selectionChange.emit([]);
    fixture.detectChanges();
    saveSkills();

    http.expectOne(replaceUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain('401');
  });

  it('edit_OpensThePrefilledFieldsFormWithoutStackPicker', async () => {
    await initialLoad();
    openEdit();

    expect((element().querySelector('#project-name') as HTMLInputElement).value).toBe('Portal');
    expect((element().querySelector('#project-description') as HTMLTextAreaElement).value).toBe(
      'Internal dashboard',
    );
    expect((element().querySelector('#project-contribution') as HTMLTextAreaElement).value).toBe(
      'Frontend',
    );
    expect(element().querySelector('app-project-form app-stack-picker')).toBeFalsy();
  });

  it('edit_WhenCancelled_ClosesTheFormWithoutARequest', async () => {
    await initialLoad();
    openEdit();

    buttonWithText('Cancel')?.click();
    fixture.detectChanges();

    expect(element().querySelector('#project-name')).toBeFalsy();
    expect(element().textContent).toContain('Portal');
    http.expectNone(fieldsUrl);
  });

  it('edit_WhenSubmitted_PutsOnlyProjectFieldsAndShowsTheUpdatedDetails', async () => {
    await initialLoad();
    openEdit();
    fillFields('Portal 2', 'Updated dashboard', 'Lead');
    submitFields();

    const request = http.expectOne(fieldsUrl);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      projectName: 'Portal 2',
      description: 'Updated dashboard',
      contribution: 'Lead',
    });
    request.flush({
      ...projectDto,
      projectName: 'Portal 2',
      description: 'Updated dashboard',
      contribution: 'Lead',
    });
    await settle();

    expect(element().querySelector('#project-name')).toBeFalsy();
    expect(element().textContent).toContain('Portal 2');
    expect(element().textContent).toContain('Updated dashboard');
    expect(element().querySelector('[role="status"]')?.textContent).toContain(
      'Project details saved',
    );
  });

  it('edit_WhenSubmitted_PreservesUnsavedSkillSelection', async () => {
    await initialLoad();

    picker().selectionChange.emit([2]);
    fixture.detectChanges();
    openEdit();
    fillFields('Portal 2', '', '');
    submitFields();
    http.expectOne(fieldsUrl).flush({ ...projectDto, projectName: 'Portal 2' });
    await settle();

    expect(element().querySelector('button[aria-label="Remove Spring"]')).toBeTruthy();
    expect(element().querySelector('button[aria-label="Remove Angular"]')).toBeFalsy();
    expect((buttonWithText('Save skills') as HTMLButtonElement).disabled).toBe(false);

    saveSkills();
    const replace = http.expectOne(replaceUrl);
    expect(replace.request.body).toEqual({ techStackIds: [2] });
    replace.flush({ ...projectDto, projectName: 'Portal 2' });
    await settle();
  });

  it('edit_WhenApiRejects_ShowsFormErrorAndKeepsFormOpen', async () => {
    await initialLoad();
    openEdit();
    fillFields('Portal 2', '', '');
    submitFields();

    http
      .expectOne(fieldsUrl)
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

  it('edit_WhenUnauthorized_ClosesTheFormWithoutShowingFormError', async () => {
    await initialLoad();
    openEdit();
    fillFields('Portal 2', '', '');
    submitFields();

    http.expectOne(fieldsUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(element().querySelector('#project-name')).toBeFalsy();
    expect(element().querySelector('[role="alert"]')).toBeFalsy();
  });
});

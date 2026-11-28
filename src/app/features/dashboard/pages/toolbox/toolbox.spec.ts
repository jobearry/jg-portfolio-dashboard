import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { Toolbox } from './toolbox';

describe('Toolbox', () => {
  let fixture: ComponentFixture<Toolbox>;
  let http: HttpTestingController;

  const categoriesUrl = `${environment.portfolioApi}/v1/skill-category`;
  const skillsUrl = `${environment.portfolioApi}/v1/skill`;

  const categories = [
    { id: 1, category: 'Frontend' },
    { id: 2, category: 'Cloud & Infrastructure' },
  ];
  const skills = [
    { id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' },
    { id: 2, stackName: 'Azure', imgSrc: null, category: 'Cloud & Infrastructure' },
  ];

  const element = () => fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element().querySelector(`#${id}`) as HTMLElement;

  async function settle(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  function render(): void {
    fixture = TestBed.createComponent(Toolbox);
    fixture.detectChanges();
  }

  function flushInitial(
    categoryDtos: Array<{ id: number; category: string | null }> = categories,
    skillDtos: Array<{
      id: number;
      stackName: string | null;
      imgSrc: string | null;
      category: string | null;
    }> = skills,
  ): void {
    http.expectOne(categoriesUrl).flush(categoryDtos);
    http.expectOne(skillsUrl).flush(skillDtos);
  }

  function setValue(id: string, value: string): void {
    const control = byId(id) as HTMLInputElement | HTMLSelectElement;
    control.value = value;
    control.dispatchEvent(new Event(id === 'skill-category' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  function submit(testId: string): void {
    (element().querySelector(`[data-testid="${testId}"]`) as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  }

  const categoryRow = (id: number): HTMLElement | null =>
    element().querySelector(`[data-category-id="${id}"]`);

  function rowButton(row: HTMLElement, label: string): HTMLButtonElement {
    const button = [...row.querySelectorAll('button')].find(
      (candidate) => candidate.getAttribute('aria-label') === label,
    ) as HTMLButtonElement | undefined;
    if (!button) {
      throw new Error(`Button labeled "${label}" not found`);
    }
    return button;
  }

  function clickRowButton(row: HTMLElement, label: string): void {
    rowButton(row, label).click();
    fixture.detectChanges();
  }

  function expectIconButton(button: HTMLButtonElement, title: string): void {
    expect(button.getAttribute('title')).toBe(title);
    expect(button.querySelector('ng-icon')).not.toBeNull();
    expect(button.textContent?.trim()).toBe('');
  }

  function setCategoryDraft(row: HTMLElement, value: string): void {
    const input = row.querySelector('[data-testid="category-edit-input"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  const skillRow = (id: number): HTMLElement | null =>
    element().querySelector(`[data-skill-id="${id}"]`);

  function setSkillDraftName(row: HTMLElement, value: string): void {
    const input = row.querySelector('[data-testid="skill-edit-name"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setSkillDraftCategory(row: HTMLElement, value: string): void {
    const select = row.querySelector('[data-testid="skill-edit-category"]') as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toolbox],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('load_GetsCategoriesAndSkills_RendersBothLists', async () => {
    render();
    flushInitial();

    await settle();

    expect(element().textContent).toContain('Frontend');
    expect(element().textContent).toContain('Angular');
    expect(element().querySelectorAll('[data-testid="category-row"]')).toHaveLength(2);
    expect(element().querySelectorAll('[data-testid="skill-row"]')).toHaveLength(2);
  });

  it('renders categories in a table with category, usage, and actions columns', async () => {
    render();
    flushInitial();
    await settle();

    const categoryTable = element().querySelectorAll('table')[0];
    const headers = [...categoryTable.querySelectorAll('thead th')].map((header) =>
      header.textContent?.trim(),
    );
    expect(headers).toEqual(['Category', 'Usage', 'Actions']);
    expect(categoryTable.querySelectorAll('tbody [data-testid="category-row"]')).toHaveLength(2);
  });

  it('categoryActions_AreIconOnlyWithTooltips', async () => {
    render();
    flushInitial();
    await settle();

    const row = categoryRow(1) as HTMLElement;
    expectIconButton(rowButton(row, 'Edit category Frontend'), 'Edit category');
    expectIconButton(rowButton(row, 'Delete category Frontend'), 'Delete category');
  });

  it('skillActions_AreIconOnlyWithTooltips', async () => {
    render();
    flushInitial();
    await settle();

    const row = skillRow(1) as HTMLElement;
    expectIconButton(rowButton(row, 'Edit skill Angular'), 'Edit stack');
    expectIconButton(rowButton(row, 'Delete skill Angular'), 'Delete stack');
  });

  it('editAndSkillDeleteActions_AreIconOnlyWithTooltips', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(categoryRow(2) as HTMLElement, 'Edit category Cloud & Infrastructure');
    expectIconButton(rowButton(categoryRow(2) as HTMLElement, 'Save category'), 'Save category');
    expectIconButton(
      rowButton(categoryRow(2) as HTMLElement, 'Cancel category edit'),
      'Cancel edit',
    );

    clickRowButton(skillRow(1) as HTMLElement, 'Edit skill Angular');
    expectIconButton(rowButton(skillRow(1) as HTMLElement, 'Save skill'), 'Save stack');
    expectIconButton(rowButton(skillRow(1) as HTMLElement, 'Cancel skill edit'), 'Cancel edit');
    clickRowButton(skillRow(1) as HTMLElement, 'Cancel skill edit');

    clickRowButton(skillRow(1) as HTMLElement, 'Delete skill Angular');
    expectIconButton(
      rowButton(skillRow(1) as HTMLElement, 'Confirm delete skill Angular'),
      'Confirm delete',
    );
    expectIconButton(rowButton(skillRow(1) as HTMLElement, 'Cancel delete skill'), 'Cancel delete');
  });

  it('categoryDeleteActions_AreIconOnlyWithTooltips', async () => {
    render();
    flushInitial(categories, []);
    await settle();

    clickRowButton(categoryRow(2) as HTMLElement, 'Delete category Cloud & Infrastructure');
    expectIconButton(
      rowButton(categoryRow(2) as HTMLElement, 'Confirm delete category Cloud & Infrastructure'),
      'Confirm delete',
    );
    expectIconButton(
      rowButton(categoryRow(2) as HTMLElement, 'Cancel delete category'),
      'Cancel delete',
    );
  });

  it('rendersUnusedCategory_ShowsDashUsage', async () => {
    render();
    flushInitial(categories, []);
    await settle();

    const row = categoryRow(1) as HTMLElement;
    expect(row.textContent).toContain('—');
    expect(row.textContent).not.toContain('Used by');
  });

  it('renders skills in a table with stack, category, and actions columns', async () => {
    render();
    flushInitial();
    await settle();

    const skillsTable = element().querySelectorAll('table')[1];
    const headers = [...skillsTable.querySelectorAll('thead th')].map((header) =>
      header.textContent?.trim(),
    );
    expect(headers).toEqual(['Stack', 'Category', 'Actions']);
    expect(skillsTable.querySelectorAll('tbody [data-testid="skill-row"]')).toHaveLength(2);
  });

  it('load_WhenListsAreEmpty_ShowsEmptyStates', async () => {
    render();
    flushInitial([], []);

    await settle();

    const statuses = [...element().querySelectorAll('[role="status"]')].map(
      (node) => node.textContent,
    );
    expect(statuses.some((text) => text?.includes('No categories yet'))).toBe(true);
    expect(statuses.some((text) => text?.includes('No tech stacks yet'))).toBe(true);
  });

  it('load_WhenApiFails_ShowsErrorAndRetries', async () => {
    render();
    http.expectOne(categoriesUrl).flush('boom', { status: 503, statusText: 'Unavailable' });
    http.expectOne(skillsUrl).flush([]);

    await settle();

    const alert = element().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('503');

    (alert?.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    flushInitial();

    await settle();

    expect(element().textContent).toContain('Angular');
  });

  it('addCategory_PostsTrimmedNameAndAppendsCategory', async () => {
    render();
    flushInitial();
    await settle();

    setValue('category-name', '  DevOps  ');
    submit('category-form');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ category: 'DevOps' });
    request.flush({ id: 3, category: 'DevOps' }, { status: 201, statusText: 'Created' });

    await settle();

    const rows = [...element().querySelectorAll('[data-testid="category-row"]')];
    expect(rows.at(-1)?.textContent).toContain('DevOps');
    expect((byId('category-name') as HTMLInputElement).value).toBe('');
  });

  it('addCategory_WhenApiRejects_ShowsFormErrorAndKeepsName', async () => {
    render();
    flushInitial();
    await settle();

    setValue('category-name', 'Frontend');
    submit('category-form');

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/skill-category`)
      .flush(
        { title: 'Bad Request', detail: 'Category already exists.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await settle();

    expect(element().querySelector('[data-testid="category-error"]')?.textContent).toContain(
      'Category already exists.',
    );
    expect((byId('category-name') as HTMLInputElement).value).toBe('Frontend');
    expect(element().querySelectorAll('[data-testid="category-row"]')).toHaveLength(2);
  });

  it('addSkill_PostsSelectedCategoryAndAppendsSkill', async () => {
    render();
    flushInitial();
    await settle();

    setValue('skill-name', ' Terraform ');
    setValue('skill-category', 'Cloud & Infrastructure');
    submit('skill-form');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      stackName: 'Terraform',
      imgSrc: null,
      category: 'Cloud & Infrastructure',
    });
    request.flush(
      { id: 3, stackName: 'Terraform', imgSrc: null, category: 'Cloud & Infrastructure' },
      { status: 201, statusText: 'Created' },
    );

    await settle();

    const rows = [...element().querySelectorAll('[data-testid="skill-row"]')];
    expect(rows.at(-1)?.textContent).toContain('Terraform');
    expect((byId('skill-name') as HTMLInputElement).value).toBe('');
    expect((byId('skill-category') as HTMLSelectElement).value).toBe('Cloud & Infrastructure');
  });

  it('updateCategory_WhenRenamed_PutsTrimmedNameAndReplacesRowAndSkills', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(categoryRow(1) as HTMLElement, 'Edit category Frontend');
    setCategoryDraft(categoryRow(1) as HTMLElement, '  UI  ');
    clickRowButton(categoryRow(1) as HTMLElement, 'Save category');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ category: 'UI' });
    request.flush({ id: 1, category: 'UI' });

    await settle();

    const row = categoryRow(1) as HTMLElement;
    expect(row.textContent).toContain('UI');
    expect(row.textContent).not.toContain('Frontend');
    expect(element().textContent).not.toContain('Frontend');

    const angularRow = [...element().querySelectorAll('[data-testid="skill-row"]')].find((node) =>
      node.textContent?.includes('Angular'),
    ) as HTMLElement;
    expect(angularRow.textContent).toContain('UI');
  });

  it('updateCategory_WhenSelectedCategoryRenamed_UpdatesSkillFormSelection', async () => {
    render();
    flushInitial();
    await settle();

    setValue('skill-category', 'Frontend');
    clickRowButton(categoryRow(1) as HTMLElement, 'Edit category Frontend');
    setCategoryDraft(categoryRow(1) as HTMLElement, 'UI');
    clickRowButton(categoryRow(1) as HTMLElement, 'Save category');

    http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`).flush({
      id: 1,
      category: 'UI',
    });

    await settle();

    expect((byId('skill-category') as HTMLSelectElement).value).toBe('UI');
  });

  it('updateCategory_WhenSkillEditIsOpen_UpdatesItsDraftCategorySelection', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Edit skill Angular');
    clickRowButton(categoryRow(1) as HTMLElement, 'Edit category Frontend');
    setCategoryDraft(categoryRow(1) as HTMLElement, 'UI');
    clickRowButton(categoryRow(1) as HTMLElement, 'Save category');

    http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`).flush({
      id: 1,
      category: 'UI',
    });

    await settle();

    const editCategory = skillRow(1)?.querySelector(
      '[data-testid="skill-edit-category"]',
    ) as HTMLSelectElement;
    expect(editCategory.value).toBe('UI');

    clickRowButton(skillRow(1) as HTMLElement, 'Save skill');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill/1`);
    expect(request.request.body).toEqual({
      stackName: 'Angular',
      imgSrc: null,
      category: 'UI',
    });
    request.flush({ id: 1, stackName: 'Angular', imgSrc: null, category: 'UI' });

    await settle();
  });

  it('updateCategory_WhenDraftIsBlank_DoesNotCallApi', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(categoryRow(1) as HTMLElement, 'Edit category Frontend');
    setCategoryDraft(categoryRow(1) as HTMLElement, '   ');

    const save = rowButton(categoryRow(1) as HTMLElement, 'Save category');
    expect(save.disabled).toBe(true);
    save.click();
    fixture.detectChanges();

    expect(http.match(`${environment.portfolioApi}/v1/admin/skill-category/1`)).toHaveLength(0);
  });

  it('updateCategory_WhenApiRejects_KeepsRowAndShowsInlineError', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(categoryRow(1) as HTMLElement, 'Edit category Frontend');
    setCategoryDraft(categoryRow(1) as HTMLElement, 'Frontend');
    clickRowButton(categoryRow(1) as HTMLElement, 'Save category');

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`)
      .flush(
        { title: 'Bad Request', detail: 'Category already exists.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await settle();

    expect(categoryRow(1)?.textContent).toContain('Frontend');
    expect(element().querySelector('[data-testid="category-action-error"]')?.textContent).toContain(
      'Category already exists.',
    );
    expect(categoryRow(1)?.querySelector('[data-testid="category-edit-input"]')).not.toBeNull();
  });

  it('deleteCategory_AfterConfirmation_DeletesAndRemovesRow', async () => {
    render();
    flushInitial(categories, []);
    await settle();

    clickRowButton(categoryRow(1) as HTMLElement, 'Delete category Frontend');
    expect(element().textContent).toContain('Delete Frontend?');

    clickRowButton(categoryRow(1) as HTMLElement, 'Confirm delete category Frontend');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });

    await settle();

    expect(categoryRow(1)).toBeNull();
    expect(element().textContent).not.toContain('Frontend');
  });

  it('deleteCategory_WhenSelectedCategoryDeleted_ClearsSkillFormSelection', async () => {
    render();
    flushInitial(categories, []);
    await settle();

    setValue('skill-category', 'Frontend');
    clickRowButton(categoryRow(1) as HTMLElement, 'Delete category Frontend');
    clickRowButton(categoryRow(1) as HTMLElement, 'Confirm delete category Frontend');
    http
      .expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`)
      .flush(null, { status: 204, statusText: 'No Content' });

    await settle();

    expect((byId('skill-category') as HTMLSelectElement).value).toBe('');
  });

  it('deleteCategory_WhenApiRejects_KeepsRowAndShowsInlineError', async () => {
    render();
    flushInitial(categories, []);
    await settle();

    clickRowButton(categoryRow(1) as HTMLElement, 'Delete category Frontend');
    clickRowButton(categoryRow(1) as HTMLElement, 'Confirm delete category Frontend');

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/skill-category/1`)
      .flush(
        { status: 409, title: 'Conflict', detail: 'Category is in use.' },
        { status: 409, statusText: 'Conflict' },
      );

    await settle();

    expect(categoryRow(1)).not.toBeNull();
    expect(element().querySelector('[data-testid="category-action-error"]')?.textContent).toContain(
      'Category is in use.',
    );
    expect(categoryRow(1)?.querySelector('[data-testid="category-confirm-delete"]')).not.toBeNull();
  });

  it('deleteCategory_CancelConfirmation_MakesNoRequest', async () => {
    render();
    flushInitial(categories, []);
    await settle();

    clickRowButton(categoryRow(1) as HTMLElement, 'Delete category Frontend');
    clickRowButton(categoryRow(1) as HTMLElement, 'Cancel delete category');

    expect(element().textContent).not.toContain('Delete Frontend?');
    expect(http.match(`${environment.portfolioApi}/v1/admin/skill-category/1`)).toHaveLength(0);
  });

  it('deleteCategory_WhenCategoryHasSkills_DisablesDelete', async () => {
    render();
    flushInitial();
    await settle();

    const row = categoryRow(1) as HTMLElement;
    expect(rowButton(row, 'Delete category Frontend').disabled).toBe(true);
    expect(row.textContent).toContain('Used by 1 stack');
  });

  it('updateSkill_WhenRenamedAndRecategorized_PutsNameImageAndCategoryThenUpdatesRow', async () => {
    render();
    flushInitial(categories, [
      {
        id: 1,
        stackName: 'Angular',
        imgSrc: 'https://img.example/angular.svg',
        category: 'Frontend',
      },
    ]);
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Edit skill Angular');
    expect(
      (skillRow(1)?.querySelector('[data-testid="skill-edit-category"]') as HTMLSelectElement)
        .value,
    ).toBe('Frontend');

    setSkillDraftName(skillRow(1) as HTMLElement, '  Angular 2  ');
    setSkillDraftCategory(skillRow(1) as HTMLElement, 'Cloud & Infrastructure');
    clickRowButton(skillRow(1) as HTMLElement, 'Save skill');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill/1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      stackName: 'Angular 2',
      imgSrc: 'https://img.example/angular.svg',
      category: 'Cloud & Infrastructure',
    });
    request.flush({
      id: 1,
      stackName: 'Angular 2',
      imgSrc: 'https://img.example/angular.svg',
      category: 'Cloud & Infrastructure',
    });

    await settle();

    const row = skillRow(1) as HTMLElement;
    expect(row.textContent).toContain('Angular 2');
    expect(row.textContent).toContain('Cloud & Infrastructure');
    expect(row.textContent).not.toContain('Frontend');
    expect(categoryRow(1)?.textContent).not.toContain('Used by 1 stack');
    expect(categoryRow(2)?.textContent).toContain('Used by 1 stack');
  });

  it('updateSkill_WhenDraftNameIsBlank_DoesNotCallApi', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Edit skill Angular');
    setSkillDraftName(skillRow(1) as HTMLElement, '   ');

    const save = rowButton(skillRow(1) as HTMLElement, 'Save skill');
    expect(save.disabled).toBe(true);
    save.click();
    fixture.detectChanges();

    expect(http.match(`${environment.portfolioApi}/v1/admin/skill/1`)).toHaveLength(0);
  });

  it('updateSkill_CancelEdit_MakesNoRequest', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Edit skill Angular');
    setSkillDraftName(skillRow(1) as HTMLElement, 'Changed');
    clickRowButton(skillRow(1) as HTMLElement, 'Cancel skill edit');

    expect(skillRow(1)?.textContent).toContain('Angular');
    expect(skillRow(1)?.querySelector('[data-testid="skill-edit-name"]')).toBeNull();
    expect(http.match(`${environment.portfolioApi}/v1/admin/skill/1`)).toHaveLength(0);
  });

  it('updateSkill_WhenApiRejects_KeepsRowAndShowsInlineError', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Edit skill Angular');
    setSkillDraftName(skillRow(1) as HTMLElement, 'Renamed');
    clickRowButton(skillRow(1) as HTMLElement, 'Save skill');

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/skill/1`)
      .flush(
        { title: 'Bad Request', detail: 'Stack name already exists.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await settle();

    expect(skillRow(1)?.textContent).toContain('Angular');
    expect(skillRow(1)?.querySelector('[data-testid="skill-action-error"]')?.textContent).toContain(
      'Stack name already exists.',
    );
    expect(skillRow(1)?.querySelector('[data-testid="skill-edit-name"]')).not.toBeNull();
  });

  it('deleteSkill_AfterConfirmation_DeletesAndRemovesRow', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Delete skill Angular');
    expect(skillRow(1)?.textContent).toContain('Delete Angular?');

    clickRowButton(skillRow(1) as HTMLElement, 'Confirm delete skill Angular');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill/1`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });

    await settle();

    expect(skillRow(1)).toBeNull();
    expect(element().textContent).not.toContain('Angular');
  });

  it('deleteSkill_WhenApiReturns409_KeepsRowAndShowsInlineError', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Delete skill Angular');
    clickRowButton(skillRow(1) as HTMLElement, 'Confirm delete skill Angular');

    http
      .expectOne(`${environment.portfolioApi}/v1/admin/skill/1`)
      .flush(
        { status: 409, title: 'Conflict', detail: 'Skill is used by projects.' },
        { status: 409, statusText: 'Conflict' },
      );

    await settle();

    expect(skillRow(1)).not.toBeNull();
    expect(skillRow(1)?.querySelector('[data-testid="skill-action-error"]')?.textContent).toContain(
      'Skill is used by projects.',
    );
    expect(skillRow(1)?.querySelector('[data-testid="skill-confirm-delete"]')).not.toBeNull();
  });

  it('deleteSkill_CancelConfirmation_MakesNoRequest', async () => {
    render();
    flushInitial();
    await settle();

    clickRowButton(skillRow(1) as HTMLElement, 'Delete skill Angular');
    clickRowButton(skillRow(1) as HTMLElement, 'Cancel delete skill');

    expect(skillRow(1)?.textContent).not.toContain('Delete Angular?');
    expect(http.match(`${environment.portfolioApi}/v1/admin/skill/1`)).toHaveLength(0);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { Settings } from './settings';

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;
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
    fixture = TestBed.createComponent(Settings);
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

  function setCategoryDraft(row: HTMLElement, value: string): void {
    const input = row.querySelector('[data-testid="category-edit-input"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.setItem('portfolio-theme', 'dark');
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem('portfolio-theme');
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('color-scheme');
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

  it('theme_UsesSegmentedControlToSetLightAndDark', async () => {
    render();
    flushInitial();
    await settle();

    const light = byId('theme-light') as HTMLButtonElement;
    const dark = byId('theme-dark') as HTMLButtonElement;

    expect(dark.getAttribute('aria-pressed')).toBe('true');

    light.click();
    fixture.detectChanges();

    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('portfolio-theme')).toBe('light');

    dark.click();
    fixture.detectChanges();

    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('portfolio-theme')).toBe('dark');
  });
});

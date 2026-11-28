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

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TechStackList } from './tech-stack-list';

describe('TechStackList', () => {
  let http: HttpTestingController;

  const skillsRequest = () => http.expectOne((request) => request.url.endsWith('/v1/skill'));

  const render = () => {
    const fixture = TestBed.createComponent(TechStackList);
    fixture.detectChanges();
    return fixture;
  };

  const settle = async (fixture: ReturnType<typeof render>) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads skills and groups them by API category with derived marks', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 2, category: 'Backend', imgSrc: null, stackName: 'ASP.NET' },
      { id: 3, category: 'Frontend', imgSrc: null, stackName: 'TypeScript' },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('section')).toHaveLength(2);
    expect(element.textContent).toContain('Frontend');
    expect(element.textContent).toContain('Backend');
    expect(element.textContent).toContain('Angular');
    expect(element.textContent).toContain('ASP.NET');
    expect(element.textContent).toContain('TypeScript');
    expect(
      [...element.querySelectorAll('li span[aria-hidden="true"]')].map((mark) =>
        mark.textContent?.trim(),
      ),
    ).toEqual(['An', 'Ty', 'AN']);
    expect(element.querySelector('a')).toBeNull();
  });

  it('renders every skill and caps a card at four visible items', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 2, category: 'Frontend', imgSrc: null, stackName: 'TailwindCSS' },
      { id: 3, category: 'Frontend', imgSrc: null, stackName: 'NgRx' },
      { id: 4, category: 'Frontend', imgSrc: null, stackName: 'Angular Signals' },
      { id: 5, category: 'Frontend', imgSrc: null, stackName: 'IgniteUI' },
      { id: 6, category: 'Backend', imgSrc: null, stackName: 'ASP.NET' },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const lists = [...element.querySelectorAll('ul')];

    expect(element.querySelectorAll('li')).toHaveLength(6);
    expect(lists[0].classList).toContain('max-h-54');
    expect(lists[0].classList).toContain('overflow-y-auto');
    expect(lists[0].getAttribute('tabindex')).toBe('0');
    expect(lists[1].getAttribute('tabindex')).toBeNull();
    expect(element.textContent).toContain('1 skill');
    expect(element.textContent).toContain('5 skills');
  });

  it('expands and collapses the overflowing cards', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 2, category: 'Frontend', imgSrc: null, stackName: 'TailwindCSS' },
      { id: 3, category: 'Frontend', imgSrc: null, stackName: 'NgRx' },
      { id: 4, category: 'Frontend', imgSrc: null, stackName: 'Angular Signals' },
      { id: 5, category: 'Frontend', imgSrc: null, stackName: 'IgniteUI' },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button') as HTMLButtonElement;
    const list = element.querySelector('ul') as HTMLUListElement;

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.textContent).toContain('View more');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.textContent).toContain('Show less');
    expect(list.classList).not.toContain('max-h-54');
    expect(list.getAttribute('tabindex')).toBeNull();

    button.click();
    fixture.detectChanges();

    expect(list.classList).toContain('max-h-54');
  });

  it('hides the toggle when every card fits', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 2, category: 'Backend', imgSrc: null, stackName: 'ASP.NET' },
    ]);

    await settle(fixture);

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('shows only frontend, backend, and database until View more is clicked', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 2, category: 'Backend', imgSrc: null, stackName: 'ASP.NET' },
      { id: 3, category: 'Database', imgSrc: null, stackName: 'PostgreSQL' },
      { id: 4, category: 'Cloud & Infrastructure', imgSrc: null, stackName: 'Azure' },
      { id: 5, category: 'Language', imgSrc: null, stackName: 'TypeScript' },
      { id: 6, category: 'AI Tool', imgSrc: null, stackName: 'OpenCode' },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const categories = [...element.querySelectorAll('section h3')].map((heading) =>
      heading.textContent?.trim(),
    );

    expect(categories).toEqual(['Frontend', 'Backend', 'Database']);
    expect(element.textContent).not.toContain('Azure');

    const button = element.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('View more');

    button.click();
    fixture.detectChanges();

    const expandedCategories = [...element.querySelectorAll('section h3')].map((heading) =>
      heading.textContent?.trim(),
    );
    const indices = [...element.querySelectorAll('section span[aria-hidden="true"]')].map((mark) =>
      mark.textContent?.trim(),
    );

    expect(expandedCategories).toEqual([
      'Frontend',
      'Backend',
      'Database',
      'Cloud & Infrastructure',
      'Language',
      'AI Tool',
    ]);
    expect(indices).toEqual(['An', 'AN', 'Po', 'Az', 'Ty', 'Op']);
    expect(element.textContent).toContain('Azure');
    expect(element.textContent).toContain('TypeScript');
    expect(element.textContent).toContain('OpenCode');
  });

  it('keeps stable category numbers when a category is missing', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Database', imgSrc: null, stackName: 'SQLite' },
      { id: 2, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 3, category: 'Language', imgSrc: null, stackName: 'Go' },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const categories = [...element.querySelectorAll('section h3')].map((heading) =>
      heading.textContent?.trim(),
    );
    const marks = [...element.querySelectorAll('section span[aria-hidden="true"]')].map((mark) =>
      mark.textContent?.trim(),
    );

    expect(categories).toEqual(['Frontend', 'Database', 'Language']);
    expect(marks).toEqual(['An', 'SQ', 'Go']);
    expect(element.textContent).toContain('01');
    expect(element.textContent).toContain('03');
    expect(element.textContent).toContain('05');
    expect(element.textContent).not.toContain('02');
  });

  it('shows a loading state while the request is pending', () => {
    const fixture = render();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-skeleton')).not.toBeNull();
    skillsRequest().flush([]);
  });

  it('shows an empty state when no skills are returned', async () => {
    const fixture = render();
    skillsRequest().flush([]);

    await settle(fixture);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('No skills have been published');
  });

  it('shows an error and retries the skills request', async () => {
    const fixture = render();
    skillsRequest().flush('boom', { status: 503, statusText: 'Unavailable' });

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('503');
    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    skillsRequest().flush([{ id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' }]);

    await settle(fixture);

    expect(element.textContent).toContain('Angular');
  });
});

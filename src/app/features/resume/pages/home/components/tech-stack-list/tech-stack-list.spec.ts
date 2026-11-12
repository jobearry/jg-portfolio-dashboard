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

  it('shows the full list without a fixed-height scroll area', async () => {
    const fixture = render();
    skillsRequest().flush([
      { id: 1, category: 'Frontend', imgSrc: null, stackName: 'Angular' },
      { id: 2, category: 'Backend', imgSrc: null, stackName: 'ASP.NET' },
      { id: 3, category: 'Backend', imgSrc: null, stackName: 'C#' },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.tech-stack')).toBeNull();
    expect(element.querySelectorAll('li')).toHaveLength(3);
    expect(element.textContent).toContain('1 skill');
    expect(element.textContent).toContain('2 skills');
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

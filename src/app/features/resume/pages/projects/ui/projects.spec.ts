import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { site } from '../../../../../core/config/site.config';
import { Projects } from './projects';

describe('Projects', () => {
  let http: HttpTestingController;

  const projectRequest = () =>
    http.expectOne((request) => request.url.endsWith('/v1/project?includeTools=false'));

  const githubRequest = () =>
    http.expectOne((request) =>
      request.url.endsWith(`/v1/github/owner/${site.github.username}/repositories`),
    );

  const render = () => {
    const fixture = TestBed.createComponent(Projects);
    fixture.detectChanges();
    return fixture;
  };

  const settle = async (fixture: ReturnType<typeof render>) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders projects when the API omits tool details', async () => {
    const fixture = render();

    projectRequest().flush([
      {
        id: 7,
        projectName: 'Portal',
        description: 'Client portal',
        contribution: 'Delivered the portal',
      },
    ]);
    githubRequest().flush([]);

    await settle(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Portal');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Delivered the portal');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Angular');
  });

  it('renders project technologies and the full repository list', async () => {
    const fixture = render();

    projectRequest().flush([
      {
        id: 8,
        projectName: 'Dashboard',
        description: 'Internal dashboard',
        contribution: 'Built the dashboard',
        techStacks: [
          { id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' },
          { id: 2, stackName: '.NET', imgSrc: null, category: 'Backend' },
        ],
      },
    ]);
    githubRequest().flush([
      {
        id: 1,
        name: 'repo-one',
        fullName: 'jobearry/repo-one',
        htmlUrl: 'https://github.com/jobearry/repo-one',
        description: 'First repository',
        language: 'TypeScript',
        topics: [],
      },
      {
        id: 2,
        name: 'repo-two',
        fullName: 'jobearry/repo-two',
        htmlUrl: 'https://github.com/jobearry/repo-two',
        description: 'Second repository',
        language: 'C#',
        topics: [],
      },
    ]);

    await settle(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const technologies = element.querySelector('[aria-label="Project technologies"]');
    expect(technologies?.textContent).toContain('Angular');
    expect(technologies?.textContent).toContain('.NET');
    expect(element.querySelectorAll('app-repo-card')).toHaveLength(2);
    expect(element.textContent).toContain('repo-one');
    expect(element.textContent).toContain('repo-two');
  });

  it('renders an empty state when the API returns no projects', async () => {
    const fixture = render();
    projectRequest().flush([]);
    githubRequest().flush([]);

    await settle(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No client projects to show yet.',
    );
  });

  it('shows a retry action when loading projects fails', async () => {
    const fixture = render();
    projectRequest().flush('boom', { status: 503, statusText: 'Unavailable' });
    githubRequest().flush([]);

    await settle(fixture);

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="alert"] button',
    ) as HTMLButtonElement;
    expect(button?.textContent).toContain('Try again');

    button.click();
    fixture.detectChanges();
    projectRequest().flush([]);
    await settle(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No client projects to show yet.',
    );
  });
});

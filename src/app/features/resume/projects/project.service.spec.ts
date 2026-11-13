import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ResumeProjectSignalService } from './project.service';

describe('ResumeProjectSignalService', () => {
  let service: ResumeProjectSignalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ResumeProjectSignalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads projects without tools from the portfolio API', async () => {
    const projects = [
      {
        id: 7,
        projectName: 'Portal',
        description: 'Client portal',
        contribution: 'Delivered the portal',
      },
    ];

    const request = service.load();

    http.expectOne((req) => req.url.endsWith('/v1/project?includeTools=false')).flush(projects);
    await request;

    expect(service.getState()).toEqual({
      content: projects,
      loading: false,
      error: null,
    });
  });
});

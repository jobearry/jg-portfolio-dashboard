import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ExperienceSignalService } from '../../../../shared';
import { ExperienceDto, ExperienceWriteRequest } from '../models/experience-write';
import { ExperienceAdminService } from './experience-admin.service';

describe('ExperienceAdminService', () => {
  let service: ExperienceAdminService;
  let signalService: ExperienceSignalService;
  let http: HttpTestingController;

  const body: ExperienceWriteRequest = {
    company: 'Acme',
    role: 'Engineer',
    startedAt: '2020-01-01T00:00:00Z',
    finishedAt: null,
    description: 'Built things',
    responsibility: 'Shipped features',
    type: 'Full-time',
  };

  const dto: ExperienceDto = {
    id: 7,
    ...body,
    durationMonths: 12,
    projects: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExperienceAdminService);
    signalService = TestBed.inject(ExperienceSignalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reload_WhenApiReturnsDtos_MapsAndSetsContent', async () => {
    const result = service.reload();
    http.expectOne(`${environment.portfolioApi}/v1/experience?includeProjects=false`).flush([dto]);
    await result;

    const state = signalService.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.content).toHaveLength(1);
    expect(state.content[0]).toMatchObject({ id: 7, company: 'Acme', durationMonths: 12 });
  });

  it('reload_WhenApiFails_SetsErrorState', async () => {
    const result = service.reload();
    http
      .expectOne(`${environment.portfolioApi}/v1/experience?includeProjects=false`)
      .flush({}, { status: 503, statusText: 'Service Unavailable' });
    await result;

    const state = signalService.getState();
    expect(state.loading).toBe(false);
    expect(state.content).toEqual([]);
    expect(state.error).toBeTruthy();
  });

  it('create_WhenCalled_PostsRequestAndReturnsMappedModel', async () => {
    const result = service.create(body);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/experience`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(dto);

    await expect(result).resolves.toMatchObject({ id: 7, company: 'Acme' });
  });

  it('update_WhenCalled_PutsRequestToIdAndReturnsMappedModel', async () => {
    const result = service.update(7, body);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/experience/7`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(dto);

    await expect(result).resolves.toMatchObject({ id: 7, company: 'Acme' });
  });
});

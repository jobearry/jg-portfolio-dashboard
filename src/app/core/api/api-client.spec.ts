import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ExperienceDto, ExperienceWriteRequest } from '../../features/dashboard/core';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  let client: ApiClient;
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
    client = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('post_SendsJsonBodyAndReturnsTypedResponse', async () => {
    const result = client.post<ExperienceDto>('v1/admin/experience', body);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/experience`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.body).toEqual(body);
    request.flush(dto);

    await expect(result).resolves.toEqual(dto);
  });

  it('put_SendsJsonBodyToIdAndReturnsTypedResponse', async () => {
    const result = client.put<ExperienceDto>('v1/admin/experience/7', body);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/experience/7`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(dto);

    await expect(result).resolves.toEqual(dto);
  });
});

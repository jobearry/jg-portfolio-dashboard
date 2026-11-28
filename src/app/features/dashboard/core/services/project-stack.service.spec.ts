import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ProjectStackService } from './project-stack.service';

describe('ProjectStackService', () => {
  let service: ProjectStackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectStackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll_GetsSkillsAndMapsNullableFields', async () => {
    const result = service.getAll();

    const request = http.expectOne(`${environment.portfolioApi}/v1/skill`);
    expect(request.request.method).toBe('GET');
    request.flush([
      { id: 1, stackName: 'Angular', imgSrc: 'angular.svg', category: 'Frontend' },
      { id: 2, stackName: null, imgSrc: null, category: null },
    ]);

    await expect(result).resolves.toEqual([
      { id: 1, stackName: 'Angular', imgSrc: 'angular.svg', category: 'Frontend' },
      { id: 2, stackName: '', imgSrc: null, category: '' },
    ]);
  });

  it('getAllCategories_GetsCategoriesAndMapsNullableFields', async () => {
    const result = service.getAllCategories();

    const request = http.expectOne(`${environment.portfolioApi}/v1/skill-category`);
    expect(request.request.method).toBe('GET');
    request.flush([
      { id: 1, category: 'Frontend' },
      { id: 2, category: null },
    ]);

    await expect(result).resolves.toEqual([
      { id: 1, category: 'Frontend' },
      { id: 2, category: '' },
    ]);
  });

  it('createCategory_PostsCategoryAndReturnsMappedCategory', async () => {
    const result = service.createCategory('DevOps');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ category: 'DevOps' });
    request.flush({ id: 3, category: 'DevOps' }, { status: 201, statusText: 'Created' });

    await expect(result).resolves.toEqual({ id: 3, category: 'DevOps' });
  });

  it('createSkill_PostsRequestAndReturnsMappedStack', async () => {
    const result = service.createSkill({
      stackName: 'Terraform',
      imgSrc: null,
      category: 'Cloud & Infrastructure',
    });

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      stackName: 'Terraform',
      imgSrc: null,
      category: 'Cloud & Infrastructure',
    });
    request.flush(
      { id: 4, stackName: 'Terraform', imgSrc: null, category: 'Cloud & Infrastructure' },
      { status: 201, statusText: 'Created' },
    );

    await expect(result).resolves.toEqual({
      id: 4,
      stackName: 'Terraform',
      imgSrc: null,
      category: 'Cloud & Infrastructure',
    });
  });

  it('replaceProjectStacks_PutsAllIdsAndReturnsMappedProject', async () => {
    const result = service.replaceProjectStacks(9, [1, 2]);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/project/9/tech-stacks`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ techStackIds: [1, 2] });
    request.flush({
      id: 9,
      projectName: 'Portal',
      description: null,
      contribution: 'Frontend',
      techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
    });

    await expect(result).resolves.toMatchObject({
      id: 9,
      projectName: 'Portal',
      description: '',
      techStacks: [{ id: 1, stackName: 'Angular' }],
    });
  });
});

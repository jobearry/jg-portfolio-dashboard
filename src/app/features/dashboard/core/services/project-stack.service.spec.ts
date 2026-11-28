import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ProblemDetails } from '../models/problem-details';
import { UpdateSkillRequest } from '../models/techstack-write';
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

  it('updateCategory_PutsExpectedBodyAndReturnsMappedCategory', async () => {
    const result = service.updateCategory(2, 'Platform');

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category/2`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ category: 'Platform' });
    request.flush({ id: 2, category: 'Platform' });

    await expect(result).resolves.toEqual({ id: 2, category: 'Platform' });
  });

  it('deleteCategory_DeletesByIdAndResolves', async () => {
    const result = service.deleteCategory(2);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill-category/2`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeUndefined();
  });

  it('updateSkill_PutsFieldsCategoryByNameAndReturnsMappedStack', async () => {
    const body: UpdateSkillRequest = {
      stackName: 'Kubernetes',
      imgSrc: null,
      category: 'Cloud & Infrastructure',
    };
    const result = service.updateSkill(4, body);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill/4`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush({ id: 4, ...body });

    await expect(result).resolves.toEqual({ id: 4, ...body });
  });

  it('deleteSkill_DeletesByIdAndResolves', async () => {
    const result = service.deleteSkill(4);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill/4`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeUndefined();
  });

  it('deleteSkill_WhenBackendReportsConflict_Rejects', async () => {
    const problem: ProblemDetails = {
      status: 409,
      title: 'Conflict',
      detail: 'Skill is still used by a project',
    };
    const result = service.deleteSkill(4);

    const request = http.expectOne(`${environment.portfolioApi}/v1/admin/skill/4`);
    request.flush(problem, { status: 409, statusText: 'Conflict' });

    await expect(result).rejects.toMatchObject({ status: 409 });
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

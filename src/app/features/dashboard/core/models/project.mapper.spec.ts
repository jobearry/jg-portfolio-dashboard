import { ProjectDto } from './project-write';
import { ProjectMapper } from './project.mapper';

const dto: ProjectDto = {
  id: 9,
  projectName: 'Portal',
  description: 'Internal dashboard',
  contribution: 'Frontend',
  techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
};

describe('ProjectMapper', () => {
  it('fromDto_PreservesIdentityAndTechStacks', () => {
    const result = ProjectMapper.fromDto(dto);

    expect(result).toEqual({
      id: 9,
      projectName: 'Portal',
      description: 'Internal dashboard',
      contribution: 'Frontend',
      techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
    });
  });

  it('fromDto_WhenNullableFieldsAreNull_UsesSafeDefaults', () => {
    const result = ProjectMapper.fromDto({
      ...dto,
      projectName: null,
      description: null,
      contribution: null,
      techStacks: null,
    });

    expect(result).toEqual({
      id: 9,
      projectName: '',
      description: '',
      contribution: '',
      techStacks: null,
    });
  });
});

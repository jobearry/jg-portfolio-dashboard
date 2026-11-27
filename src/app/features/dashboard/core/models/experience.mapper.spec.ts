import { ExperienceDto } from './experience-write';
import { ExperienceMapper } from './experience.mapper';

const dto: ExperienceDto = {
  id: 7,
  company: 'Acme',
  role: 'Engineer',
  startedAt: '2020-01-01T00:00:00',
  finishedAt: '2022-06-30T00:00:00',
  durationMonths: 30,
  description: 'Built things',
  responsibility: 'Shipped features',
  type: 'Full-time',
  projects: [
    {
      id: 9,
      projectName: 'Portal',
      description: 'Internal dashboard',
      contribution: 'Frontend',
      techStacks: [{ id: 1, stackName: 'Angular', imgSrc: null, category: 'Frontend' }],
    },
  ],
};

describe('ExperienceMapper', () => {
  it('fromDto_PreservesDatesProjectsAndIdentity', () => {
    const result = ExperienceMapper.fromDto(dto);

    expect(result.id).toBe(7);
    expect(result.startedAt).toBe('2020-01-01T00:00:00');
    expect(result.finishedAt).toBe('2022-06-30T00:00:00');
    expect(result.durationMonths).toBe(30);
    expect(result.projects?.[0]?.projectName).toBe('Portal');
    expect(result.projects?.[0]?.techStacks?.[0]?.stackName).toBe('Angular');
  });

  it('fromDto_WhenNullableFieldsAreNull_UsesSafeDefaults', () => {
    const result = ExperienceMapper.fromDto({
      ...dto,
      company: null,
      role: null,
      startedAt: null,
      finishedAt: null,
      durationMonths: null,
      description: null,
      responsibility: null,
      type: null,
      projects: null,
    });

    expect(result).toMatchObject({
      company: '',
      role: '',
      startedAt: '',
      finishedAt: null,
      durationMonths: 0,
      description: '',
      responsibility: '',
      type: '',
      projects: null,
    });
  });
});

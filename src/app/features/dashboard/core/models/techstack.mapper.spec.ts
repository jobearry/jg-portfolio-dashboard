import { TechStackMapper } from './techstack.mapper';

describe('TechStackMapper', () => {
  it('fromDto_PreservesIdentifiersAndImage', () => {
    const result = TechStackMapper.fromDto({
      id: 1,
      stackName: 'Angular',
      imgSrc: 'angular.svg',
      category: 'Frontend',
    });

    expect(result).toEqual({
      id: 1,
      stackName: 'Angular',
      imgSrc: 'angular.svg',
      category: 'Frontend',
    });
  });

  it('fromDto_WhenNullableFieldsAreNull_UsesSafeDefaults', () => {
    const result = TechStackMapper.fromDto({
      id: 2,
      stackName: null,
      imgSrc: null,
      category: null,
    });

    expect(result).toEqual({ id: 2, stackName: '', imgSrc: null, category: '' });
  });
});

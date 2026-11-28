import { SkillCategoryMapper } from './skill-category.mapper';

describe('SkillCategoryMapper', () => {
  it('fromDto_PreservesIdentifierAndCategory', () => {
    const result = SkillCategoryMapper.fromDto({ id: 3, category: 'Cloud & Infrastructure' });

    expect(result).toEqual({ id: 3, category: 'Cloud & Infrastructure' });
  });

  it('fromDto_WhenCategoryIsNull_UsesEmptyString', () => {
    const result = SkillCategoryMapper.fromDto({ id: 4, category: null });

    expect(result).toEqual({ id: 4, category: '' });
  });
});

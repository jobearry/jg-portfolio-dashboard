import { SkillCategoryItem } from './skill-category';
import { SkillCategoryDto } from './techstack-write';

/** Maps the nullable category DTO onto a render-safe view model. */
export class SkillCategoryMapper {
  static fromDto(dto: SkillCategoryDto): SkillCategoryItem {
    return {
      id: dto.id,
      category: dto.category ?? '',
    };
  }
}

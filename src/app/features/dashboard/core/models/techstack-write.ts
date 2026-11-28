/** API shape returned by `v1/skill` and nested project tech stacks. */
export interface TechStackDto {
  id: number;
  stackName: string | null;
  imgSrc: string | null;
  category: string | null;
}

/** API shape returned by `v1/skill-category`. */
export interface SkillCategoryDto {
  id: number;
  category: string | null;
}

/** Request body for `POST v1/admin/skill-category`. */
export interface SkillCategoryRequest {
  category: string | null;
}

/** Request body for `POST v1/admin/skill`; category is resolved by name. */
export interface CreateSkillRequest {
  stackName: string | null;
  imgSrc: string | null;
  category: string | null;
}

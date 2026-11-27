/** API shape returned by `v1/skill` and nested project tech stacks. */
export interface TechStackDto {
  id: number;
  stackName: string | null;
  imgSrc: string | null;
  category: string | null;
}

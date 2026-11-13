/**
 * A skill returned by `v1/skill` and the technology entries embedded in a
 * project. The API returns a nullable image path and no timestamps.
 */
export interface TechStackItem {
  id: number;
  stackName: string;
  imgSrc: string | null;
  category: string;
}

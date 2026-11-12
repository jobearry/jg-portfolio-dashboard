import { TechStackItem } from './techstack';

/**
 * A project returned by the portfolio API. Both the résumé projects endpoint
 * and nested experience projects use `id` and `techStacks`.
 */
export interface Project {
  id: number;
  projectName: string;
  description: string;
  contribution: string;
  techStacks?: TechStackItem[] | null;
}

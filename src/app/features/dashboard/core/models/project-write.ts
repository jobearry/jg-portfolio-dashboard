import { TechStackItem } from './techstack';

/** Payload accepted by `POST v1/admin/experience/{experienceId}/project`. */
export interface CreateProjectRequest {
  projectName: string | null;
  description: string | null;
  contribution: string | null;
}

export type UpdateProjectRequest = CreateProjectRequest;

/** Response returned by the project read and admin write endpoints. */
export interface ProjectDto {
  id: number;
  projectName: string | null;
  description: string | null;
  contribution: string | null;
  techStacks: TechStackItem[] | null;
}

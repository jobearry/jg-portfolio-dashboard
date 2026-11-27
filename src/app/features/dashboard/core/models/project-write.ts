import { TechStackDto } from './techstack-write';

/** Payload accepted by `POST v1/admin/experience/{experienceId}/project`. */
export interface CreateProjectRequest {
  projectName: string | null;
  description: string | null;
  contribution: string | null;
}

export type UpdateProjectRequest = CreateProjectRequest;

/** Create payload extended with the stack IDs chosen in the projects modal. */
export interface CreateProjectWithStacksRequest extends CreateProjectRequest {
  techStackIds: number[];
}

/** Body accepted by `PUT v1/admin/project/{id}/tech-stacks`. */
export interface ReplaceProjectTechStacksRequest {
  techStackIds: number[] | null;
}

/** Response returned by the project read and admin write endpoints. */
export interface ProjectDto {
  id: number;
  projectName: string | null;
  description: string | null;
  contribution: string | null;
  techStacks: TechStackDto[] | null;
}

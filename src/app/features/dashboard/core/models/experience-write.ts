import { Project } from './project';

/**
 * Payload accepted by `POST v1/admin/experience` and `PUT v1/admin/experience/{id}`.
 * The API marks every field nullable; only `company`, `role`, and `startedAt`
 * are required by the admin form.
 */
export interface ExperienceWriteRequest {
  company: string | null;
  role: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  description: string | null;
  responsibility: string | null;
  type: string | null;
}

export type CreateExperienceRequest = ExperienceWriteRequest;
export type UpdateExperienceRequest = ExperienceWriteRequest;

/** Response returned by the experience read and admin write endpoints. */
export interface ExperienceDto {
  id: number;
  company: string | null;
  role: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMonths: number | null;
  description: string | null;
  responsibility: string | null;
  type: string | null;
  projects: Project[] | null;
}

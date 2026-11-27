import { Project } from './project';
import { ProjectDto } from './project-write';

/** Maps the nullable API project DTO onto the non-nullable view model. */
export class ProjectMapper {
  static fromDto(dto: ProjectDto): Project {
    return {
      id: dto.id,
      projectName: dto.projectName ?? '',
      description: dto.description ?? '',
      contribution: dto.contribution ?? '',
      techStacks: dto.techStacks ?? null,
    };
  }
}

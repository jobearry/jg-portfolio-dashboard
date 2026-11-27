import { ExperienceTimeline } from './experience';
import { ExperienceDto } from './experience-write';
import { ProjectMapper } from './project.mapper';

/** Maps the nullable API DTO onto the non-nullable view model. */
export class ExperienceMapper {
  static fromDto(dto: ExperienceDto): ExperienceTimeline {
    return {
      id: dto.id,
      company: dto.company ?? '',
      role: dto.role ?? '',
      startedAt: dto.startedAt ?? '',
      finishedAt: dto.finishedAt ?? null,
      durationMonths: dto.durationMonths ?? 0,
      description: dto.description ?? '',
      responsibility: dto.responsibility ?? '',
      type: dto.type ?? '',
      projects: dto.projects?.map((project) => ProjectMapper.fromDto(project)) ?? null,
    };
  }
}

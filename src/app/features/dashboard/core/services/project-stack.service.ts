import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/api/api-client';
import { Project } from '../models/project';
import { ProjectMapper } from '../models/project.mapper';
import { ProjectDto, ReplaceProjectTechStacksRequest } from '../models/project-write';
import { TechStackItem } from '../models/techstack';
import { TechStackMapper } from '../models/techstack.mapper';
import { TechStackDto } from '../models/techstack-write';

/** Owns the stack catalog read and the project stack-link write. */
@Injectable({ providedIn: 'root' })
export class ProjectStackService {
  private readonly api = inject(ApiClient);

  async getAll(): Promise<TechStackItem[]> {
    const dtos = await this.api.get<TechStackDto[]>('v1/skill');
    return dtos.map((dto) => TechStackMapper.fromDto(dto));
  }

  async replaceProjectStacks(projectId: number, techStackIds: number[]): Promise<Project> {
    const body: ReplaceProjectTechStacksRequest = { techStackIds };
    const dto = await this.api.put<ProjectDto>(`v1/admin/project/${projectId}/tech-stacks`, body);
    return ProjectMapper.fromDto(dto);
  }
}

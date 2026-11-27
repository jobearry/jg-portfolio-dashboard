import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/api/api-client';
import { ExperienceSignalService, getErrorMessage } from '../../../../shared';
import { ExperienceTimeline } from '../models/experience';
import { Project } from '../models/project';
import { ExperienceMapper } from '../models/experience.mapper';
import {
  CreateExperienceRequest,
  ExperienceDto,
  UpdateExperienceRequest,
} from '../models/experience-write';
import { ProjectMapper } from '../models/project.mapper';
import { CreateProjectRequest, ProjectDto, UpdateProjectRequest } from '../models/project-write';

/** Owns experience reads that need DTO mapping and the JWT-gated write calls. */
@Injectable({ providedIn: 'root' })
export class ExperienceAdminService {
  private readonly api = inject(ApiClient);
  private readonly store = inject(ExperienceSignalService);

  async reload(): Promise<void> {
    this.store.setLoading();

    try {
      const dtos = await this.api.get<ExperienceDto[]>('v1/experience?includeProjects=false');
      this.store.setContent(dtos.map((dto) => ExperienceMapper.fromDto(dto)));
    } catch (error) {
      this.store.setError(getErrorMessage(error));
    }
  }

  async getWithProjects(id: number): Promise<ExperienceTimeline> {
    const dto = await this.api.get<ExperienceDto>(`v1/experience/${id}`);
    return ExperienceMapper.fromDto(dto);
  }

  async create(request: CreateExperienceRequest): Promise<ExperienceTimeline> {
    const dto = await this.api.post<ExperienceDto>('v1/admin/experience', request);
    return ExperienceMapper.fromDto(dto);
  }

  async update(id: number, request: UpdateExperienceRequest): Promise<ExperienceTimeline> {
    const dto = await this.api.put<ExperienceDto>(`v1/admin/experience/${id}`, request);
    return ExperienceMapper.fromDto(dto);
  }

  async createProject(experienceId: number, request: CreateProjectRequest): Promise<Project> {
    const dto = await this.api.post<ProjectDto>(
      `v1/admin/experience/${experienceId}/project`,
      request,
    );
    return ProjectMapper.fromDto(dto);
  }

  async updateProject(id: number, request: UpdateProjectRequest): Promise<Project> {
    const dto = await this.api.put<ProjectDto>(`v1/admin/project/${id}`, request);
    return ProjectMapper.fromDto(dto);
  }
}

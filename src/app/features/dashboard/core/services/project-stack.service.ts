import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/api/api-client';
import { Project } from '../models/project';
import { ProjectMapper } from '../models/project.mapper';
import { SkillCategoryMapper } from '../models/skill-category.mapper';
import { ProjectDto, ReplaceProjectTechStacksRequest } from '../models/project-write';
import { SkillCategoryItem } from '../models/skill-category';
import { TechStackItem } from '../models/techstack';
import { TechStackMapper } from '../models/techstack.mapper';
import {
  CreateSkillRequest,
  SkillCategoryDto,
  SkillCategoryRequest,
  TechStackDto,
  UpdateSkillRequest,
} from '../models/techstack-write';

/** Owns the category/skill catalog and the admin writes for Toolbox. */
@Injectable({ providedIn: 'root' })
export class ProjectStackService {
  private readonly api = inject(ApiClient);

  async getAll(): Promise<TechStackItem[]> {
    const dtos = await this.api.get<TechStackDto[]>('v1/skill');
    return dtos.map((dto) => TechStackMapper.fromDto(dto));
  }

  async getAllCategories(): Promise<SkillCategoryItem[]> {
    const dtos = await this.api.get<SkillCategoryDto[]>('v1/skill-category');
    return dtos.map((dto) => SkillCategoryMapper.fromDto(dto));
  }

  async createCategory(category: string): Promise<SkillCategoryItem> {
    const body: SkillCategoryRequest = { category };
    const dto = await this.api.post<SkillCategoryDto>('v1/admin/skill-category', body);
    return SkillCategoryMapper.fromDto(dto);
  }

  async updateCategory(id: number, category: string): Promise<SkillCategoryItem> {
    const body: SkillCategoryRequest = { category };
    const dto = await this.api.put<SkillCategoryDto>(`v1/admin/skill-category/${id}`, body);
    return SkillCategoryMapper.fromDto(dto);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.api.delete<void>(`v1/admin/skill-category/${id}`);
  }

  async createSkill(request: CreateSkillRequest): Promise<TechStackItem> {
    const dto = await this.api.post<TechStackDto>('v1/admin/skill', request);
    return TechStackMapper.fromDto(dto);
  }

  async updateSkill(id: number, request: UpdateSkillRequest): Promise<TechStackItem> {
    const dto = await this.api.put<TechStackDto>(`v1/admin/skill/${id}`, request);
    return TechStackMapper.fromDto(dto);
  }

  async deleteSkill(id: number): Promise<void> {
    await this.api.delete<void>(`v1/admin/skill/${id}`);
  }

  async replaceProjectStacks(projectId: number, techStackIds: number[]): Promise<Project> {
    const body: ReplaceProjectTechStacksRequest = { techStackIds };
    const dto = await this.api.put<ProjectDto>(`v1/admin/project/${projectId}/tech-stacks`, body);
    return ProjectMapper.fromDto(dto);
  }
}

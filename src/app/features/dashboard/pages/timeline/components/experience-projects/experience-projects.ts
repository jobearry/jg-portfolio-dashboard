import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus, lucideX } from '@ng-icons/lucide';
import {
  CreateProjectRequest,
  ExperienceAdminService,
  ExperienceTimeline,
  Project,
} from '../../../../core';
import { getApiErrorMessage, Skeleton, StateMessage } from '../../../../../../shared';
import { ProjectForm } from '../project-form/project-form';

/** Modal that lists, creates, and edits projects attached to one experience. */
@Component({
  selector: 'app-experience-projects',
  imports: [NgIcon, ProjectForm, Skeleton, StateMessage],
  providers: [provideIcons({ lucidePencil, lucidePlus, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-projects.html',
})
export class ExperienceProjects implements OnInit {
  readonly experience = input.required<ExperienceTimeline>();

  readonly cancelled = output<void>();
  readonly unauthorized = output<void>();

  private readonly admin = inject(ExperienceAdminService);

  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly adding = signal(false);
  protected readonly editingProject = signal<Project | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const experience = await this.admin.getWithProjects(this.experience().id);
      this.projects.set(experience.projects ?? []);
    } catch (error) {
      if (this.isUnauthorized(error)) {
        return;
      }

      this.error.set(getApiErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected openAdd(): void {
    this.editingProject.set(null);
    this.formError.set(null);
    this.adding.set(true);
  }

  protected openEdit(project: Project): void {
    this.adding.set(false);
    this.formError.set(null);
    this.editingProject.set(project);
  }

  protected closeForm(): void {
    this.formError.set(null);
    this.adding.set(false);
    this.editingProject.set(null);
  }

  protected async add(request: CreateProjectRequest): Promise<void> {
    this.saving.set(true);
    this.formError.set(null);

    try {
      await this.admin.createProject(this.experience().id, request);
      this.closeForm();
      await this.load();
    } catch (error) {
      if (this.isUnauthorized(error)) {
        return;
      }

      this.formError.set(getApiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveEdit(request: CreateProjectRequest): Promise<void> {
    const project = this.editingProject();
    if (!project) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      const updated = await this.admin.updateProject(project.id, request);
      this.projects.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      this.closeForm();
    } catch (error) {
      if (this.isUnauthorized(error)) {
        return;
      }

      this.formError.set(getApiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  private isUnauthorized(error: unknown): boolean {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.unauthorized.emit();
      return true;
    }

    return false;
  }
}

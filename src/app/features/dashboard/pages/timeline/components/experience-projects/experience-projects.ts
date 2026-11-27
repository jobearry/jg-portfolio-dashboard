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
import { lucidePlus, lucideX } from '@ng-icons/lucide';
import {
  CreateProjectRequest,
  ExperienceAdminService,
  ExperienceTimeline,
  Project,
} from '../../../../core';
import { getApiErrorMessage, Skeleton, StateMessage } from '../../../../../../shared';
import { ProjectForm } from '../project-form/project-form';

/** Modal that lists and creates projects attached to one experience. */
@Component({
  selector: 'app-experience-projects',
  imports: [NgIcon, ProjectForm, Skeleton, StateMessage],
  providers: [provideIcons({ lucidePlus, lucideX })],
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
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.unauthorized.emit();
        return;
      }

      this.error.set(getApiErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected openAdd(): void {
    this.formError.set(null);
    this.adding.set(true);
  }

  protected closeAdd(): void {
    this.formError.set(null);
    this.adding.set(false);
  }

  protected async add(request: CreateProjectRequest): Promise<void> {
    this.saving.set(true);
    this.formError.set(null);

    try {
      await this.admin.createProject(this.experience().id, request);
      this.closeAdd();
      await this.load();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.unauthorized.emit();
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
}

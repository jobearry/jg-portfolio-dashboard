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
  CreateProjectWithStacksRequest,
  ExperienceAdminService,
  ExperienceTimeline,
  Project,
  ProjectStackService,
  TechStackItem,
} from '../../../../core';
import { getApiErrorMessage, Skeleton, StateMessage } from '../../../../../../shared';
import { ProjectForm } from '../project-form/project-form';
import { StackPicker } from '../stack-picker/stack-picker';

/** Modal that lists, creates, and manages stacks for one experience's projects. */
@Component({
  selector: 'app-experience-projects',
  imports: [NgIcon, ProjectForm, Skeleton, StackPicker, StateMessage],
  providers: [provideIcons({ lucidePlus, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-projects.html',
})
export class ExperienceProjects implements OnInit {
  readonly experience = input.required<ExperienceTimeline>();

  readonly cancelled = output<void>();
  readonly unauthorized = output<void>();

  private readonly admin = inject(ExperienceAdminService);
  private readonly stackService = inject(ProjectStackService);

  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly stacks = signal<TechStackItem[]>([]);
  protected readonly stacksLoading = signal(false);
  protected readonly stackError = signal<string | null>(null);

  protected readonly managingId = signal<number | null>(null);
  protected readonly manageSelection = signal<number[]>([]);
  protected readonly manageSaving = signal(false);
  protected readonly manageError = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
    void this.loadStacks();
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

  protected async loadStacks(): Promise<void> {
    this.stacksLoading.set(true);
    this.stackError.set(null);

    try {
      this.stacks.set(await this.stackService.getAll());
    } catch (error) {
      if (this.isUnauthorized(error)) {
        return;
      }

      this.stackError.set('Stacks could not be loaded. Please try again.');
    } finally {
      this.stacksLoading.set(false);
    }
  }

  protected openAdd(): void {
    this.formError.set(null);
    this.notice.set(null);
    this.adding.set(true);
  }

  protected closeAdd(): void {
    this.formError.set(null);
    this.adding.set(false);
  }

  protected async add(request: CreateProjectWithStacksRequest): Promise<void> {
    this.saving.set(true);
    this.formError.set(null);
    this.notice.set(null);

    try {
      const created = await this.admin.createProject(this.experience().id, request);

      if (request.techStackIds.length > 0) {
        try {
          const updated = await this.stackService.replaceProjectStacks(
            created.id,
            request.techStackIds,
          );
          this.projects.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        } catch (error) {
          if (this.isUnauthorized(error)) {
            this.closeAdd();
            return;
          }

          this.notice.set(
            'Project created, but tech stacks were not saved. Use Manage stacks to try again.',
          );
        }
      }

      this.closeAdd();
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

  protected manage(project: Project): void {
    this.manageError.set(null);
    this.notice.set(null);
    this.manageSelection.set(project.techStacks?.map((stack) => stack.id) ?? []);
    this.managingId.set(project.id);
  }

  protected closeManage(): void {
    this.manageError.set(null);
    this.managingId.set(null);
  }

  protected async saveManage(): Promise<void> {
    const projectId = this.managingId();
    if (projectId === null) {
      return;
    }

    this.manageSaving.set(true);
    this.manageError.set(null);

    try {
      const updated = await this.stackService.replaceProjectStacks(
        projectId,
        this.manageSelection(),
      );
      this.projects.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      this.closeManage();
    } catch (error) {
      if (this.isUnauthorized(error)) {
        return;
      }

      this.manageError.set(getApiErrorMessage(error));
    } finally {
      this.manageSaving.set(false);
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

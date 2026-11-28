import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowUpRight, lucidePlus } from '@ng-icons/lucide';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CreateProjectRequest,
  ExperienceAdminService,
  ExperienceTimeline,
  Project,
} from '../../../../core';
import { getApiErrorMessage, PageHeader, Skeleton, StateMessage } from '../../../../../../shared';
import { ProjectForm } from '../project-form/project-form';

/** Routed page that lists and creates projects attached to one experience. */
@Component({
  selector: 'app-experience-projects',
  imports: [NgIcon, PageHeader, ProjectForm, RouterLink, Skeleton, StateMessage],
  providers: [provideIcons({ lucideArrowLeft, lucideArrowUpRight, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-projects.html',
})
export class ExperienceProjects {
  private readonly route = inject(ActivatedRoute);
  private readonly admin = inject(ExperienceAdminService);

  protected readonly experienceId = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly experience = signal<ExperienceTimeline | null>(null);
  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.experienceId().get('experienceId') ?? '';
      untracked(() => void this.load(id));
    });
  }

  protected async load(rawId: string): Promise<void> {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      this.experience.set(null);
      this.projects.set([]);
      this.loading.set(false);
      this.error.set('Invalid experience id.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.adding.set(false);
    this.formError.set(null);

    try {
      const experience = await this.admin.getWithProjects(id);
      this.experience.set(experience);
      this.projects.set(experience.projects ?? []);
    } catch (error) {
      this.experience.set(null);
      this.projects.set([]);
      this.error.set(getApiErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected openAdd(): void {
    this.formError.set(null);
    this.adding.set(true);
  }

  protected closeForm(): void {
    this.formError.set(null);
    this.adding.set(false);
  }

  protected async add(request: CreateProjectRequest): Promise<void> {
    const experienceId = this.experience()?.id;
    if (!experienceId) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    try {
      await this.admin.createProject(experienceId, request);
      this.closeForm();
      await this.load(String(experienceId));
    } catch (error) {
      // 401 is owned by the auth interceptor, which reopens the gate.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.closeForm();
        return;
      }

      this.formError.set(getApiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected retry(): void {
    void this.load(this.experienceId().get('experienceId') ?? '');
  }
}

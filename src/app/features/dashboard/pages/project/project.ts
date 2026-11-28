import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePencil } from '@ng-icons/lucide';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getApiErrorMessage, PageHeader, Skeleton, StateMessage } from '../../../../shared';
import {
  ExperienceAdminService,
  Project as ProjectModel,
  ProjectStackService,
  TechStackItem,
  UpdateProjectRequest,
} from '../../core';
import { ProjectForm } from '../timeline/components/project-form/project-form';
import { StackPicker } from '../timeline/components/stack-picker/stack-picker';

interface ProjectState {
  loading: boolean;
  error: string | null;
  project: ProjectModel | null;
  stacks: TechStackItem[];
}

function sameIds(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Separate admin screen for editing one project's fields and skills. */
@Component({
  selector: 'app-project-detail',
  imports: [NgIcon, PageHeader, ProjectForm, RouterLink, Skeleton, StackPicker, StateMessage],
  providers: [provideIcons({ lucideArrowLeft, lucidePencil })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project.html',
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly admin = inject(ExperienceAdminService);
  private readonly stacksService = inject(ProjectStackService);

  protected readonly projectId = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly state = signal<ProjectState>({
    loading: true,
    error: null,
    project: null,
    stacks: [],
  });
  protected readonly selectedIds = signal<number[]>([]);
  protected readonly savedIds = signal<number[]>([]);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly saved = signal(false);
  protected readonly editing = signal(false);
  protected readonly fieldsSaving = signal(false);
  protected readonly fieldError = signal<string | null>(null);
  protected readonly fieldsSaved = signal(false);
  protected readonly busy = computed(() => this.saving() || this.fieldsSaving());

  protected readonly canSave = computed(
    () =>
      !!this.state().project &&
      !this.state().loading &&
      !this.busy() &&
      !this.editing() &&
      !sameIds(this.selectedIds(), this.savedIds()),
  );

  constructor() {
    effect(() => {
      const id = this.projectId().get('id') ?? '';
      untracked(() => void this.load(id));
    });
  }

  protected async load(rawId: string): Promise<void> {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      this.state.set({ loading: false, error: 'Invalid project id.', project: null, stacks: [] });
      return;
    }

    this.state.update((state) => ({ ...state, loading: true, error: null }));
    this.saveError.set(null);
    this.saved.set(false);
    this.editing.set(false);
    this.fieldError.set(null);
    this.fieldsSaved.set(false);

    try {
      const [project, stackCatalog] = await Promise.all([
        this.admin.getProject(id),
        this.stacksService.getAll(),
      ]);
      const ids = project.techStacks?.map((stack) => stack.id) ?? [];

      this.state.set({ loading: false, error: null, project, stacks: stackCatalog });
      this.selectedIds.set(ids);
      this.savedIds.set(ids);
    } catch (error) {
      this.state.update((state) => ({
        ...state,
        loading: false,
        error: getApiErrorMessage(error),
      }));
    }
  }

  protected retry(): void {
    void this.load(this.projectId().get('id') ?? '');
  }

  protected onSelectionChange(ids: number[]): void {
    this.selectedIds.set([...ids]);
    this.saved.set(false);
  }

  protected openEdit(): void {
    if (!this.state().project) {
      return;
    }

    this.fieldError.set(null);
    this.fieldsSaved.set(false);
    this.editing.set(true);
  }

  protected closeEdit(): void {
    this.editing.set(false);
    this.fieldError.set(null);
  }

  protected async saveFields(request: UpdateProjectRequest): Promise<void> {
    const project = this.state().project;
    if (!project || this.fieldsSaving()) {
      return;
    }

    this.fieldsSaving.set(true);
    this.fieldError.set(null);
    this.fieldsSaved.set(false);

    try {
      const updated = await this.admin.updateProject(project.id, request);
      this.state.update((state) => {
        const current = state.project ?? project;
        return {
          ...state,
          project: {
            ...current,
            projectName: updated.projectName,
            description: updated.description,
            contribution: updated.contribution,
          },
        };
      });
      this.editing.set(false);
      this.fieldsSaved.set(true);
    } catch (error) {
      // 401 is owned by the auth interceptor, which reopens the gate.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.closeEdit();
        return;
      }

      this.fieldError.set(getApiErrorMessage(error));
    } finally {
      this.fieldsSaving.set(false);
    }
  }

  protected async saveSkills(): Promise<void> {
    const project = this.state().project;
    if (!project || !this.canSave()) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.saved.set(false);

    try {
      const updated = await this.stacksService.replaceProjectStacks(project.id, this.selectedIds());
      const ids = updated.techStacks?.map((stack) => stack.id) ?? [];

      this.state.update((state) => ({ ...state, project: updated }));
      this.selectedIds.set(ids);
      this.savedIds.set(ids);
      this.saved.set(true);
    } catch (error) {
      this.saveError.set(getApiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}

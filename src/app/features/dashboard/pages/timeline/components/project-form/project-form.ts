import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Skeleton } from '../../../../../../shared';
import {
  CreateProjectRequest,
  CreateProjectWithStacksRequest,
  TechStackItem,
} from '../../../../core';
import { StackPicker } from '../stack-picker/stack-picker';

type Field = keyof CreateProjectRequest;

/** Basic create form for a project attached to an experience. */
@Component({
  selector: 'app-project-form',
  imports: [Skeleton, StackPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-form.html',
})
export class ProjectForm {
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly stacks = input<TechStackItem[]>([]);
  readonly stacksLoading = input(false);
  readonly stackError = input<string | null>(null);

  readonly saved = output<CreateProjectWithStacksRequest>();
  readonly cancelled = output<void>();
  readonly retryStacks = output<void>();

  protected readonly projectName = signal('');
  protected readonly description = signal('');
  protected readonly contribution = signal('');
  protected readonly selectedStackIds = signal<number[]>([]);

  protected readonly canSave = computed(() => !!this.projectName().trim() && !this.busy());

  protected onInput(field: Field, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;

    switch (field) {
      case 'projectName':
        this.projectName.set(value);
        break;
      case 'description':
        this.description.set(value);
        break;
      case 'contribution':
        this.contribution.set(value);
        break;
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.canSave()) {
      return;
    }

    this.saved.emit({
      projectName: this.optional(this.projectName()),
      description: this.optional(this.description()),
      contribution: this.optional(this.contribution()),
      techStackIds: this.selectedStackIds(),
    });
  }

  protected onSelected(ids: number[]): void {
    this.selectedStackIds.set(ids);
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  private optional(value: string): string | null {
    const trimmed = value.trim();
    return trimmed || null;
  }
}

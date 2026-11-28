import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { StateMessage } from '../../../../../../shared';
import { TechStackItem } from '../../../../core';

/**
 * Search-only stack picker. Type to find a stack, press Enter to add the
 * first match, and remove stacks from the selected list.
 */
@Component({
  selector: 'app-stack-picker',
  imports: [StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stack-picker.html',
})
export class StackPicker {
  readonly stacks = input<TechStackItem[]>([]);
  readonly selectedIds = input<number[]>([]);
  readonly busy = input(false);
  readonly error = input<string | null>(null);

  readonly selectionChange = output<number[]>();
  readonly retry = output<void>();

  protected readonly search = signal('');

  protected readonly isSearching = computed(() => this.search().trim().length > 0);

  protected readonly match = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return null;
    }

    return (
      this.stacks().find(
        (stack) =>
          stack.stackName.toLowerCase().includes(term) && !this.selectedIds().includes(stack.id),
      ) ?? null
    );
  });

  protected readonly selectedStacks = computed(() => {
    const selected = new Set(this.selectedIds());
    return this.stacks().filter((stack) => selected.has(stack.id));
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onEnter(event: Event): void {
    const found = this.match();
    if (!found) {
      return;
    }

    this.selectionChange.emit([...this.selectedIds(), found.id]);
    this.search.set('');
    (event.target as HTMLInputElement).value = '';
  }

  protected remove(id: number): void {
    this.selectionChange.emit(this.selectedIds().filter((value) => value !== id));
  }

  protected clear(): void {
    this.selectionChange.emit([]);
  }
}

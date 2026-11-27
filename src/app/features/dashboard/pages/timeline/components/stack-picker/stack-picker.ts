import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { StateMessage } from '../../../../../../shared';
import { TechStackItem } from '../../../../core';

/** Searchable checkbox picker over the existing tech-stack catalog. */
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

  protected readonly selectedStacks = computed(() => {
    const selected = new Set(this.selectedIds());
    return this.stacks().filter((stack) => selected.has(stack.id));
  });

  protected readonly filteredStacks = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.stacks();
    }

    return this.stacks().filter((stack) => stack.stackName.toLowerCase().includes(term));
  });

  protected isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected toggle(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = new Set(this.selectedIds());

    if (checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }

    this.selectionChange.emit([...selected]);
  }

  protected remove(id: number): void {
    this.selectionChange.emit(this.selectedIds().filter((value) => value !== id));
  }

  protected clear(): void {
    this.selectionChange.emit([]);
  }
}

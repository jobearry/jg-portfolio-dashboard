import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { StateMessage } from '../../../../../../shared';
import { TechStackItem } from '../../../../core';

interface StackGroup {
  category: string;
  stacks: TechStackItem[];
}

/** Searchable, grouped checkbox picker for a project's existing tech stacks. */
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

  protected readonly groups = computed<StackGroup[]>(() => {
    const term = this.search().trim().toLowerCase();
    const grouped = new Map<string, TechStackItem[]>();

    for (const stack of this.stacks()) {
      const matches =
        !term ||
        stack.stackName.toLowerCase().includes(term) ||
        stack.category.toLowerCase().includes(term);

      if (!matches) {
        continue;
      }

      const category = stack.category || 'Other';
      const items = grouped.get(category) ?? [];
      items.push(stack);
      grouped.set(category, items);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, stacks]) => ({ category, stacks }));
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

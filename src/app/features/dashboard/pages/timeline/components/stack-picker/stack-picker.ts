import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { StateMessage } from '../../../../../../shared';
import { TechStackItem } from '../../../../core';

/**
 * Combobox-style stack picker. Typing opens a list of unused stacks; arrow keys
 * and Enter add the active result, and selected stacks stay as removable chips.
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

  protected readonly listboxId = 'stack-search-listbox';
  protected readonly optionClass =
    'flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted';
  protected readonly activeOptionClass =
    'flex cursor-pointer items-center rounded-md bg-accent-brand/10 px-3 py-2 text-sm font-medium text-accent-brand';

  protected readonly search = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly dismissed = signal(false);

  protected readonly hasQuery = computed(() => this.search().trim().length > 0);

  protected readonly matches = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return [];
    }

    const selected = new Set(this.selectedIds());
    return this.stacks().filter(
      (stack) => !selected.has(stack.id) && stack.stackName.toLowerCase().includes(term),
    );
  });

  protected readonly open = computed(
    () => !this.dismissed() && !this.busy() && this.matches().length > 0,
  );

  protected readonly activeOption = computed(() => {
    const matches = this.matches();
    if (matches.length === 0) {
      return null;
    }

    return matches[Math.min(this.activeIndex(), matches.length - 1)] ?? null;
  });

  protected readonly activeOptionId = computed(() => {
    const active = this.activeOption();
    return active ? this.optionId(active.id) : null;
  });

  protected readonly selectedStacks = computed(() => {
    const selected = new Set(this.selectedIds());
    return this.stacks().filter((stack) => selected.has(stack.id));
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
    this.dismissed.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.busy()) {
      return;
    }

    const count = this.matches().length;

    switch (event.key) {
      case 'ArrowDown':
        if (!count) {
          return;
        }
        event.preventDefault();
        this.dismissed.set(false);
        this.activeIndex.set((Math.min(this.activeIndex(), count - 1) + 1) % count);
        return;
      case 'ArrowUp':
        if (!count) {
          return;
        }
        event.preventDefault();
        this.dismissed.set(false);
        this.activeIndex.set((Math.min(this.activeIndex(), count - 1) - 1 + count) % count);
        return;
      case 'Enter': {
        if (!this.open()) {
          return;
        }
        event.preventDefault();
        const active = this.activeOption();
        if (active) {
          this.select(active);
        }
        return;
      }
      case 'Escape':
        if (!this.open()) {
          return;
        }
        event.preventDefault();
        this.dismissed.set(true);
        return;
    }
  }

  protected optionId(id: number): string {
    return `stack-option-${id}`;
  }

  protected isActive(stack: TechStackItem): boolean {
    return stack.id === this.activeOption()?.id;
  }

  protected select(stack: TechStackItem): void {
    if (this.selectedIds().includes(stack.id)) {
      return;
    }

    this.selectionChange.emit([...this.selectedIds(), stack.id]);
    this.search.set('');
    this.activeIndex.set(0);
    this.dismissed.set(true);
  }

  protected remove(id: number): void {
    this.selectionChange.emit(this.selectedIds().filter((value) => value !== id));
  }

  protected clear(): void {
    this.selectionChange.emit([]);
  }
}

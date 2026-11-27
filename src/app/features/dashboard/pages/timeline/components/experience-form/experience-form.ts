import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ExperienceTimeline, ExperienceWriteRequest } from '../../../../core';

type Field = keyof ExperienceWriteRequest;

/** Modal form shared by the add and edit actions on the timeline. */
@Component({
  selector: 'app-experience-form',
  imports: [NgIcon],
  providers: [provideIcons({ lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-form.html',
})
export class ExperienceForm {
  readonly experience = input<ExperienceTimeline | null>(null);
  readonly error = input<string | null>(null);

  readonly saved = output<ExperienceWriteRequest>();
  readonly cancelled = output<void>();

  private readonly companyInput = viewChild<ElementRef<HTMLInputElement>>('companyInput');

  protected readonly company = signal('');
  protected readonly role = signal('');
  protected readonly startedAt = signal('');
  protected readonly finishedAt = signal('');
  protected readonly description = signal('');
  protected readonly responsibility = signal('');
  protected readonly type = signal('');

  protected readonly canSave = computed(
    () => !!this.company().trim() && !!this.role().trim() && !!this.startedAt(),
  );

  constructor() {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    effect(() => {
      const item = this.experience();
      this.company.set(item?.company ?? '');
      this.role.set(item?.role ?? '');
      this.startedAt.set(this.dateOnly(item?.startedAt ?? null));
      this.finishedAt.set(this.dateOnly(item?.finishedAt ?? null));
      this.description.set(item?.description ?? '');
      this.responsibility.set(item?.responsibility ?? '');
      this.type.set(item?.type ?? '');
    });

    afterNextRender(() => this.companyInput()?.nativeElement.focus());
    inject(DestroyRef).onDestroy(() => previouslyFocused?.focus());
  }

  protected onInput(field: Field, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;

    switch (field) {
      case 'company':
        this.company.set(value);
        break;
      case 'role':
        this.role.set(value);
        break;
      case 'startedAt':
        this.startedAt.set(value);
        break;
      case 'finishedAt':
        this.finishedAt.set(value);
        break;
      case 'description':
        this.description.set(value);
        break;
      case 'responsibility':
        this.responsibility.set(value);
        break;
      case 'type':
        this.type.set(value);
        break;
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.canSave()) {
      return;
    }

    this.saved.emit({
      company: this.optional(this.company()),
      role: this.optional(this.role()),
      startedAt: this.toIso(this.startedAt()),
      finishedAt: this.toIso(this.finishedAt()),
      description: this.optional(this.description()),
      responsibility: this.optional(this.responsibility()),
      type: this.optional(this.type()),
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  private optional(value: string): string | null {
    const trimmed = value.trim();
    return trimmed || null;
  }

  private toIso(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const date = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private dateOnly(value: string | null): string {
    return value?.slice(0, 10) ?? '';
  }
}

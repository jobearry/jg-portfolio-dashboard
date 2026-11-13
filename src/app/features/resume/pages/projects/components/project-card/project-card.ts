import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Project } from '../../types/project.type';

/**
 * Presentational client-project card. The portfolio API does not expose a
 * project URL, so the card is intentionally non-interactive.
 */
@Component({
  selector: 'app-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <article
      class="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-5 text-card-foreground"
    >
      <div
        class="flex items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground"
      >
        <span>{{ index() }}</span>
        <span>Client project</span>
      </div>

      <div
        class="mt-5 flex h-32 items-center justify-center rounded-md border border-border bg-background/60"
        aria-hidden="true"
      >
        <span class="font-serif text-4xl font-semibold text-accent-brand">{{ initial() }}</span>
      </div>

      <h3 class="mt-5 text-xl font-semibold tracking-tight text-foreground">
        {{ project().title }}
      </h3>
      <p class="mt-2 flex-1 text-xs leading-6 text-muted-foreground">
        {{ project().contribution }}
      </p>

      @if (project().tags.length) {
        <ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Project technologies">
          @for (tag of project().tags; track tag) {
            <li
              class="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground"
            >
              {{ tag }}
            </li>
          }
        </ul>
      }
    </article>
  `,
})
export class ProjectCard {
  readonly project = input.required<Project>();
  readonly index = input('01');

  protected readonly initial = computed(() => {
    const match = this.project().title.match(/[a-zA-Z0-9]/);
    return match ? match[0].toUpperCase() : '·';
  });
}

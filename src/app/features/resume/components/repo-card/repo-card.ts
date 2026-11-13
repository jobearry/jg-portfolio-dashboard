import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { GithubRepo } from '../../core';

/**
 * Presentational GitHub repository card. The whole card is the external link,
 * so it must not contain any other interactive elements.
 */
@Component({
  selector: 'app-repo-card',
  imports: [NgIcon],
  providers: [provideIcons({ lucideArrowUpRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <a
      [href]="repo().htmlUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-5 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-accent-brand/60 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        class="flex items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground"
      >
        <span>{{ index() }}</span>
        <ng-icon name="lucideArrowUpRight" size="18" aria-hidden="true" />
      </div>

      <div
        class="mt-5 flex h-32 items-center justify-center rounded-md border border-border bg-background/60"
        aria-hidden="true"
      >
        <span class="font-serif text-4xl font-semibold text-accent-brand">{{ initial() }}</span>
      </div>

      <p class="mt-5 text-[10px] font-bold tracking-[0.12em] text-accent-brand uppercase">
        {{ type() }}
      </p>
      <h3 class="mt-2 text-xl font-semibold tracking-tight text-foreground">{{ repo().name }}</h3>
      <p class="mt-2 flex-1 text-xs leading-6 text-muted-foreground">{{ description() }}</p>

      @if (repo().topics.length) {
        <ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Repository topics">
          @for (topic of repo().topics; track topic) {
            <li
              class="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground"
            >
              {{ topic }}
            </li>
          }
        </ul>
      }
    </a>
  `,
})
export class RepoCard {
  readonly repo = input.required<GithubRepo>();
  readonly index = input('01');

  protected readonly initial = computed(() => {
    const match = this.repo().name.match(/[a-zA-Z0-9]/);
    return match ? match[0].toUpperCase() : '·';
  });

  protected readonly type = computed(() => this.repo().language || 'Repository');

  protected readonly description = computed(
    () => this.repo().description || 'No description provided.',
  );
}

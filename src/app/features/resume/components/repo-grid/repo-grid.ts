import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { Skeleton, StateMessage } from '../../../../shared';
import { GithubRepo } from '../../core';
import { RepoCard } from '../repo-card/repo-card';

/**
 * Presentational repository grid with shared loading, empty, and retryable
 * error states. The owning screen decides which repositories to pass.
 */
@Component({
  selector: 'app-repo-grid',
  imports: [RouterLink, NgIcon, RepoCard, Skeleton, StateMessage],
  providers: [provideIcons({ lucideArrowRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (loading()) {
      <app-skeleton variant="card" [rows]="3" />
    } @else if (error()) {
      <app-state-message kind="error" [message]="error() ?? ''" (retry)="retry.emit()" />
    } @else if (repos().length === 0) {
      <app-state-message kind="empty" [message]="emptyMessage()" />
    } @else {
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @for (repo of repos(); track repo.id; let index = $index) {
          <li>
            <app-repo-card [repo]="repo" [index]="label(index)" />
          </li>
        }
      </ul>

      @if (showViewMore()) {
        <div class="mt-5 flex justify-end">
          <a
            routerLink="/projects"
            class="inline-flex items-center gap-2 rounded-md text-sm font-medium text-accent-brand transition-colors hover:text-accent-brand/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            View more
            <ng-icon name="lucideArrowRight" size="16" aria-hidden="true" />
          </a>
        </div>
      }
    }
  `,
})
export class RepoGrid {
  readonly repos = input<readonly GithubRepo[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyMessage = input('No public repositories to show yet.');
  readonly showViewMore = input(false);

  readonly retry = output<void>();

  protected label(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayoutDashboard } from '@ng-icons/lucide';

/**
 * In-app escape hatch from the public résumé pages back to the dashboard.
 *
 * The public routes (`/` and `/projects`) render outside the dashboard shell,
 * so without this the only way back is editing the URL.
 */
@Component({
  selector: 'app-dashboard-link',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideLayoutDashboard })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <a
      routerLink="/dashboard"
      aria-label="View dashboard"
      class="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent-brand hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <ng-icon name="lucideLayoutDashboard" size="18" aria-hidden="true" />
    </a>
  `,
})
export class DashboardLink {}

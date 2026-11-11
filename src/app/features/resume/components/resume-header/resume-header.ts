import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { site } from '../../../../core/config/site.config';
import { DashboardLink } from '../dashboard-link';
import { ThemeToggler } from '../theme-toggler';

/**
 * Public résumé header: initials brand, in-page section navigation, and the
 * dashboard/theme controls. The navigation uses router fragments so it also
 * works from `/projects`.
 */
@Component({
  selector: 'app-resume-header',
  imports: [RouterLink, DashboardLink, ThemeToggler],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header
      class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6"
    >
      <a
        routerLink="/"
        [attr.aria-label]="profile.name + ', home'"
        class="inline-flex items-baseline text-lg font-extrabold tracking-tight text-foreground transition-colors hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <span>{{ initials() }}</span
        ><span class="text-accent-brand">.</span>
      </a>

      <nav
        aria-label="Primary"
        class="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground sm:order-none sm:w-auto"
      >
        @for (link of navLinks; track link.fragment) {
          <a
            [routerLink]="['/']"
            [fragment]="link.fragment"
            class="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {{ link.label }}
          </a>
        }
      </nav>

      <div class="flex items-center gap-1">
        <app-dashboard-link />
        <app-theme-toggler />
      </div>
    </header>
  `,
})
export class ResumeHeader {
  protected readonly profile = site.profile;

  protected readonly navLinks = [
    { label: 'About', fragment: 'about' },
    { label: 'Experience', fragment: 'experience' },
    { label: 'Tech Stack', fragment: 'tech-stack' },
    { label: 'Work', fragment: 'work' },
    { label: 'Contact', fragment: 'contact' },
  ] as const;

  protected readonly initials = computed(() => {
    const parts = this.profile.name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return `${first}${last}`.toUpperCase();
  });
}

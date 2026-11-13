import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUp, lucideGithub } from '@ng-icons/lucide';
import { environment } from '../../../../../environments/environment';
import { site } from '../../../../core/config/site.config';

/**
 * Public résumé footer. Keeps the development marker while matching the
 * redesigned page chrome.
 */
@Component({
  selector: 'app-resume-footer',
  imports: [NgIcon],
  providers: [provideIcons({ lucideArrowUp, lucideGithub })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <footer
      class="mx-auto w-full max-w-6xl border-t border-border px-4 py-7 text-xs text-muted-foreground sm:px-6"
    >
      <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p class="text-center sm:text-left">
          © {{ year }} {{ profile.name }}
          @if (env) {
            <span class="font-bold text-red-600">{{ env }}</span>
          }
        </p>

        <div class="flex items-center gap-3">
          <a
            [href]="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            class="rounded-full p-1 transition-colors hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <ng-icon name="lucideGithub" size="16" aria-hidden="true" />
          </a>
          <a
            href="#top"
            aria-label="Back to top"
            class="rounded-full p-1 transition-colors hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <ng-icon name="lucideArrowUp" size="16" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class ResumeFooter {
  protected readonly profile = site.profile;
  protected readonly githubUrl = site.links.github;
  protected readonly env = environment.title;
  protected readonly year = new Date().getFullYear();
}

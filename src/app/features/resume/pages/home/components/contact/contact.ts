import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideFileDown,
  lucideGithub,
  lucideLayoutDashboard,
} from '@ng-icons/lucide';
import { site } from '../../../../../../core/config/site.config';

/**
 * Closing call to action. There is no public email in the site config, so the
 * panel points at the CV, GitHub, and dashboard instead.
 */
@Component({
  selector: 'app-contact',
  imports: [RouterLink, NgIcon],
  providers: [
    provideIcons({ lucideArrowRight, lucideFileDown, lucideGithub, lucideLayoutDashboard }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      id="contact"
      aria-labelledby="contact-heading"
      class="rounded-lg border border-border bg-card px-5 py-16 text-center sm:px-6 sm:py-20"
    >
      <div
        class="mx-auto flex size-14 items-center justify-center rounded-full border border-border text-accent-brand"
        aria-hidden="true"
      >
        <ng-icon name="lucideArrowRight" size="24" />
      </div>

      <p class="mt-6 text-xs font-bold tracking-[0.16em] text-accent-brand uppercase">
        Explore my work
      </p>
      <h2
        id="contact-heading"
        class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      >
        Let’s build something useful.
      </h2>
      <p class="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
        Browse my client projects and public repositories, or download my CV for the full
        background.
      </p>

      <div class="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
        @if (cvUrl) {
          <a
            [href]="cvUrl"
            download="cv-golimlim.pdf"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent-brand px-4 text-xs font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-brand/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <ng-icon name="lucideFileDown" size="16" aria-hidden="true" />
            Download CV
          </a>
        }

        <a
          [href]="githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-xs font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <ng-icon name="lucideGithub" size="16" aria-hidden="true" />
          View GitHub
        </a>

        <a
          routerLink="/dashboard"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ng-icon name="lucideLayoutDashboard" size="16" aria-hidden="true" />
          View dashboard
        </a>
      </div>
    </section>
  `,
})
export class Contact {
  protected readonly cvUrl = site.links.cv;
  protected readonly githubUrl = site.links.github;
}

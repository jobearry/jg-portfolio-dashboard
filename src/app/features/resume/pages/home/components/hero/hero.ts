import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideFileDown, lucideGithub } from '@ng-icons/lucide';
import { site } from '../../../../../../core/config/site.config';

/**
 * Landing-page hero. Uses the configured profile, links, and avatar.
 */
@Component({
  selector: 'app-hero',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideArrowRight, lucideFileDown, lucideGithub })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      aria-labelledby="hero-heading"
      class="relative grid grid-cols-1 justify-items-center gap-6 px-2 pt-8 pb-14 text-center sm:px-4 sm:pt-12 sm:pb-20 md:grid-cols-[auto_auto] md:items-center md:justify-center md:gap-10 md:text-left lg:gap-14"
    >
      <figure class="shrink-0">
        <img
          id="hero-image"
          class="size-24 rounded-full border border-border object-cover ring-4 ring-accent-brand/10 sm:size-28 md:size-32 lg:size-40"
          [src]="profileImage"
          [alt]="'Photo of ' + profile.name"
        />
      </figure>

      <div class="flex min-w-0 flex-col items-center md:items-start">
        <h1
          id="hero-heading"
          class="max-w-3xl text-4xl font-semibold tracking-tighter text-foreground sm:text-6xl lg:text-7xl"
        >
          {{ profile.name }}
        </h1>

        <div class="mt-7 flex flex-wrap items-center justify-center gap-1.5 sm:mt-8 sm:gap-2">
          <a
            routerLink="/projects"
            class="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent-brand px-2.5 text-xs font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-brand/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-4"
          >
            View projects
            <ng-icon name="lucideArrowRight" size="16" aria-hidden="true" />
          </a>

          @if (cvUrl) {
            <a
              [href]="cvUrl"
              download="cv-golimlim.pdf"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-4"
            >
              <ng-icon name="lucideFileDown" size="16" aria-hidden="true" />
              Download CV
            </a>
          }

          <a
            [href]="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View GitHub profile"
            class="inline-flex size-11 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent-brand hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <ng-icon name="lucideGithub" size="18" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  `,
})
export class Hero {
  protected readonly profile = site.profile;
  protected readonly profileImage = site.assets.profileAvatar;
  protected readonly githubUrl = site.links.github;
  protected readonly cvUrl = site.links.cv;
}

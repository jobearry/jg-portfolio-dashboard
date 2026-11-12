import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideFileDown, lucideGithub, lucideMapPin } from '@ng-icons/lucide';
import { site } from '../../../../../../core/config/site.config';
import { Pill } from '../../../../components/pill';

/**
 * Landing-page hero. Uses the configured profile, links, and avatar; the
 * headline splits the name so the last word can carry the accent treatment.
 */
@Component({
  selector: 'app-hero',
  imports: [RouterLink, NgIcon, Pill],
  providers: [provideIcons({ lucideArrowRight, lucideFileDown, lucideGithub, lucideMapPin })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      aria-labelledby="hero-heading"
      class="relative flex flex-col items-center px-2 pt-8 pb-14 text-center sm:px-4 sm:pt-12 sm:pb-20"
    >
      <figure class="mb-6 shrink-0">
        <img
          id="hero-image"
          class="size-24 rounded-full border border-border object-cover ring-4 ring-accent-brand/10 sm:size-28 md:size-32"
          [src]="profileImage"
          [alt]="'Photo of ' + profile.name"
        />
      </figure>

      <p class="text-xs font-bold tracking-[0.16em] text-accent-brand uppercase">
        {{ profile.role }}
      </p>

      <h1
        id="hero-heading"
        class="mt-4 max-w-3xl text-4xl font-semibold tracking-tighter text-foreground sm:text-6xl lg:text-7xl"
      >
        @if (nameParts().first) {
          <span>{{ nameParts().first }}</span>
        }
        {{ ' ' }}
        <em class="font-serif font-normal text-accent-brand">{{ nameParts().last }}</em>
      </h1>

      <p class="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
        {{ profile.bio }}
      </p>

      <div class="mt-5 flex flex-col items-center gap-3">
        <p class="flex items-center gap-2 text-xs text-muted-foreground">
          <ng-icon name="lucideMapPin" size="15" aria-hidden="true" />
          <span>{{ profile.location }}</span>
        </p>

        <ul class="flex flex-wrap justify-center gap-2" aria-label="Roles">
          <li><app-pill label="Software Engineer" variant="brand" size="sm" /></li>
          <li><app-pill label="Fullstack Developer" variant="brand" size="sm" /></li>
        </ul>
      </div>

      <div class="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <a
          routerLink="/projects"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent-brand px-4 text-xs font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-brand/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          View projects
          <ng-icon name="lucideArrowRight" size="16" aria-hidden="true" />
        </a>

        @if (cvUrl) {
          <a
            [href]="cvUrl"
            download="cv-golimlim.pdf"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-xs font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
          class="inline-flex size-11 items-center justify-center self-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent-brand hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:self-auto"
        >
          <ng-icon name="lucideGithub" size="18" aria-hidden="true" />
        </a>
      </div>
    </section>
  `,
})
export class Hero {
  protected readonly profile = site.profile;
  protected readonly profileImage = site.assets.profileAvatar;
  protected readonly githubUrl = site.links.github;
  protected readonly cvUrl = site.links.cv;

  protected readonly nameParts = computed(() => {
    const parts = this.profile.name.trim().split(/\s+/);
    return {
      first: parts.slice(0, -1).join(' '),
      last: parts[parts.length - 1] ?? '',
    };
  });
}

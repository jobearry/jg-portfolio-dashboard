import { ChangeDetectionStrategy, Component } from '@angular/core';
import { site } from '../../../../../core/config/site.config';

/**
 * About section rendered as a fastfetch-style terminal fetch: an ASCII mark
 * beside a short list of profile facts.
 */
@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      id="about"
      aria-labelledby="about-heading"
      class="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div class="flex items-center gap-1.5 border-b border-border bg-background/40 px-5 py-2.5 sm:px-6">
        <span class="size-2 rounded-full bg-muted-foreground/30" aria-hidden="true"></span>
        <span class="size-2 rounded-full bg-muted-foreground/30" aria-hidden="true"></span>
        <span class="size-2 rounded-full bg-muted-foreground/30" aria-hidden="true"></span>
        <h2
          id="about-heading"
          class="ml-auto font-mono text-[10px] tracking-wide text-muted-foreground"
        >
          <span aria-hidden="true">~/about</span>
          <span class="sr-only">About</span>
        </h2>
      </div>

      <div class="p-5 font-mono text-[11px] leading-6 sm:p-6">
        <div
          class="flex flex-col gap-6 lg:mx-auto lg:max-w-4xl lg:flex-row lg:items-center lg:gap-10"
        >
          <pre
            class="shrink-0 text-[10px] leading-[1.15] text-accent-brand/70"
            aria-hidden="true"
            [textContent]="mark"
          ></pre>

          <div class="min-w-0 flex-1">
            <p class="border-b border-border pb-2">
              <span class="text-accent-brand">{{ user }}</span
              ><span class="text-foreground">@portfolio</span>
            </p>

            <p class="mt-3"><span class="text-accent-brand">$</span> cat bio.txt</p>
            <p class="mt-1 max-w-2xl text-pretty text-muted-foreground">
              I build full-stack web applications with
              <strong class="font-medium text-foreground">Angular</strong> and
              <strong class="font-medium text-foreground">.NET</strong>, and I'm learning
              AI-assisted development. Outside work, I'm exploring
              <strong class="font-medium text-foreground">Linux</strong> and
              <strong class="font-medium text-foreground">homelab</strong> server management.
            </p>

            <dl class="mt-4 grid gap-1 md:auto-cols-fr md:grid-flow-col md:grid-rows-4 md:gap-x-10">
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Role</dt>
                <dd class="text-foreground">{{ profile.role }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Focus</dt>
                <dd class="text-foreground">Full-stack web apps</dd>
              </div>
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Stack</dt>
                <dd class="text-foreground">Angular · .NET</dd>
              </div>
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Workflow</dt>
                <dd class="text-foreground">AI-assisted</dd>
              </div>
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Learning</dt>
                <dd class="text-foreground">Linux · homelab</dd>
              </div>
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Location</dt>
                <dd class="text-foreground">{{ profile.location }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="w-20 shrink-0 text-accent-brand">Handle</dt>
                <dd class="text-foreground">{{ profile.handle }}</dd>
              </div>
            </dl>

            <p class="mt-3" aria-hidden="true">
              <span class="text-accent-brand">$</span>
              <span
                class="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-accent-brand align-middle motion-reduce:animate-none"
              ></span>
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class About {
  protected readonly profile = site.profile;
  protected readonly user = site.profile.handle.replace('@', '');
  protected readonly mark = [
    '     ██╗ ██████╗',
    '     ██║██╔════╝',
    '     ██║██║  ███╗',
    '██   ██║██║   ██║',
    '╚█████╔╝╚██████╔╝',
    ' ╚════╝  ╚═════╝',
  ].join('\n');
}

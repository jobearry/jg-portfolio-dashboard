import { ChangeDetectionStrategy, Component } from '@angular/core';
import { site } from '../../../../../core/config/site.config';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="grid gap-6 md:grid-cols-5 md:gap-10">
      <p class="text-2xl font-semibold tracking-tight text-foreground md:col-span-2 md:text-3xl">
        {{ profile.bio }}
      </p>

      <div class="space-y-4 text-sm leading-7 text-muted-foreground md:col-span-3">
        <p>
          I am a software engineer who has experience in developing web applications through Angular
          and .NET, and AI-assisted development.
        </p>
        <p>
          On my free time, I enjoy learning new things, and try new technologies. Right now, I am
          exploring server management by using Linux and setting up a Homelab.
        </p>
      </div>
    </div>
  `,
})
export class About {
  protected readonly profile = site.profile;
}

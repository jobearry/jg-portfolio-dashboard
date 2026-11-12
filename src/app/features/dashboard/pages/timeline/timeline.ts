import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import {
  ExperienceSignalService,
  getContent,
  PageHeader,
  Skeleton,
  StateMessage,
} from '../../../../shared';
import { ExperienceTimeline } from '../../core';

@Component({
  selector: 'app-timeline',
  imports: [PageHeader, Skeleton, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex w-full flex-col gap-5">
      @if (state().loading) {
        <div class="flex flex-col gap-5">
          <app-skeleton variant="text" [rows]="3" />
          <app-skeleton variant="list" [rows]="3" />
        </div>
      } @else if (state().error) {
        <app-state-message kind="error" [message]="state().error ?? ''" (retry)="load()" />
      } @else if (state().content.length === 0) {
        <app-state-message kind="empty" message="No experience has been published yet." />
      } @else {
        <app-page-header
          eyebrow="Career"
          title="Experience timeline"
          description="Roles, responsibilities, and the projects I've worked on."
        />

        <ul class="flex flex-col gap-4">
          @for (experience of orderedExperiences(); track experience.id) {
            <li class="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-4 sm:p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 class="text-lg font-semibold">{{ experience.company }}</h3>

                @if (year(experience.startedAt); as startYear) {
                  <span
                    class="w-fit rounded-full border border-accent-brand/30 bg-accent-brand/10 px-3 py-1 text-xs font-medium text-accent-brand tabular-nums"
                  >
                    {{ startYear }}
                  </span>
                }
              </div>

              <div class="flex flex-col gap-1">
                <p class="text-sm font-medium text-foreground">
                  {{ experience.role }}
                  <span class="font-normal text-muted-foreground">
                    | {{ experience.description }}
                  </span>
                </p>
                <p class="text-sm leading-relaxed text-muted-foreground">
                  {{ experience.responsibility }}
                </p>
              </div>

              @if (experience.projects && experience.projects.length > 0) {
                <div class="flex flex-col gap-3 border-t border-border pt-4">
                  <h4
                    class="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    <span class="h-2 w-2 rounded-full bg-accent-brand" aria-hidden="true"></span>
                    Projects
                  </h4>

                  <ul class="grid gap-3">
                    @for (project of experience.projects; track project.id) {
                      <li
                        class="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-4"
                      >
                        <h5 class="text-sm font-semibold">{{ project.projectName }}</h5>
                        <p class="text-sm leading-relaxed text-muted-foreground">
                          {{ project.description }}
                        </p>

                        <ul class="flex flex-wrap gap-2">
                          @for (stack of project.techStacks ?? []; track stack.id) {
                            <li
                              class="rounded-md bg-muted px-2 py-1 text-xs tracking-wide text-muted-foreground"
                            >
                              {{ stack.stackName }}
                            </li>
                          }
                        </ul>
                      </li>
                    }
                  </ul>
                </div>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class Timeline implements OnInit {
  private readonly _experienceService = inject(ExperienceSignalService);
  protected readonly state = computed(() => this._experienceService.getState());
  protected readonly orderedExperiences = computed(() =>
    [...this.state().content].sort((left, right) => {
      return Date.parse(right.startedAt) - Date.parse(left.startedAt);
    }),
  );

  ngOnInit() {
    void this.load();
  }

  protected load() {
    return getContent<ExperienceTimeline>(
      'v1/experience?includeProjects=false',
      this._experienceService,
    );
  }

  protected year(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : String(date.getFullYear());
  }
}

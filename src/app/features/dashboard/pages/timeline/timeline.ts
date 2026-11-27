import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus } from '@ng-icons/lucide';
import {
  ExperienceSignalService,
  getApiErrorMessage,
  PageHeader,
  Skeleton,
  StateMessage,
} from '../../../../shared';
import { ExperienceAdminService, ExperienceTimeline, ExperienceWriteRequest } from '../../core';
import { ExperienceForm } from './components/experience-form/experience-form';

@Component({
  selector: 'app-timeline',
  imports: [ExperienceForm, NgIcon, PageHeader, Skeleton, StateMessage],
  providers: [provideIcons({ lucidePencil, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mx-auto flex w-full max-w-5xl flex-col gap-5 px-2 py-3 sm:px-6 sm:py-5 lg:px-10"
    >
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
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <app-page-header
            eyebrow="Career"
            title="Experience timeline"
            description="Roles, responsibilities, and the projects I've worked on."
          />

          <button
            type="button"
            aria-label="Add experience"
            class="inline-flex w-fit items-center gap-2 rounded-md bg-accent-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            (click)="openAdd()"
          >
            <ng-icon name="lucidePlus" size="16" aria-hidden="true" />
            Add experience
          </button>
        </div>

        <ol class="relative space-y-6 border-l border-accent-brand/20 pl-8">
          @for (experience of orderedExperiences(); track experience.id) {
            <li class="relative">
              <span
                class="pointer-events-none absolute -left-[38px] top-6 size-3 rounded-full bg-accent-brand ring-4 ring-background"
                aria-hidden="true"
              ></span>
              <article
                class="flex min-h-64 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-accent-brand/40 hover:shadow-md"
              >
                <div class="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex min-w-0 flex-col gap-1">
                      <h3
                        class="text-xl font-semibold tracking-tight text-foreground"
                        [textContent]="experience.company"
                      ></h3>
                      <p class="text-sm font-medium text-muted-foreground">
                        {{ experience.role }}
                      </p>
                    </div>

                    <button
                      type="button"
                      [attr.aria-label]="'Edit experience at ' + experience.company"
                      class="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-accent-brand hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      (click)="openEdit(experience)"
                    >
                      <ng-icon name="lucidePencil" size="16" aria-hidden="true" />
                    </button>
                  </div>

                  <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    @if (period(experience); as range) {
                      <span
                        class="w-fit rounded-full border border-accent-brand/30 bg-accent-brand/10 px-3 py-1 font-medium text-accent-brand tabular-nums"
                      >
                        {{ range }}
                      </span>
                    }
                    @if (experience.type) {
                      <span
                        class="w-fit rounded-full border border-border bg-muted/50 px-2.5 py-1 font-medium"
                      >
                        {{ experience.type }}
                      </span>
                    }
                    @if (durationLabel(experience); as duration) {
                      <span>{{ duration }}</span>
                    }
                  </div>

                  <div class="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
                    @if (experience.description) {
                      <p>{{ experience.description }}</p>
                    }
                    @if (experience.responsibility) {
                      <p>{{ experience.responsibility }}</p>
                    }
                  </div>

                  @if (experience.projects && experience.projects.length > 0) {
                    <div class="mt-auto flex flex-col gap-3 border-t border-border pt-4">
                      <h4
                        class="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase"
                      >
                        <span
                          class="h-2 w-2 rounded-full bg-accent-brand"
                          aria-hidden="true"
                        ></span>
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
                </div>
              </article>
            </li>
          }
        </ol>

        @if (formOpen()) {
          <app-experience-form
            [experience]="editing()"
            [error]="formError()"
            (saved)="save($event)"
            (cancelled)="closeForm()"
          />
        }
      }
    </section>
  `,
})
export class Timeline implements OnInit {
  private readonly _experienceService = inject(ExperienceSignalService);
  private readonly admin = inject(ExperienceAdminService);

  protected readonly state = computed(() => this._experienceService.getState());
  protected readonly orderedExperiences = computed(() =>
    [...this.state().content].sort((left, right) => {
      return Date.parse(right.startedAt) - Date.parse(left.startedAt);
    }),
  );

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<ExperienceTimeline | null>(null);
  protected readonly formError = signal<string | null>(null);

  ngOnInit() {
    void this.load();
  }

  protected load() {
    return this.admin.reload();
  }

  protected openAdd(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(experience: ExperienceTimeline): void {
    this.editing.set(experience);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  protected async save(request: ExperienceWriteRequest): Promise<void> {
    this.formError.set(null);

    try {
      const item = this.editing();
      if (item) {
        await this.admin.update(item.id, request);
      } else {
        await this.admin.create(request);
      }

      this.closeForm();
      await this.load();
    } catch (error) {
      // 401 is owned by the auth interceptor, which reopens the gate.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.closeForm();
        return;
      }

      this.formError.set(getApiErrorMessage(error));
    }
  }

  protected period(experience: ExperienceTimeline): string | null {
    const start = this.year(experience.startedAt);
    if (!start) {
      return null;
    }

    const end = this.year(experience.finishedAt) ?? 'Present';
    return `${start} – ${end}`;
  }

  protected durationLabel(experience: ExperienceTimeline): string | null {
    const months = experience.durationMonths;
    if (!months || months <= 0) {
      return null;
    }

    const years = Math.floor(months / 12);
    const remaining = months % 12;
    const parts: string[] = [];

    if (years) {
      parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    }
    if (remaining) {
      parts.push(`${remaining} ${remaining === 1 ? 'mo' : 'mos'}`);
    }

    return parts.join(' ');
  }

  protected year(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : String(date.getFullYear());
  }
}

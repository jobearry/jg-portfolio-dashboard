import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import {
  ExperienceSignalService,
  getContent,
  Skeleton,
  StateMessage,
} from '../../../../../../shared';
import { ExperienceTimeline } from '../../../../../dashboard/core';

interface ExperienceView {
  id: number;
  period: string;
  role: string;
  company: string;
  type: string;
  detail: string;
}

@Component({
  selector: 'app-timeline',
  imports: [Skeleton, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state().loading) {
      <app-skeleton variant="card" [rows]="3" />
    } @else if (state().error) {
      <app-state-message kind="error" [message]="state().error ?? ''" (retry)="load()" />
    } @else if (state().content.length === 0) {
      <app-state-message kind="empty" message="No experience has been published yet." />
    } @else {
      <ol class="grid gap-0 md:grid-cols-3 md:gap-x-7">
        @for (experience of experiences(); track experience.id) {
          <li
            class="relative border-l border-border pb-8 pl-6 last:pb-0 md:border-t md:border-r md:border-l-0 md:pt-7 md:pr-7 md:pb-0 md:pl-0 md:last:border-r-0"
          >
            <span
              class="absolute top-1 -left-1 size-2.5 rounded-full border-2 border-accent-brand bg-card md:-top-1.5 md:left-0"
              aria-hidden="true"
            ></span>

            @if (experience.period) {
              <p class="font-mono text-xs text-accent-brand tabular-nums">
                {{ experience.period }}
              </p>
            }

            <h3 class="mt-3 text-sm font-semibold text-foreground">{{ experience.role }}</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ experience.company }}
              @if (experience.type) {
                <span> · {{ experience.type }}</span>
              }
            </p>

            @if (experience.detail) {
              <p class="mt-4 text-xs leading-6 text-muted-foreground">{{ experience.detail }}</p>
            }
          </li>
        }
      </ol>
    }
  `,
})
export class Timeline implements OnInit {
  private readonly experienceService = inject(ExperienceSignalService);

  protected readonly state = computed(() => this.experienceService.getState());
  protected readonly experiences = computed<ExperienceView[]>(() =>
    [...this.state().content]
      .sort((left, right) => {
        const leftTime = Date.parse(left.startedAt);
        const rightTime = Date.parse(right.startedAt);

        if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
          return 0;
        }

        if (Number.isNaN(leftTime)) {
          return 1;
        }

        if (Number.isNaN(rightTime)) {
          return -1;
        }

        return rightTime - leftTime;
      })
      .slice(0, 3)
      .map((experience) => ({
        id: experience.id,
        period: formatPeriod(experience.startedAt, experience.finishedAt),
        role: experience.role,
        company: experience.company,
        type: experience.type,
        detail: experience.responsibility || experience.description,
      })),
  );

  ngOnInit(): void {
    void this.load();
  }

  protected load(): Promise<void> {
    return getContent<ExperienceTimeline>(
      'v1/experience?includeProjects=false',
      this.experienceService,
    );
  }
}

function formatPeriod(startedAt: string, finishedAt?: string | null): string {
  const start = parseYear(startedAt);
  if (!start) {
    return '';
  }

  const end = parseYear(finishedAt);
  return `${start} — ${end ?? 'Present'}`;
}

function parseYear(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : String(date.getFullYear());
}

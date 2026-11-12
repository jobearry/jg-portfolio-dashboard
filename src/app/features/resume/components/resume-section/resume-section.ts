import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Titled résumé panel with an accent rule and optional icon/actions slots.
 *
 * The heading id is derived from the section id so anchor links and
 * `aria-labelledby` stay in sync.
 */
@Component({
  selector: 'app-resume-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      [id]="sectionId()"
      [attr.aria-labelledby]="headingId()"
      class="scroll-mt-24 rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6"
    >
      <div class="mb-6 flex items-center gap-3">
        <span class="flex shrink-0 text-muted-foreground" aria-hidden="true">
          <ng-content select="[section-icon]" />
        </span>
        <h2 [id]="headingId()" class="text-base font-semibold tracking-tight">{{ title() }}</h2>
        <span class="h-px flex-1 bg-border" aria-hidden="true"></span>
        <ng-content select="[section-actions]" />
      </div>

      <ng-content />
    </section>
  `,
})
export class ResumeSection {
  readonly sectionId = input.required<string>();
  readonly title = input.required<string>();

  protected readonly headingId = computed(() => `${this.sectionId()}-heading`);
}

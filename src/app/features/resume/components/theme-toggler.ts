import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { ThemeService } from '../../../core/theme/theme.service';

/**
 * Public-site theme toggle. Delegates to the shared `ThemeService` so the
 * landing pages and the dashboard share one stored preference and one
 * `.dark` class on <html>.
 */
@Component({
  selector: 'app-theme-toggler',
  imports: [NgIcon],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      class="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent-brand hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      (click)="toggle()"
    >
      <ng-icon
        [name]="theme() === 'dark' ? 'lucideSun' : 'lucideMoon'"
        size="18"
        aria-hidden="true"
      />
    </button>
  `,
})
export class ThemeToggler {
  private readonly themeService = inject(ThemeService);

  protected readonly theme = this.themeService.theme;
  protected readonly label = computed(() =>
    this.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  );

  toggle(): void {
    this.themeService.toggle();
  }
}

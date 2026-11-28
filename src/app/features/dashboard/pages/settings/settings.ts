import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Theme, ThemeService } from '../../../../core/theme';
import { PageHeader } from '../../../../shared';

/** Appearance-only preferences; catalog administration lives in Toolbox. */
@Component({
  selector: 'app-settings',
  imports: [PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
})
export class Settings {
  private readonly themeService = inject(ThemeService);

  protected readonly theme = this.themeService.theme;

  protected setTheme(theme: Theme): void {
    this.themeService.set(theme);
  }
}

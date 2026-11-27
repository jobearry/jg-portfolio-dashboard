import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayoutDashboard, lucideX } from '@ng-icons/lucide';
import { AuthService } from '../../../../core/auth/auth.service';

/**
 * Dashboard gate for the public résumé pages. Clicking the icon asks for the
 * admin JWT, validates it against the API, then navigates into the dashboard.
 */
@Component({
  selector: 'app-dashboard-link',
  imports: [NgIcon],
  providers: [provideIcons({ lucideLayoutDashboard, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex', '(document:keydown.escape)': 'onEscape()' },
  templateUrl: './dashboard-link.html',
})
export class DashboardLink {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly tokenInput = viewChild<ElementRef<HTMLInputElement>>('tokenInput');

  protected readonly dialogOpen = signal(false);
  protected readonly token = signal('');
  protected readonly busy = signal(false);
  protected readonly authError = this.auth.error;

  protected open(): void {
    this.auth.clearError();
    this.token.set('');
    this.dialogOpen.set(true);
    queueMicrotask(() => this.tokenInput()?.nativeElement.focus());
  }

  protected cancel(): void {
    if (!this.dialogOpen()) {
      return;
    }

    this.dialogOpen.set(false);
    queueMicrotask(() => this.trigger().nativeElement.focus());
  }

  protected onEscape(): void {
    this.cancel();
  }

  protected onInput(event: Event): void {
    this.token.set((event.target as HTMLInputElement).value);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    const unlocked = await this.auth.verify(this.token());
    this.busy.set(false);

    if (unlocked) {
      this.dialogOpen.set(false);
      this.token.set('');
      await this.router.navigate(['/dashboard']);
    }
  }
}

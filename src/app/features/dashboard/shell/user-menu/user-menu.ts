import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload, lucideLogOut, lucideMoon, lucideSun, lucideUser } from '@ng-icons/lucide';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { site } from '../../../../core/config/site.config';
import { ThemeService } from '../../../../core/theme/theme.service';
import { ShellStateService } from '../shell-state.service';

@Component({
  selector: 'app-user-menu',
  imports: [NgIcon, RouterLink],
  providers: [provideIcons({ lucideDownload, lucideLogOut, lucideMoon, lucideSun, lucideUser })],
  host: {
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(document:keydown.escape)': 'onDocumentEscape()',
  },
  template: `
    <div class="relative">
      <button
        #trigger
        type="button"
        class="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        [class.justify-center]="rail()"
        [attr.aria-label]="'Account menu for ' + site.profile.name"
        aria-haspopup="menu"
        aria-controls="user-menu-panel"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
        (keydown.arrowdown)="onTriggerArrowDown($event)"
      >
        <img
          class="h-10 w-10 shrink-0 rounded-full object-cover"
          [src]="site.assets.sidebarAvatar"
          alt=""
        />
        @if (!rail()) {
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold">{{ site.profile.name }}</span>
            <span class="block truncate text-xs text-sidebar-foreground/70">
              {{ site.profile.role }}
            </span>
          </span>
        }
      </button>

      @if (open()) {
        <div
          #menu
          id="user-menu-panel"
          role="menu"
          aria-label="Account"
          class="absolute top-full left-0 z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          (keydown)="onMenuKeydown($event)"
        >
          <a
            routerLink="/"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
            (click)="navigateToProfile()"
          >
            <ng-icon name="lucideUser" size="16" />
            View profile
          </a>

          <a
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
            [href]="site.links.cv"
            target="_blank"
            rel="noopener noreferrer"
            (click)="close()"
          >
            <ng-icon name="lucideDownload" size="16" />
            Download CV
          </a>

          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
            [attr.aria-label]="themeLabel()"
            (click)="toggleTheme()"
          >
            <ng-icon [name]="themeIcon()" size="16" />
            {{ themeLabel() }}
          </button>

          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
            (click)="lockDashboard()"
          >
            <ng-icon name="lucideLogOut" size="16" />
            Lock dashboard
          </button>
        </div>
      }
    </div>
  `,
})
export class UserMenu {
  protected readonly site = site;
  protected readonly theme = inject(ThemeService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly shell = inject(ShellStateService);
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  protected readonly open = signal(false);
  protected readonly rail = computed(() => this.shell.isDesktop() && this.shell.collapsed());
  protected readonly themeIcon = computed(() =>
    this.theme.theme() === 'dark' ? 'lucideSun' : 'lucideMoon',
  );
  protected readonly themeLabel = computed(() =>
    this.theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
  );

  protected toggle(): void {
    if (this.open()) {
      this.close(true);
    } else {
      this.show(false);
    }
  }

  protected close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    if (restoreFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  protected toggleTheme(): void {
    this.theme.toggle();
    this.close(true);
  }

  protected navigateToProfile(): void {
    this.close();
    this.shell.closeMobile();
  }

  protected lockDashboard(): void {
    this.auth.clear();
    this.close();
    this.shell.closeMobile();
    void this.router.navigate(['/']);
  }

  protected onTriggerArrowDown(event: Event): void {
    event.preventDefault();
    this.show(true);
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.open()) {
      return;
    }

    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  protected onDocumentEscape(): void {
    this.close(true);
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.items();
    if (items.length === 0) {
      return;
    }

    const current = items.indexOf(
      this.host.nativeElement.ownerDocument.activeElement as HTMLElement,
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[(current + 1) % items.length].focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        items[(current - 1 + items.length) % items.length].focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0].focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1].focus();
        break;
      case 'Escape':
        event.stopPropagation();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private show(focusFirst: boolean): void {
    this.open.set(true);

    if (focusFirst) {
      queueMicrotask(() => this.items()[0]?.focus());
    }
  }

  private items(): HTMLElement[] {
    const menu = this.menu()?.nativeElement;
    return menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')) : [];
  }
}

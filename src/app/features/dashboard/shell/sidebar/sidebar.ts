import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePanelLeftClose, lucidePanelLeftOpen, lucideX } from '@ng-icons/lucide';
import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  SIDEBAR_ICONS,
  resumeProfileLink,
  settingsLink,
  sidebarContent,
} from '../../../../core/constants/sidebar-sections';
import { ShellStateService } from '../shell-state.service';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  selector: 'app-shell-sidebar',
  imports: [NgIcon, RouterLink, RouterLinkActive, UserMenu],
  providers: [
    provideIcons({ ...SIDEBAR_ICONS, lucidePanelLeftClose, lucidePanelLeftOpen, lucideX }),
  ],
  template: `
    <aside
      id="shell-sidebar"
      class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[transform,visibility,width] duration-200 ease-linear motion-reduce:transition-none md:z-30 md:w-(--shell-sidebar-width) md:translate-x-0"
      [class.invisible]="!state.sidebarVisible()"
      [class.-translate-x-full]="!state.sidebarVisible()"
      aria-label="Sidebar"
    >
      <div class="flex items-start gap-2 border-b border-sidebar-border p-2">
        <div class="min-w-0 flex-1">
          <app-user-menu />
        </div>

        <button
          #closeButton
          type="button"
          class="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring md:hidden"
          aria-label="Close navigation"
          (click)="closeMobile()"
        >
          <ng-icon name="lucideX" size="18" />
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        <ul class="grid gap-1">
          @for (item of sections; track item.url) {
            <li>
              <a
                [routerLink]="item.url"
                routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
                [routerLinkActiveOptions]="{ exact: true }"
                ariaCurrentWhenActive="page"
                class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                [class.justify-center]="!state.showLabels()"
                (click)="closeMobile()"
              >
                <ng-icon [name]="item.icon" size="18" />
                @if (state.showLabels()) {
                  <span>{{ item.title }}</span>
                } @else {
                  <span class="sr-only">{{ item.title }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <nav class="px-2 pb-1" aria-label="Utilities">
        <a
          [routerLink]="settingsLink.url"
          routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          [class.justify-center]="!state.showLabels()"
          (click)="closeMobile()"
        >
          <ng-icon [name]="settingsLink.icon" size="18" />
          @if (state.showLabels()) {
            <span>{{ settingsLink.title }}</span>
          } @else {
            <span class="sr-only">{{ settingsLink.title }}</span>
          }
        </a>
      </nav>

      <div class="border-t border-sidebar-border p-2">
        <button
          type="button"
          class="hidden w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring md:flex"
          [class.justify-center]="!state.showLabels()"
          [attr.aria-label]="state.collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.aria-expanded]="!state.collapsed()"
          aria-controls="shell-sidebar"
          (click)="state.toggleCollapsed()"
        >
          <ng-icon
            [name]="state.collapsed() ? 'lucidePanelLeftOpen' : 'lucidePanelLeftClose'"
            size="18"
          />
          @if (state.showLabels()) {
            <span>Collapse</span>
          }
        </button>
      </div>
    </aside>
  `,
})
export class ShellSidebar {
  protected readonly state = inject(ShellStateService);
  protected readonly sections = sidebarContent;
  protected readonly profileLink = resumeProfileLink;
  protected readonly settingsLink = settingsLink;

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  constructor() {
    effect(() => {
      if (this.state.mobileOpen() && !this.state.isDesktop()) {
        // Wait for the panel's visibility class to be applied before focusing.
        const schedule =
          typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (callback: FrameRequestCallback) => setTimeout(callback, 0);
        schedule(() => this.closeButton()?.nativeElement.focus());
      }
    });
  }

  protected closeMobile(): void {
    this.state.closeMobile(true);
  }
}

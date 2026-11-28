import {
  lucideChartGantt,
  lucideLayoutDashboard,
  lucideRss,
  lucideSettings,
  lucideUser,
} from '@ng-icons/lucide';

export interface SidebarGroupMenu {
  title: string;
  url: string;
  icon: string;
}

export const SIDEBAR_ICONS: Record<string, string> = {
  lucideRss,
  lucideLayoutDashboard,
  lucideChartGantt,
  lucideSettings,
  lucideUser,
};

export const sidebarContent: SidebarGroupMenu[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'lucideLayoutDashboard',
  },
  {
    title: 'Timeline',
    url: '/timeline',
    icon: 'lucideChartGantt',
  },
  {
    title: 'Blog',
    url: '/blog',
    icon: 'lucideRss',
  },
];

/**
 * Sidebar link to the résumé profile outside the dashboard shell.
 *
 * Deliberately outside `sidebarContent`: the résumé renders outside the shell,
 * so this link cannot match an active dashboard destination.
 */
export const resumeProfileLink: SidebarGroupMenu = {
  title: 'Profile',
  url: '/',
  icon: 'lucideUser',
};

/**
 * Dashboard utility link. Kept outside the primary nav and rendered directly
 * above the footer collapse control.
 */
export const settingsLink: SidebarGroupMenu = {
  title: 'Settings',
  url: '/dashboard/settings',
  icon: 'lucideSettings',
};

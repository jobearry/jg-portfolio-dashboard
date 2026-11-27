import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { site } from './core/config/site.config';

const page = (label: string) => ({
  title: `${label} | ${site.profile.name}`,
  data: { pageTitle: label },
});

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/resume/pages/home/ui/home').then((m) => m.Home),
    title: `${site.profile.name} | ${site.profile.role}`,
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/resume/pages/projects/ui/projects').then((m) => m.Projects),
    ...page('Projects'),
  },
  {
    path: 'profile',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: '',
    loadComponent: () => import('./features/dashboard/shell/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
    title: `Dashboard | ${site.profile.name}`,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/overview/overview').then((m) => m.Overview),
        ...page('Dashboard'),
      },
      {
        path: 'timeline',
        loadComponent: () =>
          import('./features/dashboard/pages/timeline/timeline').then((m) => m.Timeline),
        ...page('Timeline'),
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/dashboard/pages/blog/blog').then((m) => m.Blog),
        ...page('Blog'),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];

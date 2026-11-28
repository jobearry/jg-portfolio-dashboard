import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    provideAppInitializer(() => {
      inject(ThemeService);
      // The router positions fragment targets itself, so `scroll-margin` on the
      // sections has no effect; a small scroll offset keeps jumps off the edge.
      inject(ViewportScroller).setOffset([0, 16]);
    }),
  ],
};

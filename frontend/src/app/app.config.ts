import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router'; // <-- Router import KELL
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './credentials.interceptor';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideRouter(routes),
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    { provide: Sentry.TraceService, deps: [Router] },
    provideAppInitializer(() => { inject(Sentry.TraceService); }),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
  ],
};
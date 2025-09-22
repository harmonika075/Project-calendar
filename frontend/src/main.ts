import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: 'https://8686e0359c8e28c42ec233c70ece1609@o4509960949006336.ingest.de.sentry.io/4509960963555408',
  environment: 'development',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
});

bootstrapApplication(AppComponent, appConfig).catch(console.error);
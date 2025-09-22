import 'dotenv/config';         // <-- EZ fontos, hogy a .env bekerüljön a process.env-be
import * as Sentry from '@sentry/nestjs';

// Fontos: ez fusson le MINDEN más import/elindítás előtt!
Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  environment: process.env.SENTRY_ENV || 'development',
  tracesSampleRate: Number(process.env.SENTRY_TRACES ?? 0.2),
});
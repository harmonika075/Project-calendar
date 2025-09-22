import { Controller, Get } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Controller()
export class DebugController {
  @Get('debug-sentry')
  triggerError() {
    // Ez kivételt dob -> 500 válasz -> Sentry-be is bekerül
    throw new Error('My first Sentry backend error!');
  }

  @Get('debug-capture')
  captureManually() {
    // Kézi események, akkor is működik, ha a globális filter még nincs beállítva
    Sentry.captureMessage('Manual test message (backend)');
    Sentry.captureException(new Error('Manual test exception (backend)'));
    return { ok: true };
  }
}
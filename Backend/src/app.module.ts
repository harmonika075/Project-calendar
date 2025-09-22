import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PeopleModule } from './people/people.module';
import { AvailabilityModule } from './availability/availability.module';
import { TasksModule } from './tasks/tasks.module';

// Controllers
import { HealthController } from './health.controller';
import { DebugController } from './debug.controller';

// Sentry
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
    PrismaModule,
    AuthModule,
    PeopleModule,
    AvailabilityModule,
    TasksModule,
    // ⚠️ IDE NEM kerülhet controller! (HealthController innen ki)
  ],
  controllers: [
    DebugController,
    HealthController, // ✅ controllerként itt a helye
  ],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}

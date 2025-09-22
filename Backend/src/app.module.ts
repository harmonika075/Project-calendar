import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PeopleModule } from './people/people.module';
import { AvailabilityModule } from './availability/availability.module';
import { TasksModule } from './tasks/tasks.module';

// +++ Sentry
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
// ---

// +++ ha a debug kontrollert is betesszük (lásd alább)
import { DebugController } from './debug.controller';
// ---

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(), // <— Sentry Nest modul
    PrismaModule,
    AuthModule,
    PeopleModule,
    AvailabilityModule,
    TasksModule,
  ],
  controllers: [DebugController], // <— opcionális, csak a teszt route miatt
  providers: [
    // Ha nincs saját, globális exception filtered,
    // add hozzá a Sentry gyári globális filterét:
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
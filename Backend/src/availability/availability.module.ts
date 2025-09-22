import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AuthModule } from '../auth/auth.module'; // <-- ÚJ

@Module({
  imports: [PrismaModule, AuthModule], // <-- AuthModule be
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}
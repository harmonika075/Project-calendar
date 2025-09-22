import { Module } from '@nestjs/common';
import { PeopleService } from './people.service.js';
import { PeopleController } from './people.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [PeopleController],
  providers: [PeopleService],
})
export class PeopleModule {}

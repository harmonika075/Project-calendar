import { Body, Controller, Get, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { PeopleService } from './people.service.js';
import { CreatePersonDto, UpdatePersonDto } from './dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('people')
export class PeopleController {
  constructor(private service: PeopleService) {}
  @Get() list() { return this.service.list(); }
  @Post() create(@Body() body: CreatePersonDto) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: UpdatePersonDto) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}

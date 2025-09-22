import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string, @Query('personId') personId?: string) {
    return this.service.list(from, to, personId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() b: { title: string; startDate: string; endDate: string; colorHex?: string | null }) {
    return this.service.create(b);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() b: Partial<{ title: string; startDate: string; endDate: string; colorHex: string | null }>) {
    return this.service.update(id, b);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/assignees')
  addAssignee(@Param('id') id: string, @Body() b: { personId: string }) {
    return this.service.addAssignee(id, b.personId);
  }

  @Delete(':id/assignees/:personId')
  removeAssignee(@Param('id') id: string, @Param('personId') personId: string) {
    return this.service.removeAssignee(id, personId);
  }
}

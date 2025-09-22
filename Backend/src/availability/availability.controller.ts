import { Controller, Get, Post, Delete, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private service: AvailabilityService) {}

  // GET /availability/days?personId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
  @Get('days')
  listDays(@Query('personId') personId: string, @Query('from') fromISO: string, @Query('to') toISO: string) {
    return this.service.listDays(personId, fromISO, toISO);
  }

  // POST /availability/days/bulk
  // { personId, type: 'OFF'|'ONLINE', startDate, endDate }
  @Post('days/bulk')
  setDaysBulk(@Body() b: { personId: string; type: 'OFF'|'ONLINE'; startDate: string; endDate: string }) {
    return this.service.setDaysBulk(b.personId, b.type, b.startDate, b.endDate);
  }

  // DELETE /availability/days?personId=...&start=...&end=...
  @Delete('days')
  clearDays(@Query('personId') personId: string, @Query('start') startISO: string, @Query('end') endISO: string) {
    return this.service.clearDays(personId, startISO, endISO);
  }

  // GET /availability/workweek?personId=...
  @Get('workweek')
  getWorkweek(@Query('personId') personId: string) {
    return this.service.getWorkweek(personId);
  }

  // PATCH /availability/workweek  { personId, workdaysMask }
  @Patch('workweek')
  setWorkweek(@Body() b: { personId: string; workdaysMask: number }) {
    return this.service.setWorkweek(b.personId, b.workdaysMask);
  }
}

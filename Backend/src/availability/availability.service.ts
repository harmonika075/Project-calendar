import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function normalizeDateISO(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  // --- Day statuses (OFF / ONLINE) ---

  async listDays(personId: string, fromISO: string, toISO: string) {
    if (!personId) throw new BadRequestException('personId required');
    const from = normalizeDateISO(fromISO);
    const to   = normalizeDateISO(toISO);

    return this.prisma.availabilityDay.findMany({
      where: { personId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
      select: { date: true, type: true },
    });
  }

  async setDaysBulk(personId: string, type: 'OFF'|'ONLINE', startISO: string, endISO: string) {
    if (!personId || !type) throw new BadRequestException('personId and type required');
    const start = normalizeDateISO(startISO);
    const end   = normalizeDateISO(endISO);
    if (end < start) throw new BadRequestException('end before start');

    const data: { personId: string; date: Date; type: 'OFF'|'ONLINE' }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      data.push({ personId, date: new Date(d), type });
    }

    // upsert: töröljük az érintett napokat, majd berakjuk egyben
    await this.prisma.availabilityDay.deleteMany({
      where: { personId, date: { gte: start, lte: end } },
    });
    if (data.length) {
      await this.prisma.availabilityDay.createMany({ data });
    }
    return { ok: true, count: data.length };
  }

  async clearDays(personId: string, startISO: string, endISO: string) {
    if (!personId) throw new BadRequestException('personId required');
    const start = normalizeDateISO(startISO);
    const end   = normalizeDateISO(endISO);
    const res = await this.prisma.availabilityDay.deleteMany({
      where: { personId, date: { gte: start, lte: end } },
    });
    return { ok: true, deleted: res.count };
  }

  // --- Person workweek prefs ---

  async getWorkweek(personId: string) {
    if (!personId) throw new BadRequestException('personId required');
    const prefs = await this.prisma.personPrefs.findUnique({ where: { personId } });
    return { personId, workdaysMask: prefs?.workdaysMask ?? 62 }; // default Mon–Fri
  }

  async setWorkweek(personId: string, workdaysMask: number) {
    if (!personId) throw new BadRequestException('personId required');
    // 7 bit: 0=Sun .. 6=Sat
    if (workdaysMask < 0 || workdaysMask > 127) throw new BadRequestException('Invalid mask');
    const res = await this.prisma.personPrefs.upsert({
      where: { personId },
      create: { personId, workdaysMask },
      update: { workdaysMask },
    });
    return { personId: res.personId, workdaysMask: res.workdaysMask };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  list(from?: string, to?: string, personId?: string) {
    const where: any = {};
    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from);
      if (to)   where.startDate.lte = new Date(to);
    }
    if (personId) {
      where.assignments = { some: { personId } };
    }
    return this.prisma.task.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { assignments: { include: { person: true } } },
    });
  }

  get(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignments: { include: { person: true } } },
    });
  }

  create(data: { title: string; startDate: string; endDate: string; colorHex?: string | null }) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        colorHex: data.colorHex ?? null,
      },
    });
  }

  update(id: string, data: Partial<{ title: string; startDate: string; endDate: string; colorHex: string | null }>) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
        ...(data.colorHex !== undefined ? { colorHex: data.colorHex } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  addAssignee(taskId: string, personId: string) {
    return this.prisma.taskAssignment.create({ data: { taskId, personId } });
  }

  removeAssignee(taskId: string, personId: string) {
    return this.prisma.taskAssignment.delete({
      where: { taskId_personId: { taskId, personId } },
    });
  }
}

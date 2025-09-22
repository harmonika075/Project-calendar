import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePersonDto, UpdatePersonDto } from './dto.js';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.person.findMany({ orderBy: { createdAt: 'desc' } }); }
  create(dto: CreatePersonDto) { return this.prisma.person.create({ data: dto }); }
  update(id: string, dto: UpdatePersonDto) { return this.prisma.person.update({ where: { id }, data: dto }); }
  remove(id: string) {
    return this.prisma.person.delete({ where: { id } });
  }
}

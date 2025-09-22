import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req?.cookies?.access_token;
    const payload = this.auth.verifyTokenOrThrow(token); // 401 ha nincs/rossz
    const u = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { isAdmin: true },
    });
    if (!u) throw new UnauthorizedException();
    if (!u.isAdmin) throw new ForbiddenException('Admin only');
    return true;
  }
}

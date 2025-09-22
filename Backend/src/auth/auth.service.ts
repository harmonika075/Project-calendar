import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcryptjs';
import * as argon2 from 'argon2'; // csak visszafelé kompatibilitás miatt (régi hash-ekhez)
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Seedeljük az admin usert, ha még nem létezik.
   * INNENTŐL bcrypt-et használunk a jelszóhoz.
   */
  async seedInitialUser() {
    const email = 'admin@example.com';
    const emailLc = email.toLowerCase();

    const exists = await this.prisma.user.findUnique({ where: { email: emailLc } });
    if (!exists) {
      const passwordHash = await bcrypt.hash('admin12345', 10);
      await this.prisma.user.create({ data: { email: emailLc, passwordHash, isAdmin: true } });
      return { email: emailLc, password: 'admin12345' };
    }
    return null;
  }

  /**
   * Bejelentkezés:
   * 1) email-t kisbetűsítjük
   * 2) jelszó-ellenőrzés: először bcrypt.compare
   *    - ha nem jó, és a hash argon2-nek tűnik, megpróbáljuk argon2.verify-t (backward compat)
   * 3) ha argon2-vel sikerült, a hash-t azonnal átírjuk bcrypt-re (progresszív migráció)
   */
  async login(email: string, password: string) {
    const emailLc = (email || '').toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: emailLc } });
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hash = user.passwordHash || '';
    let ok = false;

    // Első kör: bcrypt
    try {
      ok = await bcrypt.compare(password, hash);
    } catch {
      ok = false;
    }

    // Ha nem ok és argon2 hash-nek néz ki, próbáljuk az argon2.verify-t
    if (!ok && hash.startsWith('$argon2')) {
      try {
        ok = await argon2.verify(hash, password);
        // Ha sikerült argon2-vel, migráljuk át bcrypt-re
        if (ok) {
          const newHash = await bcrypt.hash(password, 10);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
        }
      } catch {
        ok = false;
      }
    }

    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const secret = this.config.get<string>('JWT_SECRET') || 'dev-secret';
    const token = await this.jwt.signAsync(payload, { secret, expiresIn: '7d' });
    return { token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }

  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException("You can't delete your own account.");
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  verifyTokenOrThrow(token?: string) {
    if (!token) throw new UnauthorizedException();
    const secret = this.config.get<string>('JWT_SECRET') || 'dev-secret';
    try {
      return this.jwt.verify(token, { secret }) as { sub: string; email: string };
    } catch {
      throw new UnauthorizedException();
    }
    
  }

  /**
   * Új felhasználó létrehozása — bcrypt hash-el
   */
  async createUser(email: string, password: string) {
    const emailLc = (email || '').toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.user.create({
        data: { email: emailLc, passwordHash },
        select: { id: true, email: true, createdAt: true },
      });
    } catch (e: any) {
      throw new BadRequestException('Email already exists');
    }
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Delete,
  Param,
  Req,
  Res,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ➊ Admin seed – egyszer használatos, SEED_TOKEN headerrel védve
  @Post('seed')
  async seed(@Headers('x-seed-token') seedToken?: string) {
    const expected = process.env.SEED_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('SEED_TOKEN is not set');
    }
    if (seedToken !== expected) {
      throw new UnauthorizedException();
    }
    return this.auth.seedInitialUser();
  }

  // ➋ Bejelentkezés: httpOnly süti cross-site front/back esetén -> SameSite:'none' + Secure
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.auth.login(body.email, body.password);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,       // Renderen HTTPS -> kötelező
      sameSite: 'none',   // külön domainű front/back esetén kötelező
      path: '/',          // fontos a későbbi törléshez is
      // domain: NE állítsd -> host-only cookie stabilabb
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 nap
    });

    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Ugyanazzal az attribútum-készlettel töröljük, mint ahogy beállítottuk
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      // domain: NE állítsd
    });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException();
    const { sub } = this.auth.verifyTokenOrThrow(token);
    return this.auth.me(sub);
  }

  // ------- Admin-only user management -------
  @UseGuards(AdminGuard)
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.auth.createUser(dto.email, dto.password);
  }

  @UseGuards(AdminGuard)
  @Get('users')
  listUsers() {
    return this.auth.listUsers();
  }

  @UseGuards(AdminGuard)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Req() req: Request) {
    const token = req.cookies?.['access_token'];
    const { sub } = this.auth.verifyTokenOrThrow(token);
    return this.auth.deleteUser(id, sub);
  }
}

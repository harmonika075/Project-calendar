// Backend/src/auth/auth.controller.ts
import {
  Controller, Post, Get, Body, UseGuards, Delete, Param, Req, Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(AdminGuard)
  @Post('seed')
  async seed() {
    return this.auth.seedInitialUser();
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.auth.login(body.email, body.password);

    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,           // Renderen HTTPS megy → legyen secure
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
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

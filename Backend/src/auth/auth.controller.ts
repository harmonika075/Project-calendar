import { Controller, Post, Get, Body, UseGuards, Delete, Param, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Admin seed – ha már van admin, érdemes később kikapcsolni vagy admin mögé tenni
  @UseGuards(AdminGuard)
  @Post('seed')
  async seed() {
    return this.auth.seedInitialUser();
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const { token } = await this.auth.login(body.email, body.password);
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax', // fejlesztéshez
      // secure: true // majd PROD + HTTPS esetén
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const token = req?.cookies?.access_token;
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
  deleteUser(@Param('id') id: string, @Req() req: any) {
    const token = req?.cookies?.access_token;
    const { sub } = this.auth.verifyTokenOrThrow(token);
    return this.auth.deleteUser(id, sub);
  }
}

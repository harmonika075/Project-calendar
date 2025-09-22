import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException();
    const payload = this.auth.verifyTokenOrThrow(token);
    (req as any).user = payload;
    return true;
  }
}

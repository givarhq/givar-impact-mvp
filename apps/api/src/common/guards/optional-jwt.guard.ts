import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    // 1. If User is successfully validated, return them.
    if (user) {
      return user;
    }

    // 2. Check if an Authorization header was actually sent
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // 3. If a header exists but we have no user, the token was bad/expired.
    if (authHeader) {
      throw err || new UnauthorizedException(info?.message || 'Invalid token');
    }

    // 4. No header + No user = Guest. Allow access.
    return null;
  }
}
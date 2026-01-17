import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    // If token exists but is invalid/expired (err or !user), fail hard.
    // The 'info' object typically contains the error reason from Passport (e.g. "jwt expired").
    if (err || (info && !user)) {
      throw err || new UnauthorizedException(info?.message || 'Invalid token');
    }
    
    // If user exists (valid token), return it.
    if (user) {
      return user;
    }
    
    // Only if NO token was sent do we return null (Guest mode)
    return null;
  }
}
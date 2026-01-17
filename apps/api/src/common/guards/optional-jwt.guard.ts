import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // If there is a user (valid token), return it.
    if (user) {
      return user;
    }
    // If there's an error (invalid token) or no user (no token),
    // we return null instead of throwing an exception.
    // This effectively allows the request to proceed as "Anonymous".
    return null; 
  }
}
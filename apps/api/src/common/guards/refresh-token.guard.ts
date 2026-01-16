import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  constructor() {
    super();
  }
  
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.get('Authorization')?.replace('Bearer', '').trim();
    
    if (user) {
        user.refreshToken = token;
    }
    
    return super.handleRequest(err, user, info, context);
  }
}
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReadOnlyGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private config: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. Skip check for safe methods or specific exemption endpoints immediately
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        const isStopImpersonation = request.url.includes('/impersonate/stop');

        if (safeMethods.includes(request.method) || isStopImpersonation) return true;

        // 2. Extract Token 
        let isImpersonating = request.user?.isImpersonating;

        if (isImpersonating === undefined) {
            let token = null;

            // Extract from raw cookies
            if (request.headers.cookie) {
                const match = request.headers.cookie.match(/(?:^|;\s*)givar_token=([^;]*)/);
                if (match) token = match[1];
            }

            // Fallback to Header
            if (!token && request.headers.authorization?.startsWith('Bearer ')) {
                token = request.headers.authorization.split(' ')[1];
            }

            if (token) {
                try {
                    const payload = this.jwtService.verify(token, {
                        secret: this.config.get('JWT_SECRET'),
                    });
                    isImpersonating = payload.isImpersonating;
                } catch (e) {
                    return true;
                }
            }
        }

        // 3. The "Steel Gate": Block mutations for impersonated sessions
        if (isImpersonating === true) {
            throw new ForbiddenException({
                error: 'READ_ONLY_MODE_ACTIVE',
                message: 'Mutations are strictly prohibited during forensic support sessions.',
                statusCode: 403
            });
        }

        return true;
    }
}
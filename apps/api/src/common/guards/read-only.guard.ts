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

        // 1. Skip check for safe methods immediately
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (safeMethods.includes(request.method)) return true;

        // 2. Extract Token (Fallback if AuthGuard hasn't run yet)
        let isImpersonating = request.user?.isImpersonating;

        if (isImpersonating === undefined) {
            const authHeader = request.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const payload = this.jwtService.verify(token, {
                        secret: this.config.get('JWT_SECRET'),
                    });
                    isImpersonating = payload.isImpersonating;
                } catch (e) {
                    // If token is invalid, let the standard AuthGuard handle the 401 later
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
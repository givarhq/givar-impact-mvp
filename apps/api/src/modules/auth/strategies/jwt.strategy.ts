import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          // 1. Try to extract HttpOnly token from raw cookies first
          if (req?.headers?.cookie) {
            const match = req.headers.cookie.match(/(?:^|;\s*)givar_token=([^;]*)/);
            if (match) token = match[1];
          }
          // 2. Fallback to Authorization Header (Used exclusively by Next.js Server Components)
          if (!token && req?.headers?.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
          }
          return token;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      isImpersonating: payload.isImpersonating || false,
      adminId: payload.adminId || null
    };
  }
}
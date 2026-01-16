import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
import { AuditAction, UserRole } from '@givar/database';
import { add } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto, req?: Request) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          currency: dto.defaultCurrency,
          balance: 0n,
        },
      });

      await this.audit.log({
        userId: user.id,
        action: AuditAction.USER_REGISTER,
        entityId: user.id,
        entityType: 'User',
        metadata: { email: user.email },
        req,
      }, tx);

      return user;
    });

    return {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
    };
  }

  async login(dto: LoginDto, req?: Request) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    
    // Account Lockout Check (Step 1)
    if (user && user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      await this.audit.log({
          action: AuditAction.USER_LOGIN_FAILED,
          userId: user.id,
          entityType: 'Session',
          metadata: { attemptedEmail: dto.email, reason: 'Account Locked' },
          req,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        // Progressive Delay & Lockout (Step 2)
        const newAttemptCount = user.failedLoginAttempts + 1;
        
        if (newAttemptCount >= 5) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttemptCount,
              accountLockedUntil: add(new Date(), { minutes: 15 }), // Lock for 15 mins
            },
          });
        } else {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: newAttemptCount },
          });
        }
        
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Reset attempts on successful login (Step 3)
      if (user.failedLoginAttempts > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          },
        });
      }

      const { accessToken, refreshToken } = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshTokenHash(user.id, refreshToken);

      await this.audit.log({
        userId: user.id,
        action: AuditAction.USER_LOGIN,
        entityId: user.id,
        entityType: 'Session',
        req,
      });

      return { accessToken, refreshToken };

    } catch (error) {
      let reason = 'An unknown error occurred';
      if (error instanceof UnauthorizedException) {
        reason = 'Bad Credentials';
      } else if (error instanceof Error) {
        reason = error.message;
      }
      // Note: We log the failure for both "user not found" and "bad password" here.
      // The "Account Locked" reason is logged separately above.
      await this.audit.log({
        action: AuditAction.USER_LOGIN_FAILED,
        userId: user?.id, // May be null if user not found
        entityType: 'Session',
        metadata: { 
            attemptedEmail: dto.email, 
            reason: reason
        },
        req,
      });

      throw error;
    }
  }

  async refreshToken(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access Denied');
    }

    const rtMatches = await bcrypt.compare(rt, user.refreshTokenHash);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const { accessToken, refreshToken } = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  private async getTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '15m', 
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(refreshToken, salt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
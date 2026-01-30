import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
import { AuditAction } from '@givar/database';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, req?: Request) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    
    const emailVerificationToken = randomUUID();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerificationToken,
          emailVerified: false,
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

    this.emailService.sendVerification(result.email, result.firstName, emailVerificationToken)
      .catch(err => this.logger.error(`Failed to send verification email: ${err}`));

    const payload = { sub: result.id, email: result.email, role: result.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
      },
      accessToken,
    };
  }

  async login(dto: LoginDto, req?: Request) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 1. Account Lockout Check
    if (user && user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      await this.audit.log({
          action: AuditAction.USER_LOGIN_FAILED,
          userId: user.id,
          entityType: 'Session',
          metadata: { attemptedEmail: dto.email, reason: 'Account Locked' },
          req,
      });
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    try {
      if (!user) throw new UnauthorizedException('Invalid credentials');

      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        // 2. Progressive Delay
        const newAttemptCount = user.failedLoginAttempts + 1;
        if (newAttemptCount >= 5) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttemptCount,
              accountLockedUntil: add(new Date(), { minutes: 15 }),
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
      
      // 3. Reset Lockout
      if (user.failedLoginAttempts > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          },
        });
      }

      this.emailService.sendLoginAlert(user.email, { 
        ip: req?.ip || 'unknown', 
        userAgent: req?.headers['user-agent'] 
      }).catch(err => this.logger.error(`Alert failed: ${err}`));

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      });

      await this.audit.log({
        userId: user.id,
        action: AuditAction.USER_LOGIN,
        entityId: user.id,
        entityType: 'Session',
        req,
      });

      // No refresh token returned or stored
      return { 
        accessToken, 
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        }
      };

    } catch (error) {
      let reason = 'An unknown error occurred';
      if (error instanceof UnauthorizedException) reason = 'Bad Credentials';
      else if (error instanceof Error) reason = error.message;
      
      await this.audit.log({
        action: AuditAction.USER_LOGIN_FAILED,
        userId: user?.id,
        entityType: 'Session',
        metadata: { attemptedEmail: dto.email, reason },
        req,
      });

      throw error;
    }
  }

  async logout(userId: string) {
    return { message: 'Logged out successfully.' };
  }
}
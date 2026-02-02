import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
import { AuditAction } from '@givar/database';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
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
  ) { }

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

      // Blocks unverified users from generating a session
      if (!user.emailVerified) {
        throw new ForbiddenException('EMAIL_NOT_VERIFIED');
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
      else if (error instanceof ForbiddenException) reason = error.message;
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
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto, req?: Request) {
    const { email } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return the same response to prevent email enumeration attacks
    if (!user) {
      this.logger.warn(`Password reset attempted for non-existent email: ${email}`);
      return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    // 1. Generate high-entropy token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash it for DB storage (standard SOTA practice)
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 3. Store in DB with 1-hour expiry
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: add(new Date(), { hours: 1 }),
      },
    });

    // 4. Send Email
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordReset(user.email, user.firstName, resetUrl);

    await this.audit.log({
      userId: user.id,
      action: AuditAction.RESET_REQUESTED,
      metadata: { action: 'RESET_REQUESTED' },
      req,
    });

    return { message: 'If an account exists with this email, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto, req?: Request) {
    // 1. Hash the incoming token to find the match
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { resetPasswordTokenHash: tokenHash },
    });

    // 2. Validate token and expiry
    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 4. ATOMIC Update: New password + Nuke tokens + Security cleanup
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordTokenHash: null,
          resetPasswordExpiresAt: null,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      });

      await this.audit.log({
        userId: user.id,
        action: AuditAction.RESET_SUCCESSFUL,
        metadata: { action: 'RESET_SUCCESSFUL' },
        req,
      }, tx);
    });

    // 5. Confirmation Email
    await this.emailService.sendPasswordChanged(user.email, user.firstName, new Date().toLocaleString());

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null, // Single-use
      },
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // Resend logic for users who lost their link
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Security: If user doesn't exist or is already verified, return generic success
    // to prevent email enumeration.
    if (!user || user.emailVerified) {
      return { message: 'If this email is unverified, a new link has been sent.' };
    }

    const newToken = randomUUID();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: newToken },
    });

    await this.emailService.sendVerification(user.email, user.firstName, newToken);

    return { message: 'If this email is unverified, a new link has been sent.' };
  }

  async switchToOrganizer(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { accountType: 'ORGANIZER' },
    });

    await this.audit.log({
      userId,
      action: AuditAction.ACCOUNT_TYPE_CHANGED,
      metadata: { newType: 'ORGANIZER' }
    });

    return {
      message: 'Account upgraded to Organizer mode',
      user: {
        id: user.id,
        accountType: user.accountType
      }
    };
  }

  async getFreshProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountType: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }
}
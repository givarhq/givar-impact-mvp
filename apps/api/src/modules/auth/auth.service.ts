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
import { generateSecret, verify, generateURI } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '../../common/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
import { AccountType, AuditAction, KycType, ProposalStatus, VerificationStatus } from '@givar/database';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
    private config: ConfigService,
    private emailService: EmailService,
    private storage: StorageService,
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
        metadata: {
          email: user.email,
          termsAccepted: true,
          legalVersion: '2026-03'
        },
        req,
      }, tx);

      return user;
    });

    this.emailService.sendVerification(result.email, result.firstName, emailVerificationToken)
      .catch(err => this.logger.error(`Failed to send verification email: ${err}`));

    const payload = { sub: result.id, email: result.email, role: result.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '48h',
    });

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        phoneNumber: result.phoneNumber,
        role: result.role,
        emailVerified: result.emailVerified,
        organization: null
      },
      accessToken,
    };
  }

  async login(dto: LoginDto, req?: Request) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true }
    });

    // 1. Account Lockout Check
    if (user && user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      await this.audit.log({
        action: AuditAction.USER_LOGIN_FAILED,
        userId: user.id,
        entityType: 'Session',
        metadata: { attemptedEmail: dto.email, reason: 'Account locked' },
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
              accountLockedUntil: add(new Date(), { hours: 24 }),
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

      // 3. 2FA Check & Recovery Code Support
      if (user.twoFactorEnabled) {
        if (!dto.twoFactorCode) {
          return { mfaRequired: true };
        }

        let is2FAValid = false;

        if (dto.twoFactorCode.length === 6) {
          const result = await verify({
            token: dto.twoFactorCode,
            secret: user.twoFactorSecret!,
          });
          is2FAValid = result.valid;
        } else if (dto.twoFactorCode.length === 8 && user.twoFactorRecoveryCodes?.length > 0) {
          for (let i = 0; i < user.twoFactorRecoveryCodes.length; i++) {
            const isRecoveryMatch = await bcrypt.compare(dto.twoFactorCode.toUpperCase(), user.twoFactorRecoveryCodes[i]);
            if (isRecoveryMatch) {
              is2FAValid = true;
              const newCodes = [...user.twoFactorRecoveryCodes];
              newCodes.splice(i, 1); // Consume the recovery code
              await this.prisma.user.update({
                where: { id: user.id },
                data: { twoFactorRecoveryCodes: newCodes }
              });
              await this.audit.log({
                userId: user.id,
                action: AuditAction.TWO_FACTOR_RECOVERY_USED,
                entityType: 'Session',
                req
              });
              break;
            }
          }
        }

        if (!is2FAValid) {
          await this.audit.log({
            userId: user.id,
            action: AuditAction.TWO_FACTOR_VERIFY_FAILED,
            entityType: 'Session',
            req
          });
          throw new UnauthorizedException('Invalid authentication code');
        }
      }

      // 4. Reset Lockout
      if (user.failedLoginAttempts > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          },
        });
      }

      const prefs = user.preferences as any;
      if (prefs?.securityAlerts !== false) {
        this.emailService.sendLoginAlert(user.email, {
          ip: req?.ip || 'unknown',
          userAgent: req?.headers['user-agent']
        }).catch(err => this.logger.error(`Alert failed: ${err}`));
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: '48h',
      });

      await this.audit.log({
        userId: user.id,
        action: AuditAction.USER_LOGIN,
        entityId: user.id,
        entityType: 'Session',
        req,
      });

      const isCaptiveAdmin = (user.role === 'ADMIN' || user.role === 'SUPERADMIN') && !user.twoFactorEnabled;

      return {
        accessToken,
        mfaSetupRequired: isCaptiveAdmin,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          accountType: user.accountType,
          emailVerified: user.emailVerified,
          organization: user.organization ? {
            status: user.organization.status,
            legalName: user.organization.legalName,
            kycType: user.organization.kycType
          } : null
        }
      };

    } catch (error) {
      let reason = 'An unknown error occurred';
      if (error instanceof UnauthorizedException) reason = 'Bad credentials';
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

    // Security: Generic response to prevent enumeration
    if (!user || user.emailVerified) {
      return { message: 'If this email is unverified, a verification code has been sent.' };
    }

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: code },
    });

    // Send the code via email
    await this.emailService.sendVerification(user.email, user.firstName, code);

    return { message: 'Verification code sent to your email.' };
  }

  async verifyEmailCode(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.emailVerificationToken !== code) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null, // Consume token (Single use)
      },
    });
  }

  async switchToCorporate(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { accountType: 'CORPORATE' },
    });

    await this.audit.log({
      userId,
      action: AuditAction.ACCOUNT_TYPE_CHANGED,
      metadata: { newType: 'CORPORATE' }
    });

    return {
      message: 'Account upgraded to Corporate mode',
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
        phoneNumber: true, // Added phone number mapping
        role: true,
        accountType: true,
        emailVerified: true,
        avatarKey: true,
        createdAt: true,
        twoFactorEnabled: true,
        preferences: true,
        organization: {
          select: {
            status: true,
            legalName: true,
            kycType: true,
          }
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    let avatarUrl = null;
    if (user.avatarKey) {
      const { viewUrl } = await this.storage.getPresignedViewUrl(user.avatarKey);
      avatarUrl = viewUrl;
    }

    return {
      ...user,
      avatarUrl,
      twoFactorEnabled: user.twoFactorEnabled
    };
  }

  async updateProfile(userId: string, dto: { firstName: string; lastName: string; phoneNumber?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    // Log distinct actions for phone number capture vs general profile update
    const action = dto.phoneNumber !== undefined ? 'USER_PHONE_UPDATED' : 'PROFILE_UPDATED';

    await this.audit.log({
      userId,
      action: action as any,
      entityId: userId,
      entityType: 'User',
      metadata: { updates: dto }
    });
    return user;
  }

  async updatePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Invalid current password');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await this.audit.log({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      entityId: userId,
      entityType: 'User'
    });
  }

  async updateAvatar(userId: string, avatarKey: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { avatarKey },
        select: { id: true, firstName: true, lastName: true, avatarKey: true }
      });

      await this.audit.log({
        userId,
        action: AuditAction.AVATAR_UPDATED,
        entityId: userId,
        entityType: 'User',
        metadata: { key: avatarKey }
      }, tx);

      return user;
    });
  }

  async deleteAccount(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { donations: true, projects: true } } }
    });

    if (!user) throw new NotFoundException('Account node not found');

    // 1. TOTP Verification
    const isValidStepUp = await this.verifyStepUpAuth(userId, totpCode);
    if (!isValidStepUp) throw new BadRequestException('Verification failed: Invalid authenticator code');

    // 2. Ledger Integrity Check
    if (user._count.projects > 0) {
      throw new BadRequestException('Node cannot be deleted: You have active or historical project records on the ledger.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 3. Log the deletion/anonymization before modification for forensic trace
      await this.audit.log({
        userId,
        action: AuditAction.ACCOUNT_DELETED,
        entityId: userId,
        entityType: 'User',
        metadata: { email: user.email, totalDonations: user._count.donations, anonymized: user._count.donations > 0, stepUpTotpUsed: true }
      }, tx);

      if (user._count.donations > 0) {
        // Anonymization Protocol: Scrub PII but keep ledger intact
        const randomHash = crypto.randomBytes(16).toString('hex');
        const scrubbedEmail = `deleted_${randomHash}@givar.local`;

        await tx.user.update({
          where: { id: userId },
          data: {
            email: scrubbedEmail,
            firstName: 'Anonymized',
            lastName: 'User',
            passwordHash: 'SCRUBBED',
            avatarKey: null,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorRecoveryCodes: [],
            preferences: {},
            accountLockedUntil: new Date('2099-12-31T23:59:59.000Z'), // Permanently locked
            emailVerified: false,
            emailVerificationToken: null,
            resetPasswordTokenHash: null,
          }
        });

        // Clean up any pending Organization KYC profiles connected to this user
        await tx.organizationProfile.deleteMany({ where: { userId } });

      } else {
        // Safe Physical Deletion: No ledger footprint
        await tx.organizationProfile.deleteMany({ where: { userId } });
        await tx.wallet.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      }

      return { success: true };
    }).then(async (result) => {
      // Best-effort S3 purge outside transaction to prevent rollback on network failure
      if (user.avatarKey) {
        this.storage.deleteFiles([user.avatarKey]).catch(err =>
          this.logger.error(`Avatar purge failed for deleted user: ${err.message}`)
        );
      }
      return result;
    });
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    // 1. Generate high-entropy secret
    const secret = generateSecret();
    // 2. Create standard OTP Auth URI
    const otpAuthUrl = generateURI({
      label: user.email,
      issuer: 'Givar',
      secret,
    });
    // 3. Save secret to user node (Pre-enable state)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
    // 4. Generate QR Code for frontend display
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
    await this.audit.log({
      userId,
      action: AuditAction.TWO_FACTOR_GEN_SECRET,
      entityId: userId,
      entityType: 'UserSecurity',
    });
    return {
      qrCodeDataUrl,
      secret, // Provided for manual entry fallback
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA initialization not found');
    }

    // 1. Verify the provided code against the stored secret
    const result = await verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    const isValid = result.valid;
    if (!isValid) {
      await this.audit.log({
        userId,
        action: AuditAction.TWO_FACTOR_VERIFY_FAILED,
        metadata: { reason: 'Initial activation failed' }
      });
      throw new BadRequestException('Invalid verification code');
    }

    // 2. Generate 8 One-Time Recovery Codes
    const rawCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
    const hashedCodes = await Promise.all(rawCodes.map(c => bcrypt.hash(c, 10)));

    // 3. Flip the activation flag and save the hashed codes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: hashedCodes
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.TWO_FACTOR_ENABLED,
      entityId: userId,
      entityType: 'UserSecurity',
    });

    return { success: true, recoveryCodes: rawCodes };
  }

  async disableTwoFactor(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    // Platform Integrity Check: Prevent Administrators from downgrading their security
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      throw new ForbiddenException('Platform policy mandates 2FA for administrative accounts. Disabling is prohibited.');
    }

    // 1. Critical Verification: Re-auth password before disabling security
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: []
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.TWO_FACTOR_DISABLED,
      entityId: userId,
      entityType: 'UserSecurity',
    });

    return { success: true };
  }

  async verifyStepUpAuth(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return false;

    // Check standard 6-digit TOTP PIN
    if (code.length === 6) {
      const result = await verify({ token: code, secret: user.twoFactorSecret });
      return result.valid;
    }

    // Check 8-character Backup Recovery Code
    if (code.length === 8 && user.twoFactorRecoveryCodes?.length > 0) {
      for (let i = 0; i < user.twoFactorRecoveryCodes.length; i++) {
        const isMatch = await bcrypt.compare(code.toUpperCase(), user.twoFactorRecoveryCodes[i]);
        if (isMatch) {
          const newCodes = [...user.twoFactorRecoveryCodes];
          newCodes.splice(i, 1);
          await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorRecoveryCodes: newCodes }
          });
          await this.audit.log({
            userId,
            action: AuditAction.TWO_FACTOR_RECOVERY_USED,
            entityType: 'UserSecurity'
          });
          return true;
        }
      }
    }

    return false;
  }

  async updatePreferences(userId: string, preferences: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferences },
      select: { preferences: true }
    });
  }

  async switchAccountType(userId: string, targetType: AccountType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { projects: true } },
        organization: true // Include the KYC profile to check for drift
      }
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.accountType === targetType) {
      return user; // No change
    }

    // Logic Guard: Cannot downgrade if you have active projects
    if (targetType === 'INDIVIDUAL' && user._count.projects > 0) {
      throw new BadRequestException('Cannot downgrade to Individual account while you have existing projects. Please suspend them first.');
    }

    let keysToPurge: string[] = [];

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update the User's core account mode
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { accountType: targetType },
      });

      // 2. COMPLIANCE GUARD: Invalidate existing KYC if it doesn't match the new account tier.
      // Notice how clean this is now: KycType and AccountType perfectly mirror each other.
      if (user.organization && user.organization.kycType !== targetType) {
        // Queue old documents for secure deletion
        keysToPurge = user.organization.documentKeys || [];

        await tx.organizationProfile.update({
          where: { userId },
          data: {
            kycType: targetType as unknown as KycType,
            status: VerificationStatus.NOT_SUBMITTED,
            adminFeedback: 'System Reset: Account type changed. Please submit documents matching your new account tier.',
            verifiedAt: null,
            documentKeys: [], // Sever access to old documents
          }
        });

        // 3. SECURITY FIX: Pull back any live proposals from the admin queue to prevent unverified approvals
        const affectedProposals = await tx.projectProposal.updateMany({
          where: {
            userId,
            status: { in: [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW, ProposalStatus.AWAITING_VERIFICATION] }
          },
          data: {
            status: ProposalStatus.DRAFT,
            adminFeedback: 'System Reset: Account type changed. KYC verification required before resubmission.'
          }
        });

        await this.audit.log({
          userId,
          action: AuditAction.PROFILE_UPDATED,
          entityId: user.organization.id,
          entityType: 'OrganizationProfile',
          metadata: {
            reason: 'ACCOUNT_TYPE_SWITCH',
            note: `KYC invalidated. ${affectedProposals.count} active proposals reverted to DRAFT.`
          }
        }, tx);
      }

      // 4. Log the actual account switch
      await this.audit.log({
        userId,
        action: AuditAction.ACCOUNT_TYPE_CHANGED,
        entityId: userId,
        entityType: 'User',
        metadata: {
          previous: user.accountType,
          new: targetType,
          reason: 'USER_INITIATED_SWITCH'
        }
      }, tx);

      return updatedUser;
    });

    // 5. Asynchronously purge the old identity documents from the S3 Vault to prevent data leaks
    if (keysToPurge.length > 0) {
      this.storage.deleteFiles(keysToPurge).catch(err =>
        this.logger.error(`Failed to purge old KYC docs after account switch: ${err.message}`)
      );
    }

    return updated;
  }

  async getMyAuditLogs(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: { userId },
        take: limit,
        skip,
        select: {
          id: true,
          action: true,
          ipAddress: true,
          createdAt: true,
          metadata: true,
          userAgent: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.auditLog.count({ where: { userId } })
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }
}

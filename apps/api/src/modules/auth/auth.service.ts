import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
import { AuditAction } from '@givar/database';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto, req?: Request) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Atomic Creation
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

      // Audit Registration (Inside transaction to ensure consistency)
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

  // Accept Request object for security auditing
  async login(dto: LoginDto, req?: Request) {
    try {
      // 1. Find User
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      
      // 2. Validate (Generic error message for security, but specific logging)
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 3. Generate Token
      const payload = { sub: user.id, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload);

      await this.audit.log({
        userId: user.id,
        action: AuditAction.USER_LOGIN,
        entityId: user.id,
        entityType: 'Session',
        req,
      });

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };

    } catch (error) {
      let reason = 'An unknown error occurred';
      if (error instanceof UnauthorizedException) {
        reason = 'Bad Credentials';
      } else if (error instanceof Error) {
        reason = error.message;
      }
      await this.audit.log({
        action: AuditAction.USER_LOGIN_FAILED,
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
}
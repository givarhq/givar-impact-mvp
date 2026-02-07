import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Patch, Post, Query, Req, UseGuards }
  from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, Verify2FADto } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';
import { type Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../common/decorators/public.decorator';
import { AccountType } from '@givar/database';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /* 
    RATE LIMITING
    Strict: 5 requests per minute
    Prevents bot account creation spam
  */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  create(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  /* 
    RATE LIMITING
    Strict: 5 requests per minute
    Prevents password brute-forcing
  */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any) {
    const userId = req.user.sub;
    return this.authService.logout(userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: any) {
    return this.authService.forgotPassword(dto, req);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any) {
    return this.authService.resetPassword(dto, req);
  }

  @Public()
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify-email/code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Req() req: any, @Body('code') code: string) {
    return this.authService.verifyEmailCode(req.user.id, code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('account-type/organizer')
  switchToOrganizer(@Req() req: any) {
    return this.authService.switchToOrganizer(req.user.id);
  }

  /**
   * Identity Heartbeat
   * Returns the latest database state for the authenticated user.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getFreshProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: { firstName: string; lastName: string }) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('security/password')
  async updatePassword(@Req() req: any, @Body() dto: any) {
    return this.authService.updatePassword(req.user.id, dto);
  }

  /**
   * Update User Avatar
   * Links a permanent S3 key to the user profile node.
   */
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile/avatar')
  async updateAvatar(@Req() req: any, @Body('key') key: string) {
    return this.authService.updateAvatar(req.user.id, key);
  }

  /**
   * Secure Account Deletion
   * Requires password verification and performs a ledger integrity check.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('profile/delete')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: any, @Body('password') password: string) {
    return this.authService.deleteAccount(req.user.id, password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/generate')
  async generate2FA(@Req() req: any) {
    return this.authService.generateTwoFactorSecret(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2FA(@Req() req: any, @Body() dto: Verify2FADto) {
    return this.authService.enableTwoFactor(req.user.id, dto.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2FA(@Req() req: any, @Body('password') password: string) {
    return this.authService.disableTwoFactor(req.user.id, password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('preferences')
  async updatePreferences(@Req() req: any, @Body() body: any) {
    return this.authService.updatePreferences(req.user.id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('account-type/switch')
  async switchAccountType(@Req() req: any, @Body('type') type: AccountType) {
    return this.authService.switchAccountType(req.user.id, type);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-audit-logs')
  async getMyAuditLogs(@Req() req: any, @Query('page') page?: string) {
    return this.authService.getMyAuditLogs(req.user.id, page ? Number(page) : 1);
  }
}
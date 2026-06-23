import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Patch, Post, Query, Req, Res, UseGuards }
  from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, Verify2FADto } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';
import { type Request, type Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../common/decorators/public.decorator';
import { AccountType } from '@givar/database';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setAuthCookies(res: Response, token: string) {
    res.cookie('givar_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 172800 * 1000, // 48 hours
      path: '/'
    });
  }

  private clearAuthCookies(res: Response) {
    res.cookie('givar_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async create(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto, req);
    this.setAuthCookies(res, result.accessToken);
    return result;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, req);
    if (result.mfaRequired) return result;

    this.setAuthCookies(res, result.accessToken);
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.id;
    this.clearAuthCookies(res);
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
  @Patch('account-type/corporate')
  switchToCorporate(@Req() req: any) {
    return this.authService.switchToCorporate(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getFreshProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: { firstName: string; lastName: string; phoneNumber?: string }) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('security/password')
  async updatePassword(@Req() req: any, @Body() dto: any) {
    return this.authService.updatePassword(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile/avatar')
  async updateAvatar(@Req() req: any, @Body('key') key: string) {
    return this.authService.updateAvatar(req.user.id, key);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/delete')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: any, @Body('totpCode') totpCode: string) {
    return this.authService.deleteAccount(req.user.id, totpCode);
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

  @Post('impersonate/stop')
  @HttpCode(HttpStatus.OK)
  stopImpersonation(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let backupToken = null;
    if (req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)givar_admin_backup_token=([^;]*)/);
      if (match) backupToken = match[1];
    }

    if (backupToken) {
      res.cookie('givar_token', backupToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 * 1000,
        path: '/'
      });
    } else {
      res.cookie('givar_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
    }

    res.cookie('givar_is_impersonating', '', { maxAge: 0, path: '/' });
    res.cookie('givar_admin_backup_token', '', { maxAge: 0, path: '/' });
    res.cookie('givar_admin_backup_user', '', { maxAge: 0, path: '/' });

    return { success: true, message: 'Impersonation session securely terminated.' };
  }
}
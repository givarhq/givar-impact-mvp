import { Body, Controller, ForbiddenException, HttpCode, HttpStatus, Post, Req, UseGuards } 
from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';
import { type Request } from 'express';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') rt: string, @Req() req: any) {
    if (!rt) throw new ForbiddenException('Refresh token required');
    return this.authService.refreshToken(rt, req);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any) {
    const userId = req.user.sub;
    return this.authService.logout(userId);
  }
}
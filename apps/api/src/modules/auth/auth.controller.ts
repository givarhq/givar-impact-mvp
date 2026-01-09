import { Body, Controller, HttpCode, HttpStatus, Post } 
from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';
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
  create(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /* 
    RATE LIMITING
    Strict: 5 requests per minute
    Prevents password brute-forcing
  */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
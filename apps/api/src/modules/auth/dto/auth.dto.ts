import { Equals, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Currency } from '@givar/database';
import { IsStrongPassword } from 'src/common/decorators/is-strong-password-decorator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(32, { message: 'Password is too long' })
  @IsStrongPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsBoolean()
  @Equals(true, { message: 'TERMS_NOT_ACCEPTED' })
  acceptTerms!: boolean;

  // Optional: Allow user to choose base currency, default to NGN
  @IsEnum(Currency)
  defaultCurrency: Currency = Currency.NGN;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Authentication code must be at least 6 characters' })
  @MaxLength(8, { message: 'Authentication code cannot exceed 8 characters' })
  twoFactorCode?: string;
}

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: '2FA code must be exactly 6 digits' })
  @MaxLength(6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsStrongPassword()
  password!: string;
}
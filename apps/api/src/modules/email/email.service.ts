import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    try {
      await this.resend.emails.send({
        from: 'Givar <noreply@yourdomain.com>', // Replace with your verified Resend domain
        to: email,
        subject: 'Verify Your Email Address for Givar',
        html: `
          <h1>Welcome to Givar!</h1>
          <p>Please click the link below to verify your email address and activate your account.</p>
          <a href="${verificationLink}" style="padding: 10px 20px; color: white; background-color: #10b981; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>If you did not sign up for Givar, please ignore this email.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      // In a production system, you might add this to a retry queue
    }
  }
}
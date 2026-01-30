import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailTemplates } from './email.templates';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly isDev: boolean;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
    this.fromEmail = this.config.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    this.isDev = this.config.get('NODE_ENV') === 'development';
  }

  // Generic internal sender
  private async send(to: string, subject: string, html: string) {
    if (this.isDev) {
      this.logger.log(`[Dev Email] Sending to ${to}: ${subject}`);
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (data.error) {
        this.logger.error(`Resend API Error: ${data.error.message}`);
        return false;
      }
      
      this.logger.log(`Email sent id: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Email Transmission Failed: ${error}`);
      return false;
    }
  }

  // 1. Verification Email
  async sendVerification(email: string, name: string, token: string) {
    const url = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;
    const content = EmailTemplates.verification(url, name);
    const html = EmailTemplates.base(content, 'Verify your email');
    return this.send(email, 'Verify your Givar account', html);
  }

  // 2. Donation Receipt
  async sendDonationReceipt(email: string, data: { amount: string; currency: string; project: string; date: string; ref: string }) {
    const content = EmailTemplates.receipt(data);
    const html = EmailTemplates.base(content, 'Donation Receipt');
    return this.send(email, `Receipt for your donation to ${data.project}`, html);
  }

  // 3. Security Alert
  async sendLoginAlert(email: string, data: { ip: string; userAgent?: string }) {
    const content = EmailTemplates.securityAlert({
        ip: data.ip,
        time: new Date().toLocaleString()
    });
    const html = EmailTemplates.base(content, 'New Login Detected');
    return this.send(email, 'Security Alert: New Login', html);
  }

  async sendSubscriptionUpdate(email: string, name: string, project: string, status: string) {
    const content = EmailTemplates.subscriptionUpdate({ name, project, status });
    const html = EmailTemplates.base(content, 'Subscription Updated');
    return this.send(email, `Givar: Your donation to ${project} is now ${status}`, html);
  }
}
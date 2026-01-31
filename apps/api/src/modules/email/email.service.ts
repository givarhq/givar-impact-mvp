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

    const envFrom = this.config.get('RESEND_FROM_EMAIL');
    this.fromEmail = envFrom ? envFrom.replace('Givar Impact', '"Givar Impact"') : 'Givar Impact <onboarding@resend.dev>';

    this.isDev = this.config.get('NODE_ENV') === 'development';
  }

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
    return this.send(email, 'Verify your Givar Impact account', html);
  }

  // 2. Donation Receipt
  async sendDonationReceipt(email: string, data: { amount: string; currency: string; project: string; date: string; ref: string }) {
    const content = EmailTemplates.receipt(data);
    const html = EmailTemplates.base(content, 'Donation Receipt');
    return this.send(email, `Givar Impact: Receipt for your donation to ${data.project}`, html);
  }

  // 3. Security Alert
  async sendLoginAlert(email: string, data: { ip: string; userAgent?: string }) {
    const content = EmailTemplates.securityAlert({
      ip: data.ip,
      time: new Date().toLocaleString()
    });
    const html = EmailTemplates.base(content, 'New Login Detected');
    return this.send(email, 'Givar Impact Security Alert: New Login', html);
  }

  // 4. Subscription Update
  async sendSubscriptionUpdate(email: string, name: string, project: string, status: string) {
    const content = EmailTemplates.subscriptionUpdate({ name, project, status });
    const html = EmailTemplates.base(content, 'Subscription Updated');
    return this.send(email, `Givar Impact: Your donation to ${project} is now ${status}`, html);
  }

  // 5. Wallet Funding
  async sendWalletFundingEmail(email: string, data: { name: string; amount: string; currency: string; ref: string; newBalance: string }) {
    const content = EmailTemplates.walletFunded(data);
    const html = EmailTemplates.base(content, 'Wallet Top-up Successful');
    return this.send(email, `Givar Impact: You added ${data.currency} ${data.amount} to your wallet`, html);
  }

  // 6. Password Reset
  async sendPasswordReset(email: string, name: string, url: string) {
    const content = EmailTemplates.passwordReset(url, name);
    const html = EmailTemplates.base(content, 'Reset your password');
    return this.send(email, 'Givar Impact: Password Reset Request', html);
  }

  // 7. Password Changed
  async sendPasswordChanged(email: string, name: string, date: string) {
    const content = EmailTemplates.passwordChanged(name, date);
    const html = EmailTemplates.base(content, 'Password Changed');
    return this.send(email, 'Givar Impact Security Alert: Password Changed', html);
  }

  // 8. Milestone Completion
  async sendMilestoneAlert(email: string, data: { donorName: string; projectTitle: string; milestonePhase: string; date: string; projectUrl: string; imageUrl?: string; }) {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const content = EmailTemplates.milestoneCompleted(data);
    const html = EmailTemplates.base(content, 'Milestone Achieved');
    return this.send(email, `Givar Impact: Milestone Complete for ${data.projectTitle}`, html);
  }

  async sendEvidenceRequest(
    email: string,
    data: { name: string; project: string; milestone: string; vendor: string }
  ) {
    const uploadUrl = `${this.config.get('FRONTEND_URL')}/dashboard/proposals`; // Or specific edit link
    const content = EmailTemplates.evidenceRequest({
      ...data,
      uploadUrl
    });

    const html = EmailTemplates.base(content, 'Action Required: Proof of Work');
    return this.send(email, `Givar Action Required: ${data.project}`, html);
  }
}
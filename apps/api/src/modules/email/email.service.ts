import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailTemplates } from './email.templates';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly isDev: boolean;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
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
        this.logger.error(`Resend API Error for ${to}: ${data.error.message}`);
        return false;
      }

      this.logger.log(`Email dispatched to ${to}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Email Transmission Failed to ${to}: ${error}`);
      return false;
    }
  }

  // 1. Verification Email
  async sendVerification(email: string, name: string, token: string) {
    const url = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;

    const isCode = /^\d{6}$/.test(token);

    const content = EmailTemplates.verification(url, name, isCode ? token : undefined);
    const html = EmailTemplates.base(content, 'Verify your email');
    return this.send(email, 'Verify your Givar Impact account', html);
  }

  // 2. Donation Receipt
  async sendDonationReceipt(
    email: string,
    data: {
      amount: string;
      currency: string;
      project: string;
      date: string;
      ref: string;
      surplus?: string;
      applied?: string;
    }
  ) {
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
    const content = EmailTemplates.milestoneCompleted(data);
    const html = EmailTemplates.base(content, 'Milestone Achieved');

    return this.send(
      email,
      `Givar Impact: Milestone Complete for ${data.projectTitle}`,
      html
    );
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

  // 10. Proposal Status (Approval/Rejection/Changes)
  async sendProposalStatusUpdate(email: string, data: { name: string; project: string; status: string; feedback?: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/proposals`;
    const content = EmailTemplates.proposalStatusUpdate({ ...data, url });
    const html = EmailTemplates.base(content, 'Proposal Status Update');
    return this.send(email, `Givar Impact: Update on "${data.project}"`, html);
  }

  // 11. Milestone Update for Owner
  async sendOwnerMilestoneAlert(email: string, data: { name: string; project: string; milestone: string; status: string; projectId: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/projects/${data.projectId}/manage`;
    const content = EmailTemplates.milestoneOwnerUpdate({ ...data, url });
    const html = EmailTemplates.base(content, 'Milestone Status Updated');
    return this.send(email, `Givar Alert: Phase "${data.milestone}" is now ${data.status}`, html);
  }

  // 12. Financial Adjustment Alert
  async sendFinancialAdjustmentAlert(
    email: string,
    data: {
      name: string;
      projectTitle: string;
      oldGoal: string;
      newGoal: string;
      currency: string;
      reason: string;
      projectUrl: string;
    }
  ) {
    const content = EmailTemplates.financialAdjustment(data);
    const html = EmailTemplates.base(content, 'Ledger Amendment Notice');
    return this.send(email, `Givar Alert: Financial update for ${data.projectTitle}`, html);
  }

  // 13. Project Fully Funded Alert (To Organizer)
  async sendProjectFundedAlert(email: string, data: { name: string; projectTitle: string; amount: string; currency: string; projectId: string }) {
    const projectUrl = `${this.config.get('FRONTEND_URL')}/dashboard/projects/${data.projectId}/manage`;
    const content = EmailTemplates.projectFunded({ ...data, projectUrl });
    const html = EmailTemplates.base(content, 'Project Fully Funded');
    return this.send(email, `Givar Impact: Success! ${data.projectTitle} is fully funded`, html);
  }

  // 14. Project Funded Alert (To Donors)
  async sendProjectFundedDonorAlert(email: string, data: { name: string; projectTitle: string; amount: string; currency: string; projectId: string; projectSlug: string }) {
    const projectUrl = `${this.config.get('FRONTEND_URL')}/explore/${data.projectSlug}`;
    const content = EmailTemplates.projectFundedDonor({ ...data, projectUrl });
    const html = EmailTemplates.base(content, 'Project Successfully Funded');
    return this.send(email, `Givar Impact: The project you supported is fully funded!`, html);
  }

  // 15. Dispatches a friendly notification when an Admin leaves feedback.
  async sendFeedbackNotification(
    email: string,
    data: {
      userName: string;
      projectTitle: string;
      messageContent: string;
      proposalId?: string;
      projectId?: string;
    },
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL');
    const actionUrl = data.projectId
      ? `${frontendUrl}/dashboard/projects/${data.projectId}/manage`
      : `${frontendUrl}/dashboard/proposals/edit/${data.proposalId}/hook`;

    const content = EmailTemplates.feedbackReceived({
      userName: data.userName,
      projectTitle: data.projectTitle,
      messageContent: data.messageContent,
      actionUrl,
    });

    const html = EmailTemplates.base(content, 'New message from Givar');
    return this.send(email, `New message regarding ${data.projectTitle}`, html);
  }

  // 16. Broadcasts an alert to all Administrators when new evidence is uploaded.
  async sendAdminEvidenceAlert(data: { projectTitle: string; milestonePhase: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    if (admins.length === 0) return;

    const frontendUrl = this.config.get('FRONTEND_URL');
    const queueUrl = `${frontendUrl}/admin/verifications?tab=evidence`;

    // Process dispatches in parallel
    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminEvidenceSubmitted({
          adminName: admin.firstName,
          projectTitle: data.projectTitle,
          milestonePhase: data.milestonePhase,
          queueUrl
        });
        const html = EmailTemplates.base(content, 'New Evidence for Review');
        return this.send(admin.email, `Action Required: Evidence for ${data.projectTitle}`, html);
      })
    );
  }

  // 17. Broadcasts to all admins when a new project is proposed.
  async sendAdminProposalAlert(data: { projectTitle: string; proposerName: string; proposalId: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    const url = `${this.config.get('FRONTEND_URL')}/admin/proposals/${data.proposalId}`;

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminProposalSubmitted({
          adminName: admin.firstName,
          projectTitle: data.projectTitle,
          proposerName: data.proposerName,
          url
        });
        return this.send(admin.email, `Review Required: ${data.projectTitle}`, EmailTemplates.base(content, 'New Project Proposal'));
      })
    );
  }

  // 18. Broadcasts to all admins when an entity submits KYC for the first time or updates it.
  async sendAdminKycAlert(data: { orgName: string; proposerName: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    const url = `${this.config.get('FRONTEND_URL')}/admin/verifications?tab=orgs`;

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminKycSubmitted({
          adminName: admin.firstName,
          orgName: data.orgName,
          proposerName: data.proposerName,
          url
        });
        return this.send(admin.email, `KYC Audit Required: ${data.orgName}`, EmailTemplates.base(content, 'New Organization Verification'));
      })
    );
  }

  // 19. Alerts admins when a project owner replies to a thread.
  async sendAdminMessageAlert(data: { senderName: string; projectTitle: string; content: string; contextId: string; isProposal: boolean }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    const url = data.isProposal
      ? `${this.config.get('FRONTEND_URL')}/admin/proposals/${data.contextId}`
      : `${this.config.get('FRONTEND_URL')}/admin/projects/${data.contextId}/edit`;

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminNewMessage({
          adminName: admin.firstName,
          senderName: data.senderName,
          projectTitle: data.projectTitle,
          content: data.content,
          url
        });
        return this.send(admin.email, `New Message: ${data.projectTitle}`, EmailTemplates.base(content, 'Inquiry from Project Owner'));
      })
    );
  }
}
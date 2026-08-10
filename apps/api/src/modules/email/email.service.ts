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
    const resendKey = this.config.get('RESEND_API_KEY') || 're_mock_key_for_testing_purposes';
    this.resend = new Resend(resendKey);

    const envFrom = this.config.get('RESEND_FROM_EMAIL');

    // Strict Sender Formatting: Enforce "Givar" as the display name regardless of ENV configuration
    if (envFrom) {
      const emailMatch = envFrom.match(/<(.+)>/);
      this.fromEmail = emailMatch ? `Givar <${emailMatch[1]}>` : `Givar <${envFrom}>`;
    } else {
      this.fromEmail = 'Givar <onboarding@resend.dev>';
    }

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
    return this.send(email, 'Verify your Givar account', html);
  }

  // 2. Donation Receipt 
  async sendDonationReceipt(
    email: string,
    data: {
      amount: string;
      currency: string;
      project: string;
      phaseName: string;
      date: string;
      ref: string;
      donorAmount?: string;
      donorCurrency?: string;
    }
  ) {
    const content = EmailTemplates.receipt(data);
    const html = EmailTemplates.base(content, 'Donation Receipt');
    return this.send(email, `Givar: Receipt for your donation to ${data.project}`, html);
  }

  // 3. Security Alert
  async sendLoginAlert(email: string, data: { ip: string; userAgent?: string }) {
    const content = EmailTemplates.securityAlert({
      ip: data.ip,
      time: new Date().toLocaleString()
    });
    const html = EmailTemplates.base(content, 'New Login Detected');
    return this.send(email, 'Givar Security Alert: New Login', html);
  }

  // 4. Subscription Update
  async sendSubscriptionUpdate(email: string, name: string, project: string, status: string) {
    const content = EmailTemplates.subscriptionUpdate({ name, project, status });
    const html = EmailTemplates.base(content, 'Subscription Updated');
    return this.send(email, `Givar: Your donation to ${project} is now ${status}`, html);
  }

  // 5. Wallet Funding
  async sendWalletFundingEmail(email: string, data: { name: string; amount: string; currency: string; ref: string; newBalance: string; donorAmount?: string; donorCurrency?: string; }) {
    const content = EmailTemplates.walletFunded(data);
    const html = EmailTemplates.base(content, 'Wallet Top-up Successful');
    return this.send(email, `Givar: You added ${data.currency} ${data.amount} to your wallet`, html);
  }

  // 6. Password Reset
  async sendPasswordReset(email: string, name: string, url: string) {
    const content = EmailTemplates.passwordReset(url, name);
    const html = EmailTemplates.base(content, 'Reset your password');
    return this.send(email, 'Givar: Password Reset Request', html);
  }

  // 7. Password Changed
  async sendPasswordChanged(email: string, name: string, date: string) {
    const content = EmailTemplates.passwordChanged(name, date);
    const html = EmailTemplates.base(content, 'Password Changed');
    return this.send(email, 'Givar Security Alert: Password Changed', html);
  }

  // 8. Milestone Completion
  async sendMilestoneAlert(email: string, data: { donorName: string; projectTitle: string; milestonePhase: string; date: string; projectUrl: string; imageUrl?: string; }) {
    const content = EmailTemplates.milestoneCompleted(data);
    const html = EmailTemplates.base(content, 'Milestone Achieved');

    return this.send(
      email,
      `Givar: Milestone Complete for ${data.projectTitle}`,
      html
    );
  }

  async sendEvidenceRequest(
    email: string,
    data: { name: string; project: string; milestone: string; vendor: string }
  ) {
    const uploadUrl = `${this.config.get('FRONTEND_URL')}/dashboard/proposals`;
    const content = EmailTemplates.evidenceRequest({
      ...data,
      uploadUrl
    });

    const html = EmailTemplates.base(content, 'Action Required: Proof of Work');
    return this.send(email, `Givar Action Required: ${data.project}`, html);
  }

  // 10. Cause Status (Approval/Rejection/Changes)
  async sendProposalStatusUpdate(email: string, data: { name: string; project: string; status: string; feedback?: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/proposals`;
    const content = EmailTemplates.proposalStatusUpdate({ ...data, url });
    // Enforce standardized bold header for cause updates
    const html = EmailTemplates.base(content, 'Update on Your Cause');
    return this.send(email, `Givar: Update on "${data.project}"`, html);
  }

  // 11. Milestone Update for Owner
  async sendOwnerMilestoneAlert(email: string, data: { name: string; project: string; milestone: string; status: string; projectId: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/projects/${data.projectId}/manage`;
    const content = EmailTemplates.milestoneOwnerUpdate({ ...data, url });
    // Enforce standardized bold header for cause updates
    const html = EmailTemplates.base(content, 'Update on Your Cause');
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
    const isGoalChange = data.oldGoal !== data.newGoal;
    const content = EmailTemplates.financialAdjustment(data);
    const header = isGoalChange ? 'Ledger Amendment Notice' : 'Project Plan Update';
    const html = EmailTemplates.base(content, header);

    return this.send(email, `Givar Alert: ${isGoalChange ? 'Financial update' : 'Update'} for ${data.projectTitle}`, html);
  }

  // 13. Project Fully Funded Alert (To Organizer)
  async sendProjectFundedAlert(email: string, data: { name: string; projectTitle: string; amount: string; currency: string; projectId: string }) {
    const projectUrl = `${this.config.get('FRONTEND_URL')}/dashboard/projects/${data.projectId}/manage`;
    const content = EmailTemplates.projectFunded({ ...data, projectUrl });
    const html = EmailTemplates.base(content, 'Cause Fully Funded');
    return this.send(email, `Givar: Success! ${data.projectTitle} is fully funded`, html);
  }

  // 14. Project Funded Alert (To Donors)
  async sendProjectFundedDonorAlert(email: string, data: { name: string; projectTitle: string; amount: string; currency: string; projectId: string; projectSlug: string }) {
    const projectUrl = `${this.config.get('FRONTEND_URL')}/explore/${data.projectSlug}`;
    const content = EmailTemplates.projectFundedDonor({ ...data, projectUrl });
    const html = EmailTemplates.base(content, 'Cause Successfully Funded');
    return this.send(email, `Givar: The cause you supported is fully funded!`, html);
  }

  // 15. Impact Achieved Alert (To Donors)
  async sendImpactAchievedDonorAlert(email: string, data: { name: string; projectTitle: string; projectSlug: string; mediaThumbnail?: string; disbursementSummary?: string }) {
    const projectUrl = `${this.config.get('FRONTEND_URL')}/explore/${data.projectSlug}`;
    const content = EmailTemplates.impactAchievedDonor({ ...data, projectUrl });
    const html = EmailTemplates.base(content, 'Impact Successfully Achieved');
    return this.send(email, `Givar: Mission Accomplished for ${data.projectTitle}!`, html);
  }

  // 16. Dispatches a friendly notification when an Admin leaves feedback.
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
    return this.send(email, `Givar: New message regarding ${data.projectTitle}`, html);
  }

  // 17. Broadcasts an alert to all Administrators when new evidence is uploaded.
  async sendAdminEvidenceAlert(data: { projectTitle: string; milestonePhase: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    if (admins.length === 0) return;

    const frontendUrl = this.config.get('FRONTEND_URL');
    const queueUrl = `${frontendUrl}/admin/verifications?tab=evidence`;

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminEvidenceSubmitted({
          adminName: admin.firstName,
          projectTitle: data.projectTitle,
          milestonePhase: data.milestonePhase,
          queueUrl
        });
        const html = EmailTemplates.base(content, 'New Evidence for Review');
        return this.send(admin.email, `Givar Admin: Evidence for ${data.projectTitle}`, html);
      })
    );
  }

  // 18. Broadcasts to all admins when a new project is proposed.
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
        return this.send(admin.email, `Givar Admin: Review Required for ${data.projectTitle}`, EmailTemplates.base(content, 'New Cause Proposal'));
      })
    );
  }

  // 19. Broadcasts to all admins when an entity submits KYC for the first time or updates it.
  async sendAdminKycAlert(data: { orgName: string; proposerName: string; kycType: string }) {
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
          kycType: data.kycType,
          url
        });
        return this.send(admin.email, `Givar Admin: KYC Audit Required for ${data.orgName}`, EmailTemplates.base(content, 'New Identity Verification'));
      })
    );
  }

  // 20. Alerts admins when a project owner replies to a thread.
  async sendAdminMessageAlert(data: { senderName: string; projectTitle: string; content: string; contextId: string; isProposal: boolean; isAmendment?: boolean }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    const url = data.isProposal
      ? `${this.config.get('FRONTEND_URL')}/admin/proposals/${data.contextId}?tab=communication`
      : `${this.config.get('FRONTEND_URL')}/admin/projects/${data.contextId}/edit?tab=communication`;

    const subject = data.isAmendment
      ? `Givar Admin: Funding Amendment Requested for ${data.projectTitle}`
      : `Givar Admin: New Message for ${data.projectTitle}`;

    const header = data.isAmendment ? 'Funding Amendment Request' : 'Inquiry from Cause Organizer';

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminNewMessage({
          adminName: admin.firstName,
          senderName: data.senderName,
          projectTitle: data.projectTitle,
          content: data.content,
          url,
          isAmendment: data.isAmendment
        });
        return this.send(admin.email, subject, EmailTemplates.base(content, header));
      })
    );
  }

  // 21. Broadcasts to all admins when a high-capital transaction is attempted/blocked.
  async sendAdminHighCapitalAlert(data: { userEmail: string; amount: string; currency: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminHighCapitalIntent({
          adminName: admin.firstName,
          userEmail: data.userEmail,
          amount: data.amount,
          currency: data.currency
        });
        return this.send(admin.email, `Givar Admin: High-Value Intent by ${data.userEmail}`, EmailTemplates.base(content, 'Institutional Lead Detected'));
      })
    );
  }

  // 22. Dispatches a confirmation to the proposer upon successful submission.
  async sendProposalSubmittedConfirmation(email: string, data: { name: string; projectTitle: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/proposals`;
    const content = EmailTemplates.proposalSubmitted({ ...data, url });
    const html = EmailTemplates.base(content, 'Cause Successfully Submitted');
    return this.send(email, `Cause Successfully Submitted`, html);
  }

  // 23. Sends an email to the user when their KYC documents are submitted
  async sendKycSubmittedEmail(email: string, data: { name: string; kycType: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/settings?tab=verification`;
    const content = EmailTemplates.kycSubmitted({ ...data, url });
    const html = EmailTemplates.base(content, 'Verification Documents Received');
    return this.send(email, 'Givar: Verification in progress', html);
  }

  // 24. Sends an email to the user when their KYC is approved
  async sendKycApprovedEmail(email: string, data: { name: string; kycType: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/proposals/start`;
    const content = EmailTemplates.kycApproved({ ...data, url });
    const html = EmailTemplates.base(content, 'Identity Verified');
    return this.send(email, 'Givar: Your identity has been verified', html);
  }

  // 25. Sends an email to the user when their KYC is rejected
  async sendKycRejectedEmail(email: string, data: { name: string; feedback: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/settings?tab=verification`;
    const content = EmailTemplates.kycRejected({ ...data, url });
    const html = EmailTemplates.base(content, 'Verification Requires Attention');
    return this.send(email, 'Givar Action Required: Identity Verification', html);
  }

  // 26. Phase Unlocked Alert (Waitlist Broadcast)
  async sendPhaseUnlockedAlert(email: string, data: { projectTitle: string; projectUrl: string }) {
    const content = EmailTemplates.sendPhaseUnlockedAlert(data);
    const html = EmailTemplates.base(content, 'Next phase unlocked!');
    return this.send(email, `Givar: Next phase unlocked for ${data.projectTitle}`, html);
  }

  // 27. Sends an alert to admins when a vendor payout is confirmed.
  async sendAdminVendorPayoutAlert(data: { projectTitle: string; phaseName: string; vendorName: string; amount: string; currency: string; reference: string; projectId: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    if (admins.length === 0) return;

    const url = `${this.config.get('FRONTEND_URL')}/admin/projects/${data.projectId}/edit`;

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminVendorPayoutConfirmed({
          ...data,
          adminName: admin.firstName,
          url
        });
        const html = EmailTemplates.base(content, 'Vendor Payout Confirmed');
        return this.send(admin.email, `Givar Admin: Payout Confirmed for ${data.vendorName}`, html);
      })
    );
  }

  // 28. Sends an alert to the vendor when their phase funding is confirmed.
  async sendVendorPhaseFundedAlert(email: string, data: { vendorName: string; projectTitle: string; phaseName: string; amount: string; currency: string; reference: string }) {
    const content = EmailTemplates.vendorPhaseFunded(data);
    const html = EmailTemplates.base(content, 'Capital Secured & Routing Initiated');
    return this.send(email, `Givar Notification: Funds secured for ${data.projectTitle}`, html);
  }

  // 29. Amendment Status Alert
  async sendAmendmentStatusAlert(email: string, data: { name: string; projectTitle: string; status: string; feedback?: string; projectUrl: string }) {
    const content = EmailTemplates.amendmentStatusAlert(data);
    const html = EmailTemplates.base(content, 'Amendment Request Update');
    return this.send(email, `Givar: Amendment request ${data.status.toLowerCase()}`, html);
  }

  async sendAdminProjectReportedAlert(data: { projectTitle: string; reason: string; projectId: string; isHighRisk?: boolean }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { email: true, firstName: true }
    });

    if (admins.length === 0) return;

    const url = `${this.config.get('FRONTEND_URL')}/admin/projects/${data.projectId}/edit?tab=disputes`;

    await Promise.allSettled(
      admins.map(admin => {
        const content = EmailTemplates.adminProjectReportedAlert({
          adminName: admin.firstName,
          projectTitle: data.projectTitle,
          reason: data.reason,
          url,
          isHighRisk: data.isHighRisk
        });
        const html = EmailTemplates.base(content, data.isHighRisk ? 'Critical: Cause Flagged' : 'Action Required: Cause Flagged');
        return this.send(admin.email, `Givar Admin: ${data.isHighRisk ? 'Urgent' : 'New'} Report for ${data.projectTitle}`, html);
      })
    );
  }

  async sendReportReceivedReporter(email: string, data: { projectName: string }) {
    const content = EmailTemplates.reportReceivedReporter(data);
    const html = EmailTemplates.base(content, 'Report Received');
    return this.send(email, `Givar: We received your report`, html);
  }

  async sendReportResolvedReporter(email: string, data: { projectName: string; actionTaken: string }) {
    const content = EmailTemplates.reportResolvedReporter(data);
    const html = EmailTemplates.base(content, 'Report Update');
    return this.send(email, `Givar: Update on your recent report`, html);
  }

  async sendReportResolvedOrganizer(email: string, data: { name: string; projectName: string; status: string; feedback: string; projectId: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/dashboard/projects/${data.projectId}/manage`;
    const content = EmailTemplates.reportResolvedOrganizer({ ...data, url });
    const html = EmailTemplates.base(content, 'Review Concluded');
    return this.send(email, `Givar: Dispute review concluded`, html);
  }

  async sendLegalUpdateAlert(email: string, data: { name: string; documentTitle: string; documentSlug: string }) {
    const url = `${this.config.get('FRONTEND_URL')}/legal/${data.documentSlug}`;
    const content = EmailTemplates.legalDocumentUpdated({ ...data, url });
    const html = EmailTemplates.base(content, `Update: ${data.documentTitle}`);
    return this.send(email, `Givar Policy Update: ${data.documentTitle}`, html);
  }

  async sendSuperAdminRecommendationAlert(data: { projectTitle: string; recommendingAdminName: string; internalNotes: string; proposalId: string }) {
    const superAdmins = await this.prisma.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { email: true, firstName: true }
    });

    if (superAdmins.length === 0) return;

    const url = `${this.config.get('FRONTEND_URL')}/admin/proposals/${data.proposalId}`;

    await Promise.allSettled(
      superAdmins.map(admin => {
        const content = EmailTemplates.adminProposalRecommended({
          adminName: admin.firstName,
          projectTitle: data.projectTitle,
          recommendingAdminName: data.recommendingAdminName,
          internalNotes: data.internalNotes,
          url
        });
        return this.send(admin.email, `Givar Superadmin: Cause Recommended for Launch`, EmailTemplates.base(content, 'Cause Recommended'));
      })
    );
  }
}
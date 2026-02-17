import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma, VerificationStatus, AuditAction, ProposalStatus, AccountType, NotificationType, UserRole } from '@givar/database';
import { AuditService } from '../audit/audit.service';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notification: NotificationService,
    private emailService: EmailService
  ) { }

  // 1. User: Submit KYC
  async submitKyc(userId: string, data: { legalName: string, registrationNumber?: string, documentKeys: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update or Create the Organization Profile
      const profile = await tx.organizationProfile.upsert({
        where: { userId },
        update: {
          ...data,
          status: VerificationStatus.PENDING,
          adminFeedback: null,
        },
        create: {
          userId,
          ...data,
          status: VerificationStatus.PENDING,
        },
        include: { user: { select: { firstName: true, lastName: true } } }
      });

      // 2. Fetch all Administrative Nodes
      const admins = await tx.user.findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
        select: { id: true }
      });

      // 3. Dispatch In-App Notifications
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'KYC_STATUS' as NotificationType,
            title: 'KYC Review Required',
            content: `${profile.user.firstName} ${profile.user.lastName} submitted documents for "${data.legalName}".`,
            link: '/admin/verifications?tab=orgs'
          }))
        });
      }

      return profile;
    }).then(async (profile) => {
      // 4. Trigger External Email Broadcast (Async)
      this.emailService.sendAdminKycAlert({
        orgName: data.legalName,
        proposerName: `${profile.user.firstName} ${profile.user.lastName}`
      }).catch(err => this.logger.error(`Admin KYC Email Failed: ${err.message}`));

      return profile;
    });
  }

  // 2. Admin: Get Pending Verifications
  async getPendingVerifications() {
    return this.prisma.organizationProfile.findMany({
      where: { status: VerificationStatus.PENDING },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // 3. Admin: Review Verification
  async reviewVerification(id: string, adminId: string, status: VerificationStatus, feedback?: string) {
    const profile = await this.prisma.organizationProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.$transaction(async (tx) => {

      // 1. Update the Organization Profile
      const updated = await tx.organizationProfile.update({
        where: { id },
        data: {
          status,
          adminFeedback: feedback,
          verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
        },
      });

      // 2. State Convergence logic
      if (status === VerificationStatus.VERIFIED) {
        // --- PATH: APPROVAL ---
        await tx.user.update({
          where: { id: updated.userId },
          data: { accountType: AccountType.ORGANIZER },
        });

        const result = await tx.projectProposal.updateMany({
          where: {
            userId: updated.userId,
            status: ProposalStatus.AWAITING_VERIFICATION
          },
          data: {
            status: ProposalStatus.SUBMITTED,
            submittedAt: new Date()
          }
        });

        if (result.count > 0) {
          this.logger.log(`Auto-submitted ${result.count} proposals for verified user ${updated.userId}`);
        }

        // Logic: Notify user of successful verification
        await tx.notification.create({
          data: {
            userId: updated.userId,
            type: 'KYC_STATUS',
            title: 'Organization verified',
            content: `Your entity "${profile.legalName}" has been successfully verified. You can now launch public causes.`,
            link: '/dashboard/settings?tab=org'
          }
        });
      } else if (status === VerificationStatus.REJECTED) {
        // --- PATH: REJECTION ---
        // Downgrade account type to prevent further organizer actions until re-verified
        await tx.user.update({
          where: { id: updated.userId },
          data: { accountType: AccountType.INDIVIDUAL },
        });

        // Move "waiting" proposals back to DRAFT so user can see feedback and edit
        await tx.projectProposal.updateMany({
          where: {
            userId: updated.userId,
            status: ProposalStatus.AWAITING_VERIFICATION
          },
          data: {
            status: ProposalStatus.DRAFT,
            adminFeedback: `KYC Rejected: ${feedback || 'Please review your verification documents.'}`
          }
        });
        // Logic: Notify user of rejection with feedback
        await tx.notification.create({
          data: {
            userId: updated.userId,
            type: 'KYC_STATUS',
            title: 'Verification rejected',
            content: `We could not verify your organization at this time. Feedback: ${feedback || 'Please review your documents.'}`,
            link: '/dashboard/settings?tab=org'
          }
        });
      }

      // 3. Audit the decision 
      await this.audit.log({
        userId: adminId,
        action: status === VerificationStatus.VERIFIED ? AuditAction.USER_VERIFIED : AuditAction.USER_REJECTED,
        entityId: profile.userId,
        entityType: 'UserOrganization',
        metadata: { status, feedback, legalName: profile.legalName }
      }, tx);

      return updated;
    });
  }

  async getProfileByUserId(userId: string) {
    return this.prisma.organizationProfile.findUnique({
      where: { userId },
    });
  }

  // Advanced Discovery Engine for Admins
  async findAllAdvanced(query: OrganizationQueryDto) {
    const {
      search, status, page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // 1. Construct Dynamic Filter
    const where: Prisma.OrganizationProfileWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { legalName: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    // 2. Construct Dynamic Order
    const orderBy = { [sortBy]: sortOrder };

    // 3. Parallel Execution
    const [profiles, total] = await Promise.all([
      this.prisma.organizationProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              _count: { select: { projects: true } }
            }
          }
        }
      }),
      this.prisma.organizationProfile.count({ where }),
    ]);

    return {
      data: profiles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async findOne(id: string) {
    const profile = await this.prisma.organizationProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            projects: {
              select: {
                id: true,
                title: true,
                status: true,
                raisedAmount: true,
                targetAmount: true,
                currency: true
              },
              orderBy: { createdAt: 'desc' }
            },
            _count: { select: { projects: true } }
          }
        }
      }
    });

    if (!profile) throw new NotFoundException('Organization not found');

    // Recursive Serialization for all nested projects and the profile itself
    return {
      ...profile,
      user: {
        ...profile.user,
        projects: profile.user.projects.map(p => ({
          ...p,
          raisedAmount: p.raisedAmount.toString(),
          targetAmount: p.targetAmount.toString(),
        }))
      }
    };
  }
}
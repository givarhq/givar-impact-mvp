import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, ProposalStatus, AuditAction, Prisma, TxStatus, VerificationStatus, UserRole, AccountType, Currency, TxType, ProofStatus, TxCategory, NotificationType } from '@givar/database';
import { StorageService } from '../storage/storage.service';
import { CreateAdminProjectDto, UpdateAdminProjectDto } from './dto/admin-project.dto';
import { WalletService } from '../wallet/wallet.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ResolveSuspenseDto, SuspenseAction } from './dto/admin-suspense.dto';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { UpdateMilestoneDto } from './dto/admin-milestone.dto';
import { RecordDisbursementDto } from './dto/admin-disbursement.dto';
import { AdminProjectQueryDto } from './dto/admin-project-query.dto';
import { add, format, subDays } from 'date-fns';
import { json2csv } from 'json-2-csv';
import { JwtService } from '@nestjs/jwt';
import { AdminFinanceQueryDto } from './dto/admin-finance.dto';
import { NotificationService } from '../notifications/notification.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
    private walletService: WalletService,
    private emailService: EmailService,
    private audit: AuditService,
    private jwtService: JwtService,
    private notification: NotificationService
  ) { }

  /**
   * Granular Analytics Engine
   * Aggregates platform-wide data for high-level reporting and trend analysis.
   */
  async getDetailedAnalytics(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const [
      totalUsers,
      prevUsers,
      projects,
      donations,
      systemWallets,
      pendingKyc,
      organizationStats,
      proposalStats,
      evidenceStats,
      activeOrganizerCount,
      categories,
      pendingEvidenceCount
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { lt: thirtyDaysAgo } } }),
      this.prisma.project.findMany({
        include: { category: true, _count: { select: { donations: true } } },
        where: { isActive: true }
      }),
      this.prisma.donation.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.wallet.findMany({
        where: { user: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } } }
      }),
      this.prisma.organizationProfile.count({ where: { status: VerificationStatus.PENDING } }),
      this.prisma.organizationProfile.groupBy({ by: ['status'], _count: true }),
      this.prisma.projectProposal.groupBy({ by: ['status'], _count: true }),
      this.prisma.milestoneProof.groupBy({ by: ['status'], _count: true }),
      this.prisma.project.groupBy({ by: ['userId'], where: { status: 'ACTIVE' }, _count: true }).then(r => r.length),
      this.prisma.category.findMany({ select: { id: true, name: true } }),
      this.prisma.milestoneProof.count({ where: { status: 'PENDING' } })
    ]);

    const catPerf = categories.map(cat => {
      const relevant = projects.filter(p => p.categoryId === cat.id);
      const vol = relevant.reduce((acc, p) => acc + p.raisedAmount, 0n);
      return { category: cat.name, count: relevant.length, volume: vol.toString() };
    });

    const dailyMap = new Map<string, { volume: bigint; count: number }>();
    donations.forEach(d => {
      const day = format(d.createdAt, 'yyyy-MM-dd');
      const current = dailyMap.get(day) || { volume: 0n, count: 0 };
      dailyMap.set(day, { volume: current.volume + d.amount, count: current.count + 1 });
    });

    const recentTrends = Array.from({ length: 30 }).map((_, i) => {
      const date = format(subDays(now, i), 'yyyy-MM-dd');
      const stats = dailyMap.get(date) || { volume: 0n, count: 0 };
      return { date, volume: stats.volume.toString(), donations: stats.count };
    }).reverse();

    const [roleDist, typeDist, verificationStates] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
      this.prisma.user.groupBy({ by: ['accountType'], _count: true }),
      this.prisma.organizationProfile.groupBy({ by: ['status'], _count: true })
    ]);

    const sortedByFunding = [...projects].sort((a, b) => Number(b.raisedAmount - a.raisedAmount)).slice(0, 5);
    const sortedByActivity = [...projects].sort((a, b) => b._count.donations - a._count.donations).slice(0, 5);

    const proposalMap = new Map(proposalStats.map(p => [p.status, p._count]));
    const totalSubmitted = (proposalMap.get('SUBMITTED') || 0) + (proposalMap.get('UNDER_REVIEW') || 0) + (proposalMap.get('APPROVED') || 0) + (proposalMap.get('REJECTED') || 0);
    const totalApproved = proposalMap.get('APPROVED') || 0;

    const orgMap = new Map(organizationStats.map(o => [o.status, o._count]));

    // Accurate Liquidity Calculation: Total Active Project Funds + Admin Platform Fees/Tips
    // (Suspense removed from platform architecture)
    const projectVolume = projects.reduce((acc, p) => acc + p.raisedAmount, 0n);
    const revenueVolume = systemWallets.reduce((acc, w) => acc + w.balance, 0n);
    const totalVolumeNGN = projectVolume + revenueVolume;

    const growth = prevUsers === 0 ? 100 : ((totalUsers - prevUsers) / prevUsers) * 100;

    let dominantRisk = 'NONE';
    let riskCount = 0;
    let riskLabel = 'System healthy';

    if (pendingKyc > 0) {
      dominantRisk = 'KYC_PENDING';
      riskCount = pendingKyc;
      riskLabel = 'Pending KYC';
    } else if (pendingEvidenceCount > 0) {
      dominantRisk = 'EVIDENCE_AUDIT';
      riskCount = pendingEvidenceCount;
      riskLabel = 'Proofs to Audit';
    }

    return {
      summary: {
        totalUsers,
        userGrowthPercent: Math.round(growth),
        totalVolume: { NGN: totalVolumeNGN.toString() },
        activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
        pendingKycCount: pendingKyc,
        dominantRisk,
        riskLabel,
        riskCount
      },
      financials: {
        recentTrends,
        avgDonationAmount: donations.length > 0
          ? (donations.reduce((acc, d) => acc + d.amount, 0n) / BigInt(donations.length)).toString()
          : '0',
        currencyDistribution: [],
        successRate: 0
      },
      projectPerformance: {
        topFunded: sortedByFunding.map(p => ({
          id: p.id,
          title: p.title,
          raised: p.raisedAmount.toString(),
          target: p.targetAmount.toString(),
          percent: Number(p.targetAmount) > 0 ? Math.round(Number(p.raisedAmount) * 100 / Number(p.targetAmount)) : 0
        })),
        mostActive: sortedByActivity.map(p => ({
          id: p.id,
          title: p.title,
          donationCount: p._count.donations,
          uniqueDonors: 0
        })),
        statusDistribution: []
      },
      proposalMetrics: {
        totalDrafts: proposalMap.get('DRAFT') || 0,
        totalSubmitted,
        totalApproved,
        totalRejected: proposalMap.get('REJECTED') || 0,
        approvalRate: totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0,
        funnel: [
          { stage: 'Drafts', count: proposalMap.get('DRAFT') || 0 },
          { stage: 'Submitted', count: (proposalMap.get('SUBMITTED') || 0) + (proposalMap.get('UNDER_REVIEW') || 0) },
          { stage: 'Needs Edits', count: proposalMap.get('CHANGES_REQUESTED') || 0 },
          { stage: 'Approved', count: totalApproved }
        ]
      },
      evidenceMetrics: {
        totalSubmitted: evidenceStats.reduce((acc, e) => acc + e._count, 0),
        pending: evidenceStats.find(e => e.status === 'PENDING')?._count || 0,
        approved: evidenceStats.find(e => e.status === 'APPROVED')?._count || 0,
        rejected: evidenceStats.find(e => e.status === 'REJECTED')?._count || 0,
        verificationRate: 0,
        statusDistribution: evidenceStats.map(e => ({ status: e.status, count: e._count }))
      },
      organizationMetrics: {
        totalEntities: organizationStats.reduce((acc, o) => acc + o._count, 0),
        verifiedCount: orgMap.get('VERIFIED') || 0,
        pendingCount: orgMap.get('PENDING') || 0,
        rejectedCount: orgMap.get('REJECTED') || 0,
        activeOrganizers: activeOrganizerCount
      },
      userMetrics: {
        roleDistribution: roleDist.map(r => ({ role: r.role, count: r._count })),
        accountTypeDistribution: typeDist.map(t => ({ type: t.accountType, count: t._count })),
        verificationFunnel: {
          verified: verificationStates.find(s => s.status === 'VERIFIED')?._count || 0,
          pending: verificationStates.find(s => s.status === 'PENDING')?._count || 0,
          unverified: totalUsers - (verificationStates.reduce((acc, s) => acc + s._count, 0))
        },
        newUsersTrend: []
      },
      projectMetrics: {
        categoryDistribution: catPerf,
        statusBreakdown: await this.prisma.project.groupBy({ by: ['status'], _count: true }),
        topFunded: sortedByFunding.map(p => ({
          id: p.id,
          title: p.title,
          raised: p.raisedAmount.toString(),
          target: p.targetAmount.toString(),
          percent: Number(p.targetAmount) > 0 ? Math.round(Number(p.raisedAmount) * 100 / Number(p.targetAmount)) : 0
        })),
        mostActive: sortedByActivity.map(p => ({
          id: p.id,
          title: p.title,
          donationCount: p._count.donations,
          uniqueDonors: 0
        }))
      }
    };
  }

  async getAllProjects(query: AdminProjectQueryDto) {
    const { search, status, categoryId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', excludeDrafts, isSystem } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(status ? { status } : (excludeDrafts ? { status: { not: ProjectStatus.DRAFT } } : {})),
      ...(categoryId && { categoryId }),
      ...(isSystem && { user: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } } }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = { [sortBy]: sortOrder };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { name: true } },
          subcategory: { select: { name: true } },
          user: { select: { role: true } }
        },
        orderBy,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map(p => {
        // CRITICAL PRIVACY GUARD: Ensure waitlisted emails never reach the admin table payload
        const { waitlistEmails, ...safeP } = p as any;
        return {
          ...safeP,
          targetAmount: safeP.targetAmount.toString(),
          raisedAmount: safeP.raisedAmount.toString(),
          categoryName: safeP.category?.name,
          subcategoryName: safeP.subcategory?.name,
          isGivarOfficial: safeP.user.role === UserRole.ADMIN || safeP.user.role === UserRole.SUPERADMIN
        };
      }),
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    };
  }

  // Project Moderation
  async approveProject(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ACTIVE, isActive: true }
    });
  }

  async suspendProject(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.SUSPENDED, isActive: false }
    });
  }

  // --- PROPOSAL MANAGEMENT ---

  async getSubmittedProposals(query: {
    search?: string;
    status?: ProposalStatus;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, category, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectProposalWhereInput = {
      status: status ? status : {
        in: [
          ProposalStatus.SUBMITTED,
          ProposalStatus.UNDER_REVIEW,
          ProposalStatus.CHANGES_REQUESTED,
          ProposalStatus.AWAITING_VERIFICATION
        ]
      },

      ...(category && { category: { slug: category } }),

      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [proposals, total] = await Promise.all([
      this.prisma.projectProposal.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          category: { select: { name: true, slug: true } },
          subcategory: { select: { name: true } }, // <-- NEW: Fetch subcategory for Admin review
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.projectProposal.count({ where }),
    ]);

    return {
      data: proposals.map(p => ({
        ...p,
        targetAmount: p.targetAmount?.toString() || '0',
        subcategoryName: p.subcategory?.name // <-- Map
      })),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async getProposalDetail(id: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            emailVerified: true,
          }
        },
        category: true,
        subcategory: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    if (proposal.coverImage && !proposal.coverImage.startsWith('http')) {
      try {
        const { viewUrl } = await this.storage.getPresignedViewUrl(proposal.coverImage);
        proposal.coverImage = viewUrl;
      } catch (e: any) {
        this.logger.warn(`Failed to sign cover image: ${e.message}`);
      }
    }

    if (proposal.videoUrl && !proposal.videoUrl.startsWith('http')) {
      try {
        const { viewUrl } = await this.storage.getPresignedViewUrl(proposal.videoUrl);
        proposal.videoUrl = viewUrl;
      } catch (e: any) {
        this.logger.warn(`Failed to sign video url: ${e.message}`);
      }
    }

    if (proposal.gallery && Array.isArray(proposal.gallery)) {
      const signedGallery = await Promise.all(
        (proposal.gallery as any[]).map(async (item) => {
          if (typeof item === 'string' && !item.startsWith('http')) {
            try {
              const { viewUrl } = await this.storage.getPresignedViewUrl(item);
              return viewUrl;
            } catch { return item; }
          }
          if (typeof item === 'object' && item.url && !item.url.startsWith('http')) {
            try {
              const { viewUrl } = await this.storage.getPresignedViewUrl(item.url);
              return { ...item, url: viewUrl };
            } catch { return item; }
          }
          return item;
        })
      );
      proposal.gallery = signedGallery;
    }

    return {
      ...proposal,
      subcategoryName: proposal.subcategory?.name
    };
  }

  async approveAndPromote(proposalId: string, adminId: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id: proposalId },
      include: { category: true, user: { select: { email: true, firstName: true } } },
    });

    if (!proposal || (proposal.status !== ProposalStatus.SUBMITTED && proposal.status !== ProposalStatus.UNDER_REVIEW)) {
      throw new BadRequestException('Proposal is not in a submittable state for approval');
    }

    return this.prisma.$transaction(async (tx) => {
      const budget = (proposal.budgetBreakdown as any[]) || [];
      const vendors = (proposal.vendors as any[]) || [];

      if (budget.length === 0) {
        throw new BadRequestException('Cannot launch a project without a budget breakdown.');
      }

      const unboundItems = budget.filter(item => {
        if (!item.vendorId) return true;
        const vendor = vendors.find(v => v.id === item.vendorId);
        return !vendor || !vendor.subaccountCode;
      });

      if (unboundItems.length > 0) {
        throw new BadRequestException(
          `Strict Non-Custodial Policy: All budget items must be bound to a verified vendor subaccount before launch. ${unboundItems.length} unbound item(s) detected.`
        );
      }

      // ROOT CAUSE FIX: Auto-sync executionTimeline to match budget stages
      const sanitizedTimeline = this.syncExecutionTimeline(budget, (proposal.executionTimeline as any[]) || []);

      const project = await tx.project.create({
        data: {
          proposalId: proposal.id,
          userId: proposal.userId,
          title: proposal.title!,
          slug: this.generateSlug(proposal.title!),
          description: proposal.description!,
          shortDesc: proposal.shortDesc,
          personalMessage: proposal.personalMessage,
          targetAmount: proposal.targetAmount!,
          raisedAmount: proposal.hasPreCollectedFunds ? (proposal.preCollectedAmount || 0n) : 0n,
          currency: proposal.currency,
          imageUrl: proposal.coverImage,
          videoUrl: proposal.videoUrl,
          gallery: proposal.gallery || [],
          location: proposal.location,
          endDate: proposal.endDate,
          status: ProjectStatus.ACTIVE,
          categoryId: proposal.categoryId,
          subcategoryId: proposal.subcategoryId,
          tags: ['Verified'],
          isActive: true,
          budgetBreakdown: proposal.budgetBreakdown ?? [],
          executionTimeline: sanitizedTimeline as unknown as Prisma.InputJsonValue,
          vendors: proposal.vendors ?? [],
          riskAnalysis: proposal.riskAnalysis,

          beneficiaryName: proposal.beneficiaryName,
          beneficiaryAge: proposal.beneficiaryAge,
          beneficiaryRelationship: proposal.beneficiaryRelationship,

          hasPreCollectedFunds: proposal.hasPreCollectedFunds,
          preCollectedAmount: proposal.preCollectedAmount,
          preCollectedHeldAt: proposal.preCollectedHeldAt,
          preCollectedProofKey: proposal.preCollectedProofKey,
          preCollectedVerified: proposal.hasPreCollectedFunds ? true : false,
        },
      });

      await tx.projectProposal.update({
        where: { id: proposalId },
        data: {
          status: ProposalStatus.APPROVED,
          approvedAt: new Date(),
          reviewedBy: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.PROJECT_CREATED,
          entityId: project.id,
          entityType: 'Project',
          metadata: {
            proposalId: proposal.id,
            title: project.title,
            method: 'PROPOSAL_PROMOTION',
            dataIntegrity: 'FULL_MIGRATION'
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: proposal.userId,
          type: 'PROPOSAL_STATUS',
          title: 'Project approved',
          content: `Your cause "${proposal.title}" has been verified and is now accepting donations.`,
          link: `/dashboard/impact/${project.slug}`
        }
      });

      return project;
    }).then(async (project) => {
      this.emailService.sendProposalStatusUpdate(proposal.user.email, {
        name: proposal.user.firstName,
        project: proposal.title || 'Untitled',
        status: 'APPROVED'
      }).catch(e => this.logger.error(`Approval Email Failed: ${e.message}`));

      return project;
    });
  }

  /**
   * Finalizes a project, records the final impact achievement update, 
   * and dispatches the donor summary email.
   */
  async finalizeProject(adminId: string, projectId: string, dto: { completionNote: string; imageUrl?: string }) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { disbursements: true, user: true }
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.status === ProjectStatus.COMPLETED) throw new BadRequestException('Project is already marked as completed');

    return this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.COMPLETED }
      });

      await tx.projectUpdate.create({
        data: {
          projectId,
          title: 'Impact Achieved',
          content: dto.completionNote,
          type: 'IMPACT_ACHIEVED',
          imageUrl: dto.imageUrl || null
        }
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.PROJECT_UPDATED,
          entityId: projectId,
          entityType: 'Project',
          metadata: {
            action: 'IMPACT_ACHIEVED',
            status: 'COMPLETED'
          }
        }
      });

      return updatedProject;
    }).then(async (updated) => {
      // Broadcast to donors
      const userDonors = await this.prisma.donation.findMany({
        where: { projectId },
        select: { user: { select: { email: true, firstName: true, preferences: true } } },
        distinct: ['userId'],
      });

      const guestDonors = await this.prisma.guestDonation.findMany({
        where: { projectId },
        select: { guestDonor: { select: { email: true, name: true } } },
        distinct: ['guestDonorId'],
      });

      const recipients = [
        ...userDonors
          .filter(d => (d.user?.preferences as any)?.milestoneUpdates !== false)
          .map(d => ({ email: d.user!.email, name: d.user!.firstName })),
        ...guestDonors.map(d => ({ email: d.guestDonor.email, name: d.guestDonor.name || 'Giver' })),
      ].filter((v, i, a) => a.findIndex(t => t.email === v.email) === i);

      const disbursementSummary = project.disbursements.map(d =>
        `• ${d.vendorName}: ${(Number(d.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${d.currency}`
      ).join('<br/>');

      let signedImageUrl: string | undefined = undefined;
      if (dto.imageUrl) {
        try {
          const { viewUrl } = await this.storage.getPresignedViewUrl(dto.imageUrl);
          signedImageUrl = viewUrl;
        } catch (e) {
          this.logger.warn('Failed to sign completion image for impact email');
        }
      }

      Promise.allSettled(
        recipients.map(r =>
          this.emailService.sendImpactAchievedDonorAlert(r.email, {
            name: r.name,
            projectTitle: project.title,
            projectSlug: project.slug,
            mediaThumbnail: signedImageUrl,
            disbursementSummary
          })
        )
      ).catch(err => this.logger.error('Final Impact Broadcast Failed', err));

      return updated;
    });
  }

  async rejectProposal(id: string, adminId: string, feedback: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
      include: { user: { select: { email: true, firstName: true } } }
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectProposal.update({
        where: { id },
        data: {
          status: ProposalStatus.REJECTED,
          adminFeedback: feedback,
          reviewedBy: adminId
        },
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.PROPOSAL_REJECTED,
        entityId: id,
        entityType: 'ProjectProposal',
        metadata: {
          action: 'REJECTED',
          proposerId: proposal.userId,
          feedback
        }
      }, tx);

      // Notify the owner of the rejection
      await tx.notification.create({
        data: {
          userId: proposal.userId,
          type: 'PROPOSAL_STATUS',
          title: 'Proposal not approved',
          content: `We could not approve "${proposal.title || 'your project'}" at this time. Feedback: ${feedback}`,
          link: '/dashboard/proposals'
        }
      });

      return updated;
    });

    this.emailService.sendProposalStatusUpdate(proposal.user.email, {
      name: proposal.user.firstName,
      project: proposal.title || 'Untitled',
      status: 'REJECTED',
      feedback
    }).catch(e => this.logger.error(`Rejection Email Failed: ${e.message}`));

    return result;
  }

  async requestChanges(id: string, adminId: string, feedback: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
      include: { user: { select: { email: true, firstName: true } } }
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectProposal.update({
        where: { id },
        data: {
          status: ProposalStatus.CHANGES_REQUESTED,
          adminFeedback: feedback,
          reviewedBy: adminId,
        },
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.PROJECT_UPDATED,
        entityId: id,
        entityType: 'ProjectProposal',
        metadata: {
          action: 'REQUEST_CHANGES',
          proposerId: proposal.userId,
          feedback
        }
      }, tx);

      return updated;
    });

    this.emailService.sendProposalStatusUpdate(proposal.user.email, {
      name: proposal.user.firstName,
      project: proposal.title || 'Untitled',
      status: 'CHANGES REQUESTED',
      feedback
    }).catch(e => this.logger.error(`Changes Email Failed: ${e.message}`));

    return result;
  }

  private generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
  }

  // User Management
  async getAllUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    accountType?: AccountType;
    status?: 'LOCKED' | 'ACTIVE' | 'all';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      accountType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // 1. Construct Dynamic Forensic Filter
    const where: Prisma.UserWhereInput = {
      ...(role && {
        role: role === UserRole.ADMIN ? { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } : role
      }),
      ...(accountType && { accountType }),
      ...(status === 'LOCKED' && { accountLockedUntil: { gte: new Date() } }),
      ...(status === 'ACTIVE' && {
        OR: [{ accountLockedUntil: null }, { accountLockedUntil: { lt: new Date() } }]
      }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // 2. Dynamic Sort Resolution
    const orderBy: any = {};
    if (sortBy === 'impactValue') {
      orderBy.donations = { _count: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // 3. Parallel Execution
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          accountType: true,
          accountLockedUntil: true,
          avatarKey: true,
          organization: { select: { status: true } }, // Fetch KYC status explicitly
          _count: { select: { donations: true, projects: true } },
          donations: { select: { amount: true } }
        },
        orderBy
      }),
      this.prisma.user.count({ where })
    ]);

    // 4. Post-Process: Calculate LIV & Hydrate Avatar
    const data = await Promise.all(users.map(async (user) => {
      const liv = user.donations.reduce((acc, d) => acc + d.amount, 0n);

      let avatarUrl = null;
      if (user.avatarKey) {
        const { viewUrl } = await this.storage.getPresignedViewUrl(user.avatarKey);
        avatarUrl = viewUrl;
      }

      return {
        ...user,
        donations: undefined,
        kycStatus: user.organization?.status || 'NOT_SUBMITTED', // Surface KYC logic
        lifetimeImpact: liv.toString(),
        isLocked: !!user.accountLockedUntil && user.accountLockedUntil > new Date(),
        accountType: user.role !== UserRole.USER ? 'SYSTEM' : user.accountType,
        avatarUrl
      };
    }));

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        organization: true,
        _count: { select: { donations: true, projects: true, subscriptions: true } },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) throw new NotFoundException('User not found');

    // Calculate Lifetime Impact Value (LIV)
    const livResult = await this.prisma.donation.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    let avatarUrl = null;
    if (user.avatarKey) {
      const { viewUrl } = await this.storage.getPresignedViewUrl(user.avatarKey);
      avatarUrl = viewUrl;
    }

    return {
      ...user,
      passwordHash: undefined, // Security: never leak hash even to admins
      lifetimeImpact: livResult._sum.amount?.toString() || '0',
      wallets: user.wallets.map(w => ({ ...w, balance: w.balance.toString() })),
      accountType: user.role !== UserRole.USER ? 'SYSTEM' : user.accountType,
      avatarUrl
    };
  }

  /**
   * Helper: Synchronizes the Execution Timeline to strictly mirror the stages 
   * defined in the budget breakdown. Preserves existing deliverable states.
   */
  private syncExecutionTimeline(budget: any[], sourceTimeline: any[]) {
    const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
    const uniqueStages = Array.from(new Set(budget.map((b: any) => b.stage || 'Main Stage')));

    uniqueStages.sort((a, b) => {
      const idxA = STAGE_ORDER.indexOf(a as string);
      const idxB = STAGE_ORDER.indexOf(b as string);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    return uniqueStages.map((stage, index) => {
      const existingStage = sourceTimeline.find((t: any) => t.phase === stage);
      const stageItems = budget.filter((b: any) => (b.stage || 'Main Stage') === stage);
      const deliverables = stageItems.map((b: any) => b.description || b.item || 'Implementation').join(', ');

      if (existingStage) {
        return {
          ...existingStage,
          status: existingStage.status || 'PENDING',
          // Only overwrite deliverables if it's the auto-generated generic one, or if they just added new items.
          deliverables: existingStage.deliverables && !existingStage.deliverables.startsWith('Execution of')
            ? existingStage.deliverables
            : deliverables
        };
      }

      return {
        id: `auto-stage-${index}`,
        phase: stage,
        estimatedDate: 'TBD',
        status: 'PENDING',
        deliverables
      };
    });
  }

  async createProject(adminId: string, dto: CreateAdminProjectDto) {
    const budget = dto.budgetBreakdown || [];
    const vendors = dto.vendors || [];

    if (dto.status === ProjectStatus.ACTIVE) {
      if (budget.length === 0) {
        throw new BadRequestException('Cannot launch a project without a budget breakdown.');
      }
      const unboundItems = budget.filter((item: any) => {
        if (!item.vendorId) return true;
        const vendor = vendors.find((v: any) => v.id === item.vendorId);
        return !vendor || !vendor.subaccountCode;
      });
      if (unboundItems.length > 0) {
        throw new BadRequestException('Strict Non-Custodial Policy: All budget items must be bound to a verified vendor subaccount before launch.');
      }
    }

    const slug = this.generateSlug(dto.title);
    const executionTimeline = this.syncExecutionTimeline(budget, dto.executionTimeline || []);

    const createData: Prisma.ProjectCreateInput = {
      title: dto.title,
      description: dto.description,
      shortDesc: dto.shortDesc,
      personalMessage: dto.personalMessage,
      location: dto.location,
      currency: dto.currency,
      imageUrl: dto.coverImage,
      videoUrl: dto.videoUrl,
      slug: slug,
      targetAmount: BigInt(Math.round(Number(dto.targetAmount))),
      raisedAmount: 0n,
      status: dto.status || ProjectStatus.ACTIVE,
      isActive: true,
      tags: dto.tags || ['Admin Created', 'Verified'],

      user: { connect: { id: adminId } },
      category: { connect: { id: dto.categoryId } },

      gallery: dto.gallery as unknown as Prisma.InputJsonValue,
      budgetBreakdown: dto.budgetBreakdown as unknown as Prisma.InputJsonValue,
      executionTimeline: executionTimeline as unknown as Prisma.InputJsonValue,
      vendors: dto.vendors as unknown as Prisma.InputJsonValue,
    };

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: createData,
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.PROJECT_CREATED,
          entityId: project.id,
          entityType: 'Project',
          metadata: {
            title: project.title,
            method: 'ADMIN_DIRECT',
            status: project.status
          },
        },
      });

      return project;
    });
  }

  async updateProject(adminId: string, projectId: string, dto: UpdateAdminProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { user: { select: { email: true, firstName: true, preferences: true } } }
    });
    if (!existing) throw new NotFoundException('Project not found');

    const isLive = ([
      ProjectStatus.ACTIVE,
      ProjectStatus.FUNDED,
      ProjectStatus.COMPLETED
    ] as ProjectStatus[]).includes(existing.status);

    const newTarget = dto.targetAmount !== undefined ? BigInt(Math.round(Number(dto.targetAmount))) : existing.targetAmount;
    const isGoalChanging = newTarget !== existing.targetAmount;
    const isBudgetChanging = dto.budgetBreakdown !== undefined && JSON.stringify(dto.budgetBreakdown) !== JSON.stringify(existing.budgetBreakdown);
    const isTimelineChanging = dto.executionTimeline !== undefined && JSON.stringify(dto.executionTimeline) !== JSON.stringify(existing.executionTimeline);

    const isPlanAmending = isGoalChanging || isBudgetChanging || isTimelineChanging;

    if (isLive && isPlanAmending) {
      if (!dto.reasonForGoalAdjustment || dto.reasonForGoalAdjustment.length < 10) {
        throw new BadRequestException('Live projects require an amendment narrative.');
      }
    }

    const updateData: Prisma.ProjectUpdateInput = {
      title: dto.title,
      description: dto.description,
      shortDesc: dto.shortDesc,
      personalMessage: dto.personalMessage,
      location: dto.location,
      currency: dto.currency,
      imageUrl: dto.coverImage,
      status: dto.status,
      isActive: dto.isActive,
      tags: dto.tags,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };

    if ((dto as any).videoUrl !== undefined) updateData.videoUrl = (dto as any).videoUrl;
    if (dto.targetAmount) updateData.targetAmount = newTarget;

    if (dto.categoryId) updateData.category = { connect: { id: dto.categoryId } };
    if (dto.gallery) updateData.gallery = dto.gallery as any;

    if (dto.budgetBreakdown || dto.vendors) {
      const budgetToCheck = dto.budgetBreakdown || (existing.budgetBreakdown as any[]) || [];
      const vendorsToCheck = dto.vendors || (existing.vendors as any[]) || [];
      const unboundItems = budgetToCheck.filter((item: any) => {
        if (!item.vendorId) return true;
        const vendor = vendorsToCheck.find((v: any) => v.id === item.vendorId);
        return !vendor || !vendor.subaccountCode;
      });
      if ((dto.status === ProjectStatus.ACTIVE || isLive) && unboundItems.length > 0) {
        throw new BadRequestException('Strict Non-Custodial Policy: All budget items must remain bound to a verified vendor subaccount.');
      }
      if (dto.budgetBreakdown) updateData.budgetBreakdown = dto.budgetBreakdown as any;
      if (dto.vendors) updateData.vendors = dto.vendors as any;
    }

    if (dto.budgetBreakdown) {
      updateData.budgetBreakdown = dto.budgetBreakdown as any;
      updateData.executionTimeline = this.syncExecutionTimeline(
        dto.budgetBreakdown,
        dto.executionTimeline || (existing.executionTimeline as any[]) || []
      ) as any;
    } else if (dto.executionTimeline) {
      updateData.executionTimeline = dto.executionTimeline as any;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (isGoalChanging && newTarget <= existing.raisedAmount) {
        const intendedStatus = dto.status || existing.status;
        if (intendedStatus === ProjectStatus.ACTIVE) {
          updateData.status = ProjectStatus.FUNDED;
          (updateData as any).fundedAt = new Date();
        }
      }

      const project = await tx.project.update({
        where: { id: projectId },
        data: updateData,
      });

      if (isLive && isPlanAmending) {
        await tx.projectUpdate.create({
          data: {
            projectId,
            title: isGoalChanging ? 'Financial Goal Adjusted' : 'Project Plan Amended',
            content: isGoalChanging
              ? `Goal adjusted from ${(Number(existing.targetAmount) / 100).toLocaleString()} to ${(Number(project.targetAmount) / 100).toLocaleString()}. Reason: ${dto.reasonForGoalAdjustment}`
              : `Execution plan updated. Reason: ${dto.reasonForGoalAdjustment}`,
            type: 'ANNOUNCEMENT'
          }
        });

        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: AuditAction.PROJECT_UPDATED,
            entityId: projectId,
            entityType: 'Project',
            metadata: {
              action: 'PLAN_AMENDMENT',
              oldGoal: existing.targetAmount.toString(),
              newGoal: project.targetAmount.toString(),
              reason: dto.reasonForGoalAdjustment
            },
          },
        });
      }

      return project;
    });

    if (isLive && isPlanAmending) {
      this.broadcastFinancialAdjustment(
        projectId,
        result.title,
        result.slug,
        existing.targetAmount,
        result.targetAmount,
        result.currency,
        dto.reasonForGoalAdjustment!,
        existing.user
      ).catch(err => this.logger.error(`Broadcast failed: ${err.message}`));
    }

    return result;
  }

  private async broadcastFinancialAdjustment(
    projectId: string,
    projectTitle: string,
    projectSlug: string,
    oldGoal: bigint,
    newGoal: bigint,
    currency: string,
    reason: string,
    organizer: { email: string; firstName: string; preferences?: any }
  ) {
    // 1. Fetch unique donors with their preference profiles
    const userDonors = await this.prisma.donation.findMany({
      where: { projectId },
      select: { user: { select: { email: true, firstName: true, preferences: true } } },
      distinct: ['userId'],
    });

    const guestDonors = await this.prisma.guestDonation.findMany({
      where: { projectId },
      select: { guestDonor: { select: { email: true, name: true } } },
      distinct: ['guestDonorId'],
    });

    // 2. Build the recipient list
    const recipients: { email: string; name: string }[] = [
      // Filtered Registered Users
      ...userDonors
        .filter(d => (d.user?.preferences as any)?.milestoneUpdates !== false)
        .map(d => ({ email: d.user!.email, name: d.user!.firstName })),

      // Guest Donors (Always notified as they have no preference profile)
      ...guestDonors.map(d => ({ email: d.guestDonor.email, name: d.guestDonor.name || 'Giver' })),
    ];

    // 3. Add Organizer ONLY if they haven't opted out
    const organizerPrefs = organizer.preferences as any;
    if (organizerPrefs?.milestoneUpdates !== false) {
      recipients.push({ email: organizer.email, name: organizer.firstName });
    }

    // 4. Deduplicate by email (in case the organizer is also a donor)
    const uniqueRecipients = recipients.filter((v, i, a) =>
      a.findIndex(t => t.email === v.email) === i
    );

    const projectUrl = `${this.config.get('FRONTEND_URL')}/explore/${projectSlug}`;
    const fmtOld = (Number(oldGoal) / 100).toLocaleString();
    const fmtNew = (Number(newGoal) / 100).toLocaleString();

    this.logger.log(`📢 Broadcasting Ledger Amendment for "${projectTitle}" to ${uniqueRecipients.length} stakeholders.`);

    Promise.allSettled(
      uniqueRecipients.map(r =>
        this.emailService.sendFinancialAdjustmentAlert(r.email, {
          name: r.name,
          projectTitle,
          oldGoal: fmtOld,
          newGoal: fmtNew,
          currency,
          reason,
          projectUrl
        })
      )
    ).catch(err => this.logger.error('Broadcast Transmission Failed', err));
  }

  // Forensic Project Deletion with Asset Purge
  async deleteProject(adminId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { _count: { select: { donations: true, guestDonations: true } } }
    });

    if (!project) throw new NotFoundException('Project not found');

    // 2. Financial Integrity Guard (FIXED: Now strictly checks guest donations to prevent DB FK crash)
    if (project._count.donations > 0 || project._count.guestDonations > 0) {
      throw new ForbiddenException(
        'CRITICAL: This project has received donations. For financial audit integrity, it cannot be deleted. Use Suspend/Complete instead.'
      );
    }

    const keysToPurge: string[] = [];

    if (project.imageUrl && !project.imageUrl.startsWith('http')) {
      keysToPurge.push(project.imageUrl);
    }

    if (project.gallery && Array.isArray(project.gallery)) {
      const gallery = project.gallery as any[];
      gallery.forEach(item => {
        if (item.url && !item.url.startsWith('http')) {
          keysToPurge.push(item.url);
        }
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // 3.5 ADDED: Cascade delete connected peripheral nodes to prevent FK constraint failures
      await tx.projectUpdate.deleteMany({ where: { projectId } });
      await tx.featuredSlot.deleteMany({ where: { projectId } });
      await tx.milestoneProof.deleteMany({ where: { projectId } });
      await tx.disbursement.deleteMany({ where: { projectId } });

      const deleted = await tx.project.delete({ where: { id: projectId } });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.PROJECT_DELETED,
        entityId: projectId,
        entityType: 'Project',
        metadata: { title: deleted.title, purgedFileCount: keysToPurge.length },
      }, tx);

      return deleted;
    }).then(async (result) => {
      if (keysToPurge.length > 0) {
        await this.storage.deleteFiles(keysToPurge);
      }
      return result;
    });
  }

  async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        category: true,
        disbursements: {
          orderBy: { createdAt: 'desc' },
        },
        milestoneProofs: {
          orderBy: { submittedAt: 'desc' },
        },
        _count: {
          select: { donations: true }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    // AUTO-HEALING: Self-repair an empty execution timeline by pulling from the budget breakdown
    let timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];
    if (timeline.length === 0) {
      const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
      if (budget.length > 0) {
        const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
        const uniqueStages = Array.from(new Set(budget.map((b: any) => b.stage || 'Main Stage')));

        uniqueStages.sort((a, b) => {
          const idxA = STAGE_ORDER.indexOf(a as string);
          const idxB = STAGE_ORDER.indexOf(b as string);
          return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });

        timeline = uniqueStages.map((stage, index) => {
          const stageItems = budget.filter((b: any) => (b.stage || 'Main Stage') === stage);
          const deliverables = stageItems.map((b: any) => b.description || b.item || 'Implementation').join(', ');

          return {
            id: `auto-stage-${index}`,
            phase: stage,
            estimatedDate: 'TBD',
            status: 'PENDING',
            deliverables: deliverables,
          };
        });

        await this.prisma.project.update({
          where: { id: projectId },
          data: { executionTimeline: timeline as any }
        });

        project.executionTimeline = timeline as any;
      }
    }

    if (project.imageUrl && !project.imageUrl.startsWith('http')) {
      const { viewUrl } = await this.storage.getPresignedViewUrl(project.imageUrl);
      project.imageUrl = viewUrl;
    }

    if (project.videoUrl && !project.videoUrl.startsWith('http')) {
      const { viewUrl } = await this.storage.getPresignedViewUrl(project.videoUrl);
      project.videoUrl = viewUrl;
    }

    if (project.gallery && Array.isArray(project.gallery)) {
      const signedGallery = await Promise.all(
        (project.gallery as any[]).map(async (item) => {
          if (item.url && !item.url.startsWith('http')) {
            const { viewUrl } = await this.storage.getPresignedViewUrl(item.url);
            return { ...item, url: viewUrl };
          }
          return item;
        })
      );
      project.gallery = signedGallery as unknown as Prisma.JsonValue;
    }

    const hydratedProofs = await Promise.all(
      project.milestoneProofs.map(async (proof) => {
        const signedImages = await Promise.all(
          proof.imageKeys.map(key =>
            this.storage.getPresignedViewUrl(key).then(r => r.viewUrl).catch(() => null)
          )
        );
        return { ...proof, imageUrls: signedImages.filter(url => url !== null) };
      })
    );

    return {
      ...project,
      targetAmount: project.targetAmount.toString(),
      raisedAmount: project.raisedAmount.toString(),
      milestoneProofs: hydratedProofs,
      disbursements: project.disbursements.map((d) => ({
        ...d,
        amount: d.amount.toString(),
      })),
    };
  }

  // Verify a reference against Paystack directly (Ground Truth)
  async verifyExternalTransaction(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
          },
          timeout: 10000,
        },
      );

      const { status, amount, currency, metadata, channel } = response.data.data;

      // Check if it already exists in Givar
      const internalRecord = await this.walletService.verifyAnyTransaction(reference);

      return {
        external: { status, amount, currency, metadata, channel },
        internal: internalRecord,
        canReconcile: status === 'success' && internalRecord.status === 'pending'
      };
    } catch (error) {
      this.logger.error(`Paystack verification failed for ref ${reference}`, error);
      throw new ServiceUnavailableException('Could not verify with Paystack');
    }
  }

  // Atomic Reconciliation
  async executeReconciliation(adminId: string, reference: string) {
    const verification = await this.verifyExternalTransaction(reference);

    if (!verification.canReconcile) {
      throw new BadRequestException('Transaction cannot be reconciled (Either failed on Paystack or already exists in Givar)');
    }

    const { amount, currency, metadata } = verification.external;

    const result = await this.walletService.handleReconciliationFulfillment({
      userId: metadata?.userId || 'GUEST',
      guestEmail: metadata?.guestEmail,
      guestName: metadata?.guestName,
      projectId: metadata?.projectId,
      amount: BigInt(amount),
      currency: currency as any,
      reference,
      // Ensure manual reconciliations perfectly mirror the original mathematical intent
      baseAmount: metadata?.baseAmount ? BigInt(metadata.baseAmount) : undefined,
      feeAmount: metadata?.feeAmount ? BigInt(metadata.feeAmount) : undefined,
      tipAmount: metadata?.tipAmount ? BigInt(metadata.tipAmount) : undefined,
      feePercentageUsed: metadata?.feePercentage !== undefined ? Number(metadata.feePercentage) : undefined,
      feeRuleId: metadata?.feeRuleId,
    });

    const serializedResult: any = { ...result };

    if (result && 'surplus' in result && typeof result.surplus === 'bigint') {
      serializedResult.surplus = result.surplus.toString();
    }

    // High-priority Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: AuditAction.RECONCILIATION_PERFORMED,
        entityId: reference,
        entityType: 'LedgerCorrection',
        metadata: {
          reference,
          adminId,
          result: serializedResult
        },
      },
    });

    return result;
  }

  // Update specific phase in the execution timeline
  async updateProjectMilestone(
    projectId: string,
    milestoneId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    dto: UpdateMilestoneDto,
    adminId: string,
    skipProofCreation: boolean = false
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        executionTimeline: true,
        budgetBreakdown: true,
        title: true,
        slug: true,
        waitlistEmails: true,
        currentPhaseIndex: true,
        raisedAmount: true,
        user: { select: { email: true, firstName: true } }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const timeline = (project.executionTimeline as any[]) || [];
    const budget = (project.budgetBreakdown as any[]) || [];
    const milestoneIndex = timeline.findIndex(m => m.id === milestoneId);

    if (milestoneIndex === -1) {
      throw new BadRequestException('Milestone ID not found in project timeline');
    }

    const previousStatus = timeline[milestoneIndex].status;
    const isLastPhase = milestoneIndex === timeline.length - 1;

    // NEW: Phase completion financial guard
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      let previousPhasesMajor = 0;
      let currentPhaseMajor = 0;

      const previousStages = timeline.slice(0, milestoneIndex).map((t: any) => t.phase);
      const currentStageName = timeline[milestoneIndex].phase;

      budget.forEach((item: any) => {
        const amt = item.amount || item.cost || 0;
        const itemStage = item.stage || 'Main Stage';

        if (previousStages.includes(itemStage)) {
          previousPhasesMajor += amt;
        } else if (itemStage === currentStageName) {
          currentPhaseMajor += amt;
        }
      });

      const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));
      const currentPhaseTargetMinor = BigInt(Math.round(currentPhaseMajor * 100));

      const totalRaisedMinor = BigInt(project.raisedAmount || '0');
      let phaseRaisedMinor = totalRaisedMinor - previousPhasesMinor;
      if (phaseRaisedMinor < 0n) phaseRaisedMinor = 0n;

      if (phaseRaisedMinor < currentPhaseTargetMinor && currentPhaseTargetMinor > 0n) {
        throw new BadRequestException("Cannot verify a stage until it is 100% funded.");
      }
    }

    const updatedTimeline = [...timeline];
    updatedTimeline[milestoneIndex] = {
      ...updatedTimeline[milestoneIndex],
      status,
      imageUrl: dto.imageUrl || updatedTimeline[milestoneIndex].imageUrl,
      updatedAt: new Date().toISOString(),
      ...(status === 'COMPLETED' && { completedAt: new Date().toISOString() })
    };

    const currentStageLogicName = updatedTimeline[milestoneIndex].phase;
    const cleanStageName = currentStageLogicName.replace(/^Phase \d+:\s*/i, '');

    const stageBudgetItems = budget
      .filter((b: any) => (b.stage || 'Main Stage') === currentStageLogicName)
      .map((b: any) => b.description || b.item)
      .join(', ');

    const richStageName = `${cleanStageName}${stageBudgetItems ? `: ${stageBudgetItems}` : ''}`;

    const updateData: any = { executionTimeline: updatedTimeline as any };
    let emailsToNotify: string[] = [];

    // State Progression / Regression Math Fix
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      if (!isLastPhase) {
        updateData.currentPhaseIndex = { increment: 1 };
        updateData.waitlistEmails = [];
        emailsToNotify = project.waitlistEmails || [];
      }
    } else if (previousStatus === 'COMPLETED' && status !== 'COMPLETED') {
      // Safely decrement phase index if a stage is re-opened
      const safeDecrement = Math.max(0, (project.currentPhaseIndex || 0) - 1);
      updateData.currentPhaseIndex = safeDecrement;
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    await this.audit.log({
      userId: adminId,
      action: AuditAction.PROJECT_UPDATED,
      entityId: projectId,
      entityType: 'Project',
      metadata: {
        action: 'MILESTONE_UPDATE',
        milestone: richStageName,
        previousStatus,
        newStatus: status,
        phaseUnlocked: emailsToNotify.length > 0
      }
    });

    if (project.user) {
      this.emailService.sendOwnerMilestoneAlert(project.user.email, {
        name: project.user.firstName,
        project: project.title,
        milestone: richStageName,
        status: status.replace('_', ' '),
        projectId
      }).catch(err => this.logger.error(`Owner Milestone Email Failed: ${err.message}`));
    }

    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      await this.prisma.projectUpdate.create({
        data: {
          projectId,
          title: `Milestone Achieved: ${richStageName}`,
          content: `We are pleased to announce that the "${updatedTimeline[milestoneIndex].phase}" stage has been successfully completed. Items verified: ${updatedTimeline[milestoneIndex].deliverables}.`,
          type: 'MILESTONE',
          imageUrl: dto.imageUrl || null
        }
      });

      if (!skipProofCreation) {
        await this.prisma.milestoneProof.create({
          data: {
            projectId,
            milestoneId,
            description: 'Administrative Verification: Execution deliverables have been confirmed and signed off by platform management.',
            imageKeys: dto.imageUrl ? [dto.imageUrl] : [],
            status: ProofStatus.APPROVED,
            adminFeedback: 'Direct administrative sign-off.'
          }
        });
      }

      let signedProofUrl: string | undefined = undefined;

      if (dto.imageUrl) {
        const { viewUrl } = await this.storage.getPresignedViewUrl(dto.imageUrl, 604800);
        signedProofUrl = viewUrl;
      }

      this.broadcastMilestoneUpdate(
        projectId,
        project.title,
        project.slug,
        richStageName,
        signedProofUrl
      ).catch(err => this.logger.error(`Broadcast failed: ${err.message}`));

      if (emailsToNotify.length > 0) {
        const projectUrl = `${this.config.get('FRONTEND_URL')}/explore/${project.slug}`;
        this.logger.log(`📢 Broadcasting Next Stage Unlock to ${emailsToNotify.length} waitlisted donors.`);
        Promise.allSettled(
          emailsToNotify.map(email =>
            this.emailService.sendPhaseUnlockedAlert(email, {
              projectTitle: project.title,
              projectUrl
            })
          )
        ).catch(err => this.logger.error(`Waitlist broadcast failed: ${err.message}`));
      }
    }

    return updatedProject;
  }

  private async broadcastMilestoneUpdate(projectId: string, projectTitle: string, projectSlug: string, milestonePhase: string, imageUrl?: string) {
    const userDonors = await this.prisma.donation.findMany({
      where: { projectId },
      select: { user: { select: { email: true, firstName: true, preferences: true } } },
      distinct: ['userId'],
    });

    const guestDonors = await this.prisma.guestDonation.findMany({
      where: { projectId },
      select: { guestDonor: { select: { email: true, name: true } } },
      distinct: ['guestDonorId'],
    });

    const recipients = [
      ...userDonors
        .filter(d => {
          const prefs = d.user?.preferences as any;
          return prefs?.milestoneUpdates !== false;
        })
        .map((d) => ({
          email: d.user?.email,
          name: d.user?.firstName || 'Impact Maker'
        })),
      ...guestDonors.map((d) => ({
        email: d.guestDonor.email,
        name: d.guestDonor.name || 'Impact Maker'
      })),
    ].filter((r) => r.email);

    const frontendUrl = this.config.get('FRONTEND_URL');
    const projectUrl = `${frontendUrl}/explore/${projectSlug}`;
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    this.logger.log(`📢 Broadcasting Milestone: "${milestonePhase}" to ${recipients.length} donors.`);

    Promise.allSettled(
      recipients.map((r) =>
        this.emailService.sendMilestoneAlert(r.email!, {
          donorName: r.name!,
          projectTitle,
          milestonePhase,
          date: formattedDate,
          projectUrl,
          imageUrl,
        }),
      ),
    ).catch((err) => this.logger.error('Milestone Broadcast Failed', err));
  }

  // Fetch Suspense Queue
  async getSuspenseTransactions() {
    return this.prisma.walletTransaction.findMany({
      where: { status: TxStatus.SUSPENSE },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: { include: { user: { select: { email: true, firstName: true } } } }
      }
    });
  }

  // Helper to trigger Paystack Refund
  private async triggerPaystackRefund(reference: string) {
    try {
      const response = await axios.post(
        'https://api.paystack.co/refund',
        { transaction: reference },
        {
          headers: { Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}` },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      this.logger.error(`Paystack Refund Failed: ${message}`);
      throw new BadRequestException(`Paystack Refund Failed: ${message}`);
    }
  }

  /**
   * Handles Manual Audits, Refunds, and Phased Capital Re-allocation
   */
  async resolveSuspenseTransaction(adminId: string, transactionId: string, dto: ResolveSuspenseDto) {
    const tx = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!tx || tx.status !== TxStatus.SUSPENSE) {
      throw new BadRequestException('Transaction not found or already resolved.');
    }

    // --- CASE A: REFUND PROTOCOL ---
    if (dto.action === SuspenseAction.REFUND) {
      await this.triggerPaystackRefund(tx.reference);

      return this.prisma.$transaction(async (prisma) => {
        const updated = await prisma.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: TxStatus.REVERSED,
            description: `${tx.description}[GATEWAY-REFUNDED]`
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: AuditAction.TRANSACTION_RESOLVED,
            entityId: transactionId,
            entityType: 'WalletTransaction',
            metadata: {
              action: 'AUTO_REFUND',
              originalRef: tx.reference,
              amountRaw: tx.amount.toString(),
              amount_naira: (Number(tx.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            },
          },
        });
        return updated;
      });
    }

    // --- CASE B: RE-ALLOCATION PROTOCOL ---
    if (dto.action === SuspenseAction.ALLOCATE) {
      if (!dto.allocations || dto.allocations.length === 0) {
        throw new BadRequestException('Re-allocation requires at least one target project.');
      }

      const totalAllocated = dto.allocations.reduce((acc, curr) => acc + BigInt(curr.amount), 0n);
      if (totalAllocated !== tx.amount) {
        throw new BadRequestException(
          `Accounting Error: Total split sum (${totalAllocated.toString()}) must match orphaned capital (${tx.amount.toString()})`
        );
      }

      for (const split of dto.allocations) {
        const targetProj = await this.prisma.project.findUnique({
          where: { id: split.projectId }
        });

        if (!targetProj) throw new BadRequestException(`Project ${split.projectId} not found.`);

        const isClosed = ([ProjectStatus.COMPLETED, ProjectStatus.SUSPENDED] as ProjectStatus[]).includes(targetProj.status);
        if (isClosed) {
          throw new BadRequestException(`Cannot allocate to "${targetProj.title}" because it is already closed or suspended.`);
        }

        const budget = (targetProj.budgetBreakdown as any[]) || [];
        const timeline = (targetProj.executionTimeline as any[]) || [];
        const activeIndex = targetProj.currentPhaseIndex || 0;

        const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
        const sortedBudget = [...budget].sort((a, b) => {
          const idxA = STAGE_ORDER.indexOf(a.stage || 'Main Stage');
          const idxB = STAGE_ORDER.indexOf(b.stage || 'Main Stage');
          return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });

        const previousStages = timeline.slice(0, activeIndex).map((t: any) => t.phase);
        const currentStageName = timeline[activeIndex]?.phase || 'Main Stage';

        let totalMajor = 0;
        sortedBudget.forEach((item: any) => {
          const amt = item.amount || item.cost || 0;
          const itemStage = item.stage || 'Main Stage';

          if (previousStages.includes(itemStage) || itemStage === currentStageName) {
            totalMajor += amt;
          }
        });

        let currentPhaseCapMinor = BigInt(Math.round(totalMajor * 100));
        if (timeline.length === 0 || activeIndex >= timeline.length) {
          currentPhaseCapMinor = BigInt(targetProj.targetAmount || '0');
        }

        const remainingForPhase = currentPhaseCapMinor - targetProj.raisedAmount;

        if (BigInt(split.amount) > remainingForPhase) {
          throw new BadRequestException(
            `Allocation to "${targetProj.title}" exceeds its CURRENT PHASE goal. It only needs ₦${(Number(remainingForPhase) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}. Please adjust your splits to respect the phase limit.`
          );
        }
      }

      return this.prisma.$transaction(async (txPrisma) => {
        const updatedParentTx = await txPrisma.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: TxStatus.COMPLETED,
            description: `${tx.description} [RESOLVED VIA MULTI-SPLIT REALLOCATION]`
          }
        });

        const guestEmail = (tx.metadata as any)?.guestEmail;
        const forensicAllocationLog = [];

        for (let i = 0; i < dto.allocations.length; i++) {
          const split = dto.allocations[i];
          const splitAmount = BigInt(split.amount);
          const splitRef = `${tx.reference}-S${i + 1}`;

          if (guestEmail) {
            const guestDonor = await txPrisma.guestDonor.upsert({
              where: { email: guestEmail },
              update: { totalDonated: { increment: splitAmount }, donationCount: { increment: 1 } },
              create: {
                email: guestEmail,
                name: (tx.metadata as any)?.guestName || 'Anonymous Guest',
                totalDonated: splitAmount,
                donationCount: 1
              }
            });

            await txPrisma.guestDonation.create({
              data: {
                guestDonorId: guestDonor.id,
                projectId: split.projectId,
                amount: splitAmount,
                currency: tx.currency,
                reference: splitRef,
                status: 'COMPLETED',
                message: 'Admin Split Re-allocation'
              }
            });
          } else {
            const splitTx = await txPrisma.walletTransaction.create({
              data: {
                walletId: tx.walletId,
                amount: splitAmount,
                currency: tx.currency,
                type: TxType.DEBIT,
                status: TxStatus.COMPLETED,
                category: TxCategory.DONATION,
                reference: splitRef,
                description: `Impact Split for Project: ${split.projectId}`,
                metadata: {
                  parentTransactionId: tx.id,
                  originalReference: tx.reference,
                  reallocationAudit: true
                }
              }
            });

            await txPrisma.donation.create({
              data: {
                userId: tx.wallet.userId,
                projectId: split.projectId,
                transactionId: splitTx.id,
                amount: splitAmount,
                currency: tx.currency,
                message: 'System-mediated impact reallocation'
              }
            });
          }

          const updatedProject = await txPrisma.project.update({
            where: { id: split.projectId },
            data: { raisedAmount: { increment: splitAmount } },
            select: { title: true, id: true, userId: true, targetAmount: true, raisedAmount: true, currentPhaseIndex: true, budgetBreakdown: true, executionTimeline: true, vendors: true }
          });

          const isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;
          if (isGoalMet) {
            await txPrisma.project.update({
              where: { id: updatedProject.id },
              data: { status: 'FUNDED', fundedAt: new Date() }
            });
          }

          const updatedBudget = (updatedProject.budgetBreakdown as any[]) || [];
          const updatedTimeline = (updatedProject.executionTimeline as any[]) || [];
          const updatedActiveIndex = updatedProject.currentPhaseIndex || 0;

          const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
          const updatedSortedBudget = [...updatedBudget].sort((a, b) => {
            const idxA = STAGE_ORDER.indexOf(a.stage || 'Main Stage');
            const idxB = STAGE_ORDER.indexOf(b.stage || 'Main Stage');
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
          });

          const updatedPreviousStages = updatedTimeline.slice(0, updatedActiveIndex).map((t: any) => t.phase);
          const updatedCurrentStageName = updatedTimeline[updatedActiveIndex]?.phase || 'Main Stage';

          let updatedTotalMajor = 0;
          updatedSortedBudget.forEach((item: any) => {
            const amt = item.amount || item.cost || 0;
            const itemStage = item.stage || 'Main Stage';

            if (updatedPreviousStages.includes(itemStage) || itemStage === updatedCurrentStageName) {
              updatedTotalMajor += amt;
            }
          });

          let phaseCap = BigInt(Math.round(updatedTotalMajor * 100));
          if (updatedTimeline.length === 0 || updatedActiveIndex >= updatedTimeline.length) {
            phaseCap = updatedProject.targetAmount;
          }

          const isPhaseNewlyMet = !isGoalMet && (updatedProject.raisedAmount >= phaseCap);

          await txPrisma.notification.create({
            data: {
              userId: updatedProject.userId,
              type: 'DONATION_RECEIVED',
              title: 'Capital reallocation received',
              content: `Your project "${updatedProject.title}" received a system allocation of ${tx.currency} ${(Number(splitAmount) / 100).toLocaleString()}.`,
              link: `/dashboard/projects/${updatedProject.id}/manage`
            }
          });

          if (isGoalMet) {
            await txPrisma.notification.create({
              data: {
                userId: updatedProject.userId,
                type: 'PROJECT_STATUS',
                title: 'Goal reached via allocation!',
                content: `Success! "${updatedProject.title}" is now fully funded following a ledger adjustment.`,
                link: `/dashboard/projects/${updatedProject.id}/manage`
              }
            });
          } else if (isPhaseNewlyMet) {
            const admins = await txPrisma.user.findMany({
              where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
              select: { id: true }
            });

            if (admins.length > 0) {
              await txPrisma.notification.createMany({
                data: admins.map(admin => ({
                  userId: admin.id,
                  type: 'PROJECT_STATUS' as NotificationType,
                  title: 'Phase Fully Funded via Reallocation',
                  content: `Phase ${(updatedProject.currentPhaseIndex || 0) + 1} for "${updatedProject.title}" is fully funded. Ready for vendor disbursement.`,
                  link: `/admin/projects/${updatedProject.id}/edit`
                }))
              });

              const vendorsArray = Array.isArray(updatedProject.vendors) ? (updatedProject.vendors as any[]) : [];
              const phaseBudgetItems = updatedBudget.filter((b: any) => (b.stage || 'Main Stage') === updatedCurrentStageName);
              const vendorAllocations = new Map<string, { amount: number, email: string, name: string }>();

              phaseBudgetItems.forEach((b: any) => {
                const vendor = vendorsArray.find(v => v.id === b.vendorId);
                const vEmail = vendor?.email || b.vendorEmail;
                const vName = vendor?.name || b.payTo || b.vendor || 'Verified Vendor';
                const amt = b.amount || b.cost || 0;

                if (vEmail) {
                  const existing = vendorAllocations.get(vEmail) || { amount: 0, email: vEmail, name: vName };
                  existing.amount += amt;
                  vendorAllocations.set(vEmail, existing);
                }
              });

              for (const [email, vData] of vendorAllocations.entries()) {
                this.emailService.sendVendorPhaseFundedAlert(email, {
                  vendorName: vData.name,
                  projectTitle: updatedProject.title,
                  phaseName: updatedCurrentStageName,
                  amount: vData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                  currency: tx.currency,
                  reference: splitRef
                }).catch(err => this.logger.error(`Vendor notification failed: ${err.message}`));
              }
            }
          }

          forensicAllocationLog.push({
            projectId: updatedProject.id,
            projectTitle: updatedProject.title,
            amountMinorUnits: splitAmount.toString(),
            amountFormatted: `${tx.currency} ${(Number(splitAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            splitReference: splitRef
          });
        }

        await txPrisma.auditLog.create({
          data: {
            userId: adminId,
            action: AuditAction.FUNDS_REALLOCATED,
            entityId: transactionId,
            entityType: 'WalletTransaction',
            metadata: {
              action: 'MULTI_REALLOCATE',
              totalCapitalRaw: tx.amount.toString(),
              totalCapital_naira: (Number(tx.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              currency: tx.currency,
              parentReference: tx.reference,
              splitCount: dto.allocations.length,
              detailedAllocations: forensicAllocationLog
            },
          },
        });

        return updatedParentTx;
      }, { timeout: 25000 });
    }
  }

  async recordDisbursement(adminId: string, projectId: string, dto: RecordDisbursementDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { user: { select: { email: true, firstName: true } } }
    });

    if (!project) throw new NotFoundException('Project not found');

    const timeline = (project.executionTimeline as any[]) || [];
    const budget = (project.budgetBreakdown as any[]) || [];
    const milestone = timeline.find(m => m.id === dto.milestoneId);

    const currentStageLogicName = milestone?.phase || 'Main Stage';
    const cleanStageName = currentStageLogicName.replace(/^Phase \d+:\s*/i, '');

    const stageBudgetItems = budget
      .filter((b: any) => (b.stage || 'Main Stage') === currentStageLogicName)
      .map((b: any) => b.description || b.item)
      .join(', ');

    const richStageName = milestone
      ? `${cleanStageName}${stageBudgetItems ? `: ${stageBudgetItems}` : ''}`
      : 'Current Stage';

    return this.prisma.$transaction(async (tx) => {
      const disbursement = await tx.disbursement.create({
        data: {
          projectId,
          milestoneId: dto.milestoneId,
          amount: BigInt(dto.amount),
          currency: project.currency,
          vendorName: dto.vendorName,
          reference: dto.reference,
          receiptKey: dto.receiptKey,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.DISBURSEMENT_RECORDED,
          entityId: disbursement.id,
          entityType: 'Disbursement',
          metadata: {
            vendor: dto.vendorName,
            milestone: richStageName,
            amount_naira: (Number(dto.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            hasReceipt: !!dto.receiptKey
          }
        }
      });

      await tx.projectUpdate.create({
        data: {
          projectId,
          title: 'Funds Disbursed',
          content: `A payment of ${(Number(dto.amount) / 100).toLocaleString()} ${project.currency} has been securely disbursed to ${dto.vendorName} for the execution of the "${richStageName}" stage.`,
          type: 'FUNDS_DISBURSED',
          imageUrl: dto.receiptKey ? dto.receiptKey : null
        }
      });

      await tx.notification.create({
        data: {
          userId: project.userId,
          type: 'MILESTONE_ALERT',
          title: 'Action required: Proof of work',
          content: `Funds disbursed to ${dto.vendorName} for "${richStageName}". Please upload evidence.`,
          link: `/dashboard/projects/${projectId}/manage#submit-evidence`
        }
      });

      return { disbursement, owner: project.user, milestoneName: richStageName };
    }).then(async (res) => {
      await this.emailService.sendEvidenceRequest(res.owner.email, {
        name: res.owner.firstName,
        project: project.title,
        milestone: res.milestoneName,
        vendor: dto.vendorName
      }).catch(err => this.logger.error(`Evidence email failed: ${err.message}`));

      return res.disbursement;
    });
  }

  async getOrganizationQueue(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: VerificationStatus;
  }) {
    const { page = 1, limit = 15, search, status } = query;
    const skip = (page - 1) * limit;

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

    const [profiles, total] = await Promise.all([
      this.prisma.organizationProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.organizationProfile.count({ where }),
    ]);

    return {
      data: profiles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(adminId: string, userId: string, action: 'LOCK' | 'UNLOCK') {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const target = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!target) throw new NotFoundException('User not found');

    // Hierarchy Check
    if (target.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmin accounts are immutable.');
    }

    if (target.role === UserRole.ADMIN && admin?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only Superadmins can modify Admin status.');
    }

    const lockUntil = action === 'LOCK' ? add(new Date(), { years: 100 }) : null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          accountLockedUntil: lockUntil,
          failedLoginAttempts: 0
        }
      });

      await this.audit.log({
        userId: adminId,
        action: action === 'LOCK' ? AuditAction.USER_LOCKED : AuditAction.USER_UNLOCKED,
        entityId: userId,
        entityType: 'User',
        metadata: {
          action,
          previousLockStatus: !!target.accountLockedUntil,
          performedBy: adminId
        }
      }, tx);

      return updated;
    });
  }

  async updateUserRole(adminId: string, userId: string, newRole: UserRole) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const target = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!target) throw new NotFoundException('User not found');

    // Security Guards
    if (admin?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only Superadmins can promote or demote roles.');
    }

    if (target.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot modify the Superadmin role directly.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { role: newRole }
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.USER_ROLE_CHANGED,
        entityId: userId,
        entityType: 'User',
        metadata: {
          prevRole: target.role,
          newRole,
          performedBy: adminId
        }
      }, tx);

      return updated;
    });
  }

  /**
   * Forensic Batch Processor
   * Handles mass state transitions for accounts with dedicated audit trails per unit.
   */
  async bulkUpdateUsers(adminId: string, data: { userIds: string[], action: 'LOCK' | 'UNLOCK' | 'SET_USER' | 'SET_ADMIN' }) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const targets = await this.prisma.user.findMany({
      where: { id: { in: data.userIds } }
    });

    const isSuperAdmin = admin?.role === UserRole.SUPERADMIN;

    // Filter valid targets based on hierarchy
    const validTargets = targets.filter(t => {
      if (t.role === UserRole.SUPERADMIN) return false;
      if (t.role === UserRole.ADMIN && !isSuperAdmin) return false;
      return true;
    });

    if (validTargets.length === 0) {
      throw new ForbiddenException('No actionable users selected based on your permission level.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const user of validTargets) {
        let updateData: Prisma.UserUpdateInput = {};
        let auditAction: AuditAction;

        switch (data.action) {
          case 'LOCK':
            updateData = { accountLockedUntil: add(new Date(), { years: 100 }) };
            auditAction = AuditAction.USER_LOCKED;
            break;
          case 'UNLOCK':
            updateData = { accountLockedUntil: null, failedLoginAttempts: 0 };
            auditAction = AuditAction.USER_UNLOCKED;
            break;
          case 'SET_ADMIN':
            if (!isSuperAdmin) throw new ForbiddenException('Only Superadmins can promote to Admin.');
            updateData = { role: UserRole.ADMIN };
            auditAction = AuditAction.USER_ROLE_CHANGED;
            break;
          case 'SET_USER':
            if (!isSuperAdmin) throw new ForbiddenException('Only Superadmins can demote Admins.');
            updateData = { role: UserRole.USER };
            auditAction = AuditAction.USER_ROLE_CHANGED;
            break;
        }

        await tx.user.update({
          where: { id: user.id },
          data: updateData,
        });

        await this.audit.log({
          userId: adminId,
          action: auditAction!,
          entityId: user.id,
          entityType: 'User',
          metadata: { action: data.action, forensicContext: 'BULK_OPERATION' }
        }, tx);
      }

      return { count: validTargets.length, skipped: targets.length - validTargets.length };
    }, { timeout: 15000 });
  }

  async exportUsersToCsv(query: {
    search?: string;
    role?: UserRole;
    accountType?: AccountType;
    status?: 'LOCKED' | 'ACTIVE' | 'all';
  }) {
    const { search, role, accountType, status } = query;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(accountType && { accountType }),
      ...(status === 'LOCKED' && { accountLockedUntil: { gte: new Date() } }),
      ...(status === 'ACTIVE' && {
        OR: [{ accountLockedUntil: null }, { accountLockedUntil: { lt: new Date() } }]
      }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, accountType: true, createdAt: true,
        accountLockedUntil: true, emailVerified: true,
        organization: { select: { status: true } }, // Include for export as well
        donations: { select: { amount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const flattened = users.map(u => {
      const livTotalMinor = u.donations.reduce((acc, d) => acc + d.amount, 0n);
      const isLocked = !!u.accountLockedUntil && u.accountLockedUntil > new Date();

      return {
        Forensic_ID: u.id,
        Name: `${u.firstName} ${u.lastName}`,
        Email: u.email,
        Role: String(u.role),
        Account_Type: String(u.accountType),
        LIV_NGN: (Number(livTotalMinor) / 100).toFixed(2),
        Email_Verified: u.emailVerified ? 'YES' : 'NO',
        KYC_Status: u.organization?.status || 'NOT_SUBMITTED', // Add explicit KYC column
        Status: isLocked ? 'LOCKED' : 'ACTIVE',
        Joined_At: u.createdAt.toISOString()
      };
    });

    if (flattened.length === 0) return 'Forensic_ID,Name,Email,Role,Account_Type,LIV_NGN,Email_Verified,KYC_Status,Status,Joined_At';

    return json2csv(flattened);
  }

  async impersonateUser(adminId: string, targetUserId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true }
    });

    if (!targetUser) throw new NotFoundException('Target user not found');

    // Hierarchy Check
    if (targetUser.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot impersonate Superadmin.');
    }

    if (targetUser.role === UserRole.ADMIN && admin?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Admins cannot impersonate other Admins.');
    }

    // Generate Forensic JWT with short TTL (15 minutes)
    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      isImpersonating: true,
      adminId: adminId
    };

    const supportToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    // Forensic Audit Entry
    await this.audit.log({
      userId: adminId,
      action: AuditAction.IMPERSONATION_STARTED,
      entityId: targetUserId,
      entityType: 'User',
      metadata: {
        action: 'IMPERSONATION_STARTED',
        targetEmail: targetUser.email,
        sessionDuration: '15m'
      }
    });

    return {
      accessToken: supportToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role
      }
    };
  }

  /**
   * Omni-Search Engine
   * Scans critical tables for matches against the query string.
   */
  async globalSearch(query: string) {
    if (!query || query.trim().length < 2) {
      return {
        users: [],
        projects: [],
        proposals: [],
        organizations: [],
        transactions: [],
        auditLogs: []
      };
    }

    const searchTerm = query.trim();
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(searchTerm);

    // If it looks like a UUID, prioritized exact ID lookups
    const idFilter = isUuid ? { id: searchTerm } : {};

    // General text filter
    const textFilter = { contains: searchTerm, mode: 'insensitive' as const };

    const [users, projects, proposals, organizations, transactions, auditLogs] = await Promise.all([
      // 1. Users
      this.prisma.user.findMany({
        where: {
          OR: [
            { id: isUuid ? searchTerm : undefined },
            { email: textFilter },
            { firstName: textFilter },
            { lastName: textFilter },
          ]
        },
        take: 5,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, accountType: true }
      }),

      // 2. Projects
      this.prisma.project.findMany({
        where: {
          OR: [
            { id: isUuid ? searchTerm : undefined },
            { title: textFilter },
            { slug: textFilter },
            { location: textFilter }
          ]
        },
        take: 5,
        select: { id: true, title: true, slug: true, status: true, raisedAmount: true, targetAmount: true, currency: true }
      }),

      // 3. Proposals
      this.prisma.projectProposal.findMany({
        where: {
          OR: [
            { id: isUuid ? searchTerm : undefined },
            { title: textFilter }
          ]
        },
        take: 5,
        select: { id: true, title: true, status: true, category: { select: { name: true } } }
      }),

      // 4. Organizations
      this.prisma.organizationProfile.findMany({
        where: {
          OR: [
            { id: isUuid ? searchTerm : undefined },
            { legalName: textFilter },
            { registrationNumber: textFilter }
          ]
        },
        take: 5,
        select: { id: true, legalName: true, registrationNumber: true, status: true }
      }),

      // 5. Transactions (Wallet & Guest)
      this.prisma.walletTransaction.findMany({
        where: {
          OR: [
            { id: isUuid ? searchTerm : undefined },
            { reference: textFilter },
            { description: textFilter }
          ]
        },
        take: 5,
        select: { id: true, reference: true, amount: true, currency: true, type: true, status: true, description: true }
      }),

      // 6. Audit Logs (Forensic search)
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            { id: isUuid ? searchTerm : undefined },
            { entityId: searchTerm }, // Exact match usually for Entity IDs
            { ipAddress: textFilter }
          ]
        },
        take: 5,
        select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, ipAddress: true }
      })
    ]);

    return {
      users,
      projects,
      proposals,
      organizations,
      transactions,
      auditLogs
    };
  }

  /**
   * Dust Sweep Protocol
   * Identifies projects where the remaining balance is less than the minimum donation (₦100)
   * and has been stagnant for over 30 days.
   */
  async sweepStaleSmallRemainderProjects(adminId: string) {
    const STALE_THRESHOLD_DAYS = 30;
    const DUST_LIMIT_MINOR = 10000n; // ₦100.00 (Platform Minimum)
    const staleDate = subDays(new Date(), STALE_THRESHOLD_DAYS);

    // 1. Fetch all active candidate projects
    const candidates = await this.prisma.project.findMany({
      where: {
        status: ProjectStatus.ACTIVE,
        isActive: true
      },
    });

    // 2. Identify "Stuck" or "Stagnant" dust
    const staleProjects = candidates.filter(p => {
      const remaining = p.targetAmount - p.raisedAmount;

      // Condition A: Mathematically Stuck (Remaining < Min Donation) -> Sweep immediately
      const isStuck = remaining > 0n && remaining < DUST_LIMIT_MINOR;

      // Condition B: Stagnant (Remaining is small but fundable, but hasn't moved in 30 days)
      const isStagnant = remaining > 0n && remaining < (DUST_LIMIT_MINOR * 5n) && p.updatedAt < staleDate;

      return isStuck || isStagnant;
    });

    if (staleProjects.length === 0) {
      return { swept: 0, message: 'No candidate dust nodes identified.' };
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const sweptIds = [];

      for (const project of staleProjects) {
        const gap = project.targetAmount - project.raisedAmount;

        await tx.project.update({
          where: { id: project.id },
          data: {
            targetAmount: project.raisedAmount,
            status: ProjectStatus.FUNDED,
            fundedAt: new Date(),
          },
        });

        await tx.projectUpdate.create({
          data: {
            projectId: project.id,
            title: 'Project Goal Finalized',
            content: `The project goal has been aligned to the total capital raised (₦${(Number(project.raisedAmount) / 100).toLocaleString()}) to initiate the execution phase.`,
            type: 'ANNOUNCEMENT',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: AuditAction.PROJECT_UPDATED,
            entityId: project.id,
            entityType: 'Project',
            metadata: {
              action: 'DUST_SWEEP_PROTOCOL',
              originalTarget: project.targetAmount.toString(),
              finalTarget: project.raisedAmount.toString(),
              absorbedGap_naira: (Number(gap) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              reason: gap < DUST_LIMIT_MINOR ? 'MATHEMATICALLY_STUCK' : 'STAGNANT_SMALL_REMAINDER',
            },
          },
        });

        sweptIds.push(project.id);
      }

      return sweptIds;
    });

    return {
      swept: results.length,
      projectIds: results,
    };
  }

  /**
   * Bulk Project Node Processor
   * Per-unit audit logging is enforced for forensic traceability.
   */
  async bulkUpdateProjects(adminId: string, data: { projectIds: string[], action: 'ACTIVATE' | 'SUSPEND' | 'DELETE' }) {
    const projects = await this.prisma.project.findMany({
      where: { id: { in: data.projectIds } },
      include: { _count: { select: { donations: true } } }
    });

    return this.prisma.$transaction(async (tx) => {
      for (const project of projects) {
        if (data.action === 'ACTIVATE') {
          await tx.project.update({
            where: { id: project.id },
            data: { status: ProjectStatus.ACTIVE, isActive: true }
          });
        } else if (data.action === 'SUSPEND') {
          await tx.project.update({
            where: { id: project.id },
            data: { status: ProjectStatus.SUSPENDED, isActive: false }
          });
        } else if (data.action === 'DELETE') {
          // Guard: Forensic integrity check for each unit
          if (project._count.donations > 0) {
            throw new BadRequestException(`Cannot delete project ${project.id}: historical ledger records detected.`);
          }
          await tx.project.delete({ where: { id: project.id } });
        }

        await this.audit.log({
          userId: adminId,
          action: data.action === 'DELETE' ? AuditAction.PROJECT_DELETED : AuditAction.PROJECT_UPDATED,
          entityId: project.id,
          entityType: 'Project',
          metadata: { action: data.action, forensicContext: 'BULK_OPERATION' }
        }, tx);
      }
      return { count: projects.length };
    }, { timeout: 20000 });
  }

  /**
   * Bulk Proposal Workflow Orchestrator
   * Reuses internal promotion logic for approvals to ensure data consistency.
   */
  async bulkUpdateProposals(adminId: string, data: { proposalIds: string[], action: 'APPROVE' | 'REJECT' }) {
    const proposals = await this.prisma.projectProposal.findMany({
      where: { id: { in: data.proposalIds } }
    });

    if (data.action === 'APPROVE') {
      const results = [];
      for (const prop of proposals) {
        try {
          const project = await this.approveAndPromote(prop.id, adminId);
          results.push(project.id);
        } catch (e: any) {
          this.logger.error(`Bulk approval failed for ${prop.id}: ${e.message}`);
        }
      }
      return { count: results.length, total: proposals.length };
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.projectProposal.updateMany({
        where: { id: { in: data.proposalIds } },
        data: { status: ProposalStatus.REJECTED, adminFeedback: 'Batch rejected by administrator.' }
      });

      for (const id of data.proposalIds) {
        await this.audit.log({
          userId: adminId,
          action: AuditAction.PROPOSAL_REJECTED,
          entityId: id,
          entityType: 'ProjectProposal',
          metadata: { action: 'BULK_REJECT' }
        }, tx);
      }
      return { count: result.count };
    });
  }

  /**
   * Financial Intelligence Engine
   * Aggregates platform capital flow, project performance, and category-level efficiency.
   */
  async getFinancialReport(query: AdminFinanceQueryDto) {
    const { startDate, endDate, categoryIds } = query;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const categoryFilter = categoryIds && categoryIds.length > 0 ? { in: categoryIds } : undefined;

    // 1. Core Capital Flow Aggregates
    const [inflowRes, donationRes, disbursementRes, feeRes, tipRes] = await Promise.all([
      // Gross Inflow: (Funding + Direct Donations + Tips + Fees)
      this.prisma.walletTransaction.aggregate({
        where: {
          type: TxType.CREDIT,
          createdAt: dateFilter,
          status: TxStatus.COMPLETED,
          category: { in: [TxCategory.FUNDING, TxCategory.DONATION, TxCategory.TRANSACTION_FEE, TxCategory.VOLUNTARY_TIP] }
        },
        _sum: { amount: true },
        _count: true
      }),
      // Donations (Capital Commitment)
      this.prisma.donation.aggregate({
        where: { createdAt: dateFilter, project: { categoryId: categoryFilter } },
        _sum: { amount: true },
        _count: true
      }),
      // Disbursements (Capital Deployment)
      this.prisma.disbursement.aggregate({
        where: { createdAt: dateFilter, project: { categoryId: categoryFilter } },
        _sum: { amount: true },
        _count: true
      }),
      // Platform Fees
      this.prisma.walletTransaction.aggregate({
        where: {
          type: TxType.CREDIT,
          createdAt: dateFilter,
          status: TxStatus.COMPLETED,
          category: TxCategory.TRANSACTION_FEE
        },
        _sum: { amount: true }
      }),
      // Platform Tips
      this.prisma.walletTransaction.aggregate({
        where: {
          type: TxType.CREDIT,
          createdAt: dateFilter,
          status: TxStatus.COMPLETED,
          category: TxCategory.VOLUNTARY_TIP
        },
        _sum: { amount: true }
      })
    ]);

    const totalFees = feeRes._sum.amount || 0n;
    const totalTips = tipRes._sum.amount || 0n;
    const platformRevenue = totalFees + totalTips;

    // Performance Stats
    const projectStats = await this.prisma.project.findMany({
      where: {
        categoryId: categoryFilter,
        createdAt: startDate ? { gte: new Date(startDate) } : undefined
      },
      select: {
        id: true,
        title: true,
        targetAmount: true,
        raisedAmount: true,
        currency: true,
        status: true,
        category: { select: { name: true } }
      }
    });

    const causePerformance = projectStats.map(p => {
      const rate = p.targetAmount > 0n
        ? Number((p.raisedAmount * 10000n) / p.targetAmount) / 100
        : 0;
      return { ...p, fundingRate: rate };
    });

    const topPerformers = [...causePerformance]
      .sort((a, b) => b.fundingRate - a.fundingRate)
      .slice(0, 5);

    const leastPerformers = [...causePerformance]
      .filter(p => p.status === 'ACTIVE')
      .sort((a, b) => a.fundingRate - b.fundingRate)
      .slice(0, 5);

    // Category Stats
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { projects: true } },
        projects: {
          select: { raisedAmount: true, targetAmount: true }
        }
      }
    });

    const sectorStats = categories.map(cat => {
      const totalRaised = cat.projects.reduce((acc, p) => acc + p.raisedAmount, 0n);
      const totalTarget = cat.projects.reduce((acc, p) => acc + p.targetAmount, 0n);
      const avgFundingRate = totalTarget > 0n
        ? Number((totalRaised * 10000n) / totalTarget) / 100
        : 0;

      return {
        id: cat.id,
        name: cat.name,
        projectCount: cat._count.projects,
        volume: totalRaised.toString(),
        avgFundingRate
      };
    }).sort((a, b) => Number(b.volume) - Number(a.volume));

    return {
      overview: {
        grossInflow: inflowRes._sum.amount?.toString() || '0',
        committedCapital: donationRes._sum.amount?.toString() || '0',
        deployedCapital: disbursementRes._sum.amount?.toString() || '0',
        platformRevenue: platformRevenue.toString(),
        platformFees: totalFees.toString(),
        platformTips: totalTips.toString(),
        transactionCount: inflowRes._count,
      },
      performance: {
        topPerformers: topPerformers.map(p => ({ ...p, targetAmount: p.targetAmount.toString(), raisedAmount: p.raisedAmount.toString() })),
        leastPerformers: leastPerformers.map(p => ({ ...p, targetAmount: p.targetAmount.toString(), raisedAmount: p.raisedAmount.toString() })),
        mostFundedSectors: sectorStats.slice(0, 5),
        leastFundedSectors: [...sectorStats].reverse().slice(0, 5)
      }
    };
  }

  async exportFinancialsToCsv(query: AdminFinanceQueryDto) {
    const { startDate, endDate, categoryIds } = query;
    const dateFilter = {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    };

    const transactions = await this.prisma.walletTransaction.findMany({
      where: {
        ...dateFilter,
        donation: categoryIds && categoryIds.length > 0 ? { project: { categoryId: { in: categoryIds } } } : undefined
      },
      include: {
        wallet: { include: { user: { select: { email: true } } } },
        donation: { include: { project: { include: { category: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const flattened = transactions.map(tx => {
      const meta = tx.metadata as any;
      return {
        Timestamp: tx.createdAt.toISOString(),
        Reference: tx.reference,
        Type: tx.type,
        Financial_Category: tx.category,
        Amount: (Number(tx.amount) / 100).toFixed(2),
        Currency: tx.currency,
        Donor_Currency: meta?.donorCurrency || tx.currency,
        Donor_Amount: meta?.donorAmount || (Number(tx.amount) / 100).toFixed(2),
        FX_Rate: meta?.fxRate || '1.0',
        Status: tx.status,
        Donor: tx.wallet.user.email || meta?.guestEmail || 'N/A',
        Project_Category: tx.donation?.project?.category?.name || 'N/A',
        Cause: tx.donation?.project?.title || 'Unallocated Funds',
        Description: tx.description
      };
    });

    return flattened.length > 0 ? json2csv(flattened) : '';
  }

  // --- CATEGORY MANAGEMENT ---

  async createCategory(adminId: string, dto: { name: string; description?: string; icon?: string }) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          icon: dto.icon,
        }
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.CATEGORY_CREATED,
        entityId: category.id,
        entityType: 'Category',
        metadata: { name: category.name }
      }, tx);

      return category;
    });
  }

  async updateCategory(adminId: string, id: string, dto: { name?: string; description?: string; icon?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const data: any = { ...dto };
      if (dto.name) {
        data.slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      const category = await tx.category.update({
        where: { id },
        data
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.CATEGORY_UPDATED,
        entityId: category.id,
        entityType: 'Category',
        metadata: { updates: dto }
      }, tx);

      return category;
    });
  }

  async deleteCategory(adminId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { projects: true, proposals: true } }
      }
    });

    if (!category) throw new NotFoundException('Category not found');

    // Forensic Guard: Prevent deletion of categories with attached nodes
    if (category._count.projects > 0 || category._count.proposals > 0) {
      throw new BadRequestException(
        `Cannot delete category: It is currently linked to ${category._count.projects} projects and ${category._count.proposals} proposals.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.category.delete({ where: { id } });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.CATEGORY_DELETED,
        entityId: id,
        entityType: 'Category',
        metadata: { name: category.name }
      }, tx);

      return { success: true };
    });
  }

  async updateAwarenessStatus(id: string, adminId: string, status: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id }
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    const updated = await this.prisma.projectProposal.update({
      where: { id },
      data: { awarenessStatus: status }
    });

    await this.audit.log({
      userId: adminId,
      action: AuditAction.PROJECT_UPDATED,
      entityId: id,
      entityType: 'ProjectProposal',
      metadata: {
        action: 'UPDATE_AWARENESS_STATUS',
        newStatus: status
      }
    });

    return updated;
  }

  async createSubcategory(adminId: string, categoryId: string, dto: { name: string }) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    return this.prisma.$transaction(async (tx) => {
      const subcategory = await tx.subcategory.create({
        data: {
          name: dto.name,
          slug,
          categoryId,
        }
      });

      // We log this under CATEGORY_UPDATED to maintain the existing audit taxonomy
      await this.audit.log({
        userId: adminId,
        action: AuditAction.CATEGORY_UPDATED,
        entityId: categoryId,
        entityType: 'Category',
        metadata: { action: 'SUBCATEGORY_CREATED', name: subcategory.name }
      }, tx);

      return subcategory;
    });
  }

  async updateSubcategory(adminId: string, id: string, dto: { name: string }) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    return this.prisma.$transaction(async (tx) => {
      const subcategory = await tx.subcategory.update({
        where: { id },
        data: { name: dto.name, slug }
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.CATEGORY_UPDATED,
        entityId: subcategory.categoryId,
        entityType: 'Category',
        metadata: { action: 'SUBCATEGORY_MODIFIED', name: subcategory.name }
      }, tx);

      return subcategory;
    });
  }

  async deleteSubcategory(adminId: string, id: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        _count: { select: { projects: true, proposals: true } }
      }
    });

    if (!subcategory) throw new NotFoundException('Specific focus area not found');

    // Forensic Guard: Prevent deletion if attached to projects/proposals
    if (subcategory._count.projects > 0 || subcategory._count.proposals > 0) {
      throw new BadRequestException(
        `Cannot delete specific focus: It is currently linked to ${subcategory._count.projects} projects and ${subcategory._count.proposals} proposals.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.subcategory.delete({ where: { id } });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.CATEGORY_UPDATED,
        entityId: subcategory.categoryId,
        entityType: 'Category',
        metadata: { action: 'SUBCATEGORY_DELETED', name: subcategory.name }
      }, tx);

      return { success: true };
    });
  }

  /**
   * Fetch Nigerian Banks for Subaccount Vendor Routing
   */
  async getPaystackBanks() {
    try {
      const response = await axios.get('https://api.paystack.co/bank?currency=NGN', {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
        timeout: 5000,
      });
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch Paystack banks: ${error.message}`);
      throw new ServiceUnavailableException('Could not connect to payment gateway');
    }
  }

  /**
   * Generate a Vendor Subaccount on the fly and verify the bank details
   */
  async createPaystackSubaccount(adminId: string, data: { businessName: string; bankCode: string; accountNumber: string; vendorEmail?: string }) {
    try {
      const payload: any = {
        business_name: data.businessName,
        settlement_bank: data.bankCode,
        account_number: data.accountNumber,
        // We set 0 here because Givar dynamically injects the platform fee 
        // exactly in minor units (Kobo) at the transaction initialization layer.
        percentage_charge: 0,
      };

      // Inject the vendor email so Paystack automatically sends them settlement reports
      if (data.vendorEmail) {
        payload.primary_contact_email = data.vendorEmail;
      }

      const response = await axios.post(
        'https://api.paystack.co/subaccount',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const subaccountData = response.data.data;

      // Forensic Audit to prove an Admin created this specific routing node
      await this.audit.log({
        userId: adminId,
        action: AuditAction.PROJECT_UPDATED,
        entityType: 'Subaccount',
        metadata: {
          action: 'VENDOR_SUBACCOUNT_CREATED',
          vendorName: data.businessName,
          subaccountCode: subaccountData.subaccount_code,
          bankCode: data.bankCode,
          hasSettlementEmail: !!data.vendorEmail
        },
      });

      return {
        subaccount_code: subaccountData.subaccount_code,
        settlement_bank: subaccountData.settlement_bank,
        account_name: subaccountData.account_name, // Validated by Paystack NUBAN lookup
      };
    } catch (error: any) {
      this.logger.error('Failed to create Paystack subaccount', error.response?.data || error.message);

      const gatewayMsg = error.response?.data?.message || 'Could not verify vendor account details.';
      throw new BadRequestException(gatewayMsg);
    }
  }

  /**
   * Inject Paystack Subaccount Code & Vendor details directly into a Proposal
   * Creates a vendor on the fly if one does not exist for the budget item.
   */
  async bindProposalVendor(
    adminId: string,
    proposalId: string,
    budgetItemId: string,
    dto: { vendorId?: string; vendorName?: string; vendorEmail?: string; vendorPhone?: string; subaccountCode: string }
  ) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    const budget = (proposal.budgetBreakdown as any[]) || [];
    const vendors = (proposal.vendors as any[]) || [];

    const itemIndex = budget.findIndex(b => b.id === budgetItemId);
    if (itemIndex === -1) {
      throw new NotFoundException('Budget item not found within this proposal');
    }

    let targetVendorId = dto.vendorId;

    // 1. Create or Update Vendor Record
    if (!targetVendorId) {
      if (!dto.vendorName) throw new BadRequestException('Vendor name is required to register a new vendor');
      targetVendorId = randomUUID();
      vendors.push({
        id: targetVendorId,
        name: dto.vendorName,
        email: dto.vendorEmail || '',
        phone: dto.vendorPhone || '',
        subaccountCode: dto.subaccountCode
      });
    } else {
      const vIndex = vendors.findIndex(v => v.id === targetVendorId);
      if (vIndex === -1) throw new NotFoundException('Target vendor not found in registry');

      vendors[vIndex].subaccountCode = dto.subaccountCode;
      if (dto.vendorName) vendors[vIndex].name = dto.vendorName;
      if (dto.vendorEmail !== undefined) vendors[vIndex].email = dto.vendorEmail;
      if (dto.vendorPhone !== undefined) vendors[vIndex].phone = dto.vendorPhone;
    }

    // 2. Bind Vendor to Budget Item
    budget[itemIndex].vendorId = targetVendorId;

    const updated = await this.prisma.projectProposal.update({
      where: { id: proposalId },
      data: { budgetBreakdown: budget, vendors },
    });

    await this.audit.log({
      userId: adminId,
      action: AuditAction.PROJECT_UPDATED,
      entityId: proposalId,
      entityType: 'ProjectProposal',
      metadata: {
        action: 'BIND_VENDOR_AND_SUBACCOUNT',
        budgetItemId,
        vendorId: targetVendorId,
        subaccountCode: dto.subaccountCode
      }
    });

    return updated;
  }
}
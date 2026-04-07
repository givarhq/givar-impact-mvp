import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, ProposalStatus, AuditAction, Prisma, TxStatus, VerificationStatus, UserRole, AccountType, Currency, TxType, ProofStatus, TxCategory } from '@givar/database';
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
      wallets,
      projects,
      donations,
      suspenseCount,
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
      this.prisma.wallet.findMany({ select: { balance: true, currency: true } }),
      this.prisma.project.findMany({
        include: { category: true, _count: { select: { donations: true } } },
        where: { isActive: true }
      }),
      this.prisma.donation.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.walletTransaction.count({ where: { status: TxStatus.SUSPENSE } }),
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

    // 2. Financial Logic - Trend Calculation (Last 30 Days)
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

    // 3. User Distribution Analysis
    const [roleDist, typeDist, verificationStates] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
      this.prisma.user.groupBy({ by: ['accountType'], _count: true }),
      this.prisma.organizationProfile.groupBy({ by: ['status'], _count: true })
    ]);

    // 4. Project Performance Metrics
    const sortedByFunding = [...projects].sort((a, b) => Number(b.raisedAmount - a.raisedAmount)).slice(0, 5);
    const sortedByActivity = [...projects].sort((a, b) => b._count.donations - a._count.donations).slice(0, 5);

    // 5. Proposal Funnel Logic
    const proposalMap = new Map(proposalStats.map(p => [p.status, p._count]));
    const totalSubmitted = (proposalMap.get('SUBMITTED') || 0) + (proposalMap.get('UNDER_REVIEW') || 0) + (proposalMap.get('APPROVED') || 0) + (proposalMap.get('REJECTED') || 0);
    const totalApproved = proposalMap.get('APPROVED') || 0;

    // 6. Organization Logic
    const orgMap = new Map(organizationStats.map(o => [o.status, o._count]));

    // 7. Calculate Summaries
    const totalVolumeNGN = wallets
      .filter(w => w.currency === 'NGN')
      .reduce((acc, w) => acc + w.balance, 0n);

    const growth = prevUsers === 0 ? 100 : ((totalUsers - prevUsers) / prevUsers) * 100;

    // --- NEW: Dynamic Risk Analysis ---
    let dominantRisk = 'NONE';
    let riskCount = 0;
    let riskLabel = 'System healthy';

    if (suspenseCount > 0) {
      dominantRisk = 'LEDGER_SUSPENSE';
      riskCount = suspenseCount;
      riskLabel = 'Orphaned Transaction(s)';
    } else if (pendingKyc > 0) {
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
        unresolvedSuspenseCount: suspenseCount,
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
    const {
      search, status, categoryId,
      page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'desc',
      excludeDrafts,
      isSystem
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(status ? { status } : (excludeDrafts ? { status: { not: ProjectStatus.DRAFT } } : {})),
      ...(categoryId && { categoryId }),
      // Logic: If isSystem is true, filter projects owned by ADMIN or SUPERADMIN nodes
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
          user: { select: { role: true } } // Include role for UI identification
        },
        orderBy,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map(p => ({
        ...p,
        targetAmount: p.targetAmount.toString(),
        raisedAmount: p.raisedAmount.toString(),
        isGivarOfficial: p.user.role === UserRole.ADMIN || p.user.role === UserRole.SUPERADMIN
      })),
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

    // 1. Build Dynamic Filter
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

    // 2. Parallel execution for performance
    const [proposals, total] = await Promise.all([
      this.prisma.projectProposal.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.projectProposal.count({ where }),
    ]);

    // 3. Serialize
    return {
      data: proposals.map(p => ({
        ...p,
        targetAmount: p.targetAmount?.toString() || '0'
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

    // Sign video URL for Admin Review
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

    return proposal;
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

      // Auto-generate execution timeline from budget stages if none exists
      const budget = (proposal.budgetBreakdown as any[]) || [];
      let generatedTimeline = proposal.executionTimeline as any[];

      if (!generatedTimeline || generatedTimeline.length === 0) {
        const stages = [...new Set(budget.map(b => b.stage).filter(s => s && s.trim() !== ''))];
        if (stages.length > 0) {
          generatedTimeline = stages.map((stage, index) => ({
            id: `auto-stage-${index}`,
            phase: stage,
            estimatedDate: 'TBD',
            status: 'PENDING',
            deliverables: budget.filter(b => b.stage === stage).map(b => b.description || b.item).join(', '),
          }));
        }
      }

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
          currency: proposal.currency,
          imageUrl: proposal.coverImage,
          videoUrl: proposal.videoUrl,
          gallery: proposal.gallery || [],
          location: proposal.location,
          endDate: proposal.endDate,
          status: ProjectStatus.ACTIVE,
          categoryId: proposal.categoryId,
          tags: ['Verified'],
          isActive: true,
          budgetBreakdown: proposal.budgetBreakdown ?? [],
          executionTimeline: generatedTimeline ?? [],
          riskAnalysis: proposal.riskAnalysis,

          // Alignment Mappings
          beneficiaryName: proposal.beneficiaryName,
          beneficiaryAge: proposal.beneficiaryAge,
          beneficiaryRelationship: proposal.beneficiaryRelationship,
          vendorName: proposal.vendorName,
          vendorContactPerson: proposal.vendorContactPerson,
          vendorEmail: proposal.vendorEmail,
          vendorPhone: proposal.vendorPhone,
          vendorAddress: proposal.vendorAddress,
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
        project: project.title,
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

  async createProject(adminId: string, dto: CreateAdminProjectDto) {
    const slug = this.generateSlug(dto.title);

    const createData: Prisma.ProjectCreateInput = {
      title: dto.title,
      description: dto.description,
      shortDesc: dto.shortDesc,
      personalMessage: dto.personalMessage,
      location: dto.location,
      currency: dto.currency,
      imageUrl: dto.coverImage,
      slug: slug,
      targetAmount: BigInt(dto.targetAmount),
      raisedAmount: 0n,
      status: dto.status || ProjectStatus.ACTIVE,
      isActive: true, // Drafts are active records but hidden from public lists by status filter
      tags: dto.tags || ['Admin Created', 'Verified'],

      user: { connect: { id: adminId } },
      category: { connect: { id: dto.categoryId } },

      gallery: dto.gallery as unknown as Prisma.InputJsonValue,
      budgetBreakdown: dto.budgetBreakdown as unknown as Prisma.InputJsonValue,
      executionTimeline: dto.executionTimeline as unknown as Prisma.InputJsonValue,
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

    const newTarget = dto.targetAmount !== undefined ? BigInt(dto.targetAmount) : existing.targetAmount;
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
    if (dto.budgetBreakdown) updateData.budgetBreakdown = dto.budgetBreakdown as any;
    if (dto.executionTimeline) updateData.executionTimeline = dto.executionTimeline as any;

    const result = await this.prisma.$transaction(async (tx) => {
      // --- Surplus Liquidation ---
      if (isGoalChanging && existing.raisedAmount > newTarget) {
        const surplus = existing.raisedAmount - newTarget;

        // Find a secure system wallet (Admin/Superadmin) to hold orphaned capital
        const systemNode = await tx.user.findFirst({
          where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
          include: { wallets: { where: { currency: existing.currency } } }
        });

        if (systemNode?.wallets[0]) {
          await tx.walletTransaction.create({
            data: {
              walletId: systemNode.wallets[0].id,
              amount: surplus,
              currency: existing.currency,
              type: TxType.CREDIT,
              status: TxStatus.SUSPENSE,
              category: TxCategory.INTERNAL_TRANSFER,
              reference: `SURPLUS-${projectId.slice(0, 8)}-${Date.now()}`,
              description: `Surplus from goal reduction: ${existing.title}`,
              metadata: { originalProjectId: projectId, reason: 'GOAL_REDUCTION_OVERAGE' }
            }
          });

          // Sync raisedAmount to the new capped target
          updateData.raisedAmount = newTarget;
          this.logger.log(`Liquidated ${surplus} surplus from project ${projectId} to suspense.`);
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
      // Explicitly await the broadcast in the service layer to ensure it initiates correctly
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
    // 1. Fetch Project with relations and donation count
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { _count: { select: { donations: true } } }
    });

    if (!project) throw new NotFoundException('Project not found');

    // 2. Financial Integrity Guard
    // Hard-deletion is FORBIDDEN if the project has ever received money.
    if (project._count.donations > 0) {
      throw new ForbiddenException(
        'CRITICAL: This project has received donations. For financial audit integrity, it cannot be deleted. Use Suspend/Complete instead.'
      );
    }

    // 3. Collect S3 Keys for Purging
    const keysToPurge: string[] = [];

    // Check if coverImage is a key (not a full URL from previous hydration)
    // Note: Since our DB stores keys, we check if it starts with 'proposals/'
    if (project.imageUrl && !project.imageUrl.startsWith('http')) {
      keysToPurge.push(project.imageUrl);
    }

    // Extract keys from Gallery JSON
    if (project.gallery && Array.isArray(project.gallery)) {
      const gallery = project.gallery as any[];
      gallery.forEach(item => {
        if (item.url && !item.url.startsWith('http')) {
          keysToPurge.push(item.url);
        }
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // 4. Delete from Database
      const deleted = await tx.project.delete({ where: { id: projectId } });

      // 5. Audit Log
      await this.audit.log({
        userId: adminId,
        action: AuditAction.PROJECT_DELETED,
        entityId: projectId,
        entityType: 'Project',
        metadata: { title: deleted.title, purgedFileCount: keysToPurge.length },
      }, tx);

      // 6. Trigger S3 Purge (Best effort, non-blocking)
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
        _count: {
          select: { donations: true }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.imageUrl && !project.imageUrl.startsWith('http')) {
      const { viewUrl } = await this.storage.getPresignedViewUrl(project.imageUrl);
      project.imageUrl = viewUrl;
    }

    // Sign video URL for Admin Edit view
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

    return {
      ...project,
      targetAmount: project.targetAmount.toString(),
      raisedAmount: project.raisedAmount.toString(),
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
    skipProofCreation: boolean = false // Added parameter to prevent duplicate proofs during manual reviews
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        executionTimeline: true,
        title: true,
        slug: true,
        user: { select: { email: true, firstName: true } }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const timeline = (project.executionTimeline as any[]) || [];
    const milestoneIndex = timeline.findIndex(m => m.id === milestoneId);

    if (milestoneIndex === -1) {
      throw new BadRequestException('Milestone ID not found in project timeline');
    }

    const previousStatus = timeline[milestoneIndex].status;

    const updatedTimeline = [...timeline];
    updatedTimeline[milestoneIndex] = {
      ...updatedTimeline[milestoneIndex],
      status,
      imageUrl: dto.imageUrl || updatedTimeline[milestoneIndex].imageUrl,
      updatedAt: new Date().toISOString(),
      ...(status === 'COMPLETED' && { completedAt: new Date().toISOString() })
    };

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { executionTimeline: updatedTimeline as any },
    });

    await this.audit.log({
      userId: adminId,
      action: AuditAction.PROJECT_UPDATED,
      entityId: projectId,
      entityType: 'Project',
      metadata: {
        action: 'MILESTONE_UPDATE',
        milestone: updatedTimeline[milestoneIndex].phase,
        previousStatus,
        newStatus: status
      }
    });

    if (project.user) {
      this.emailService.sendOwnerMilestoneAlert(project.user.email, {
        name: project.user.firstName,
        project: project.title,
        milestone: updatedTimeline[milestoneIndex].phase,
        status: status.replace('_', ' '),
        projectId
      }).catch(err => this.logger.error(`Owner Milestone Email Failed: ${err.message}`));
    }

    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      await this.prisma.projectUpdate.create({
        data: {
          projectId,
          title: `Milestone Achieved: ${updatedTimeline[milestoneIndex].phase}`,
          content: `We are pleased to announce that the "${updatedTimeline[milestoneIndex].phase}" phase has been successfully completed. Deliverables verified: ${updatedTimeline[milestoneIndex].deliverables}.`,
          type: 'MILESTONE',
          imageUrl: dto.imageUrl || null
        }
      });

      // Logic: Auto-generate an approved proof to satisfy disbursement verification loops
      // for admin-owned projects executing the milestone directly.
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
        updatedTimeline[milestoneIndex].phase,
        signedProofUrl
      ).catch(err => this.logger.error(`Broadcast failed: ${err.message}`));
    }

    return updatedProject;
  }

  private async broadcastMilestoneUpdate(projectId: string, projectTitle: string, projectSlug: string, milestonePhase: string, imageUrl?: string) {
    // 1. Fetch Unique Registered Donors
    const userDonors = await this.prisma.donation.findMany({
      where: { projectId },
      select: { user: { select: { email: true, firstName: true, preferences: true } } },
      distinct: ['userId'],
    });

    // 2. Fetch Unique Guest Donors
    const guestDonors = await this.prisma.guestDonation.findMany({
      where: { projectId },
      select: { guestDonor: { select: { email: true, name: true } } },
      distinct: ['guestDonorId'],
    });

    // 3. Normalize into a single recipient list
    const recipients = [
      ...userDonors
        .filter(d => {
          const prefs = d.user?.preferences as any;
          return prefs?.milestoneUpdates !== false; // Default to true if null/missing
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

    // 4. Construct payload
    const frontendUrl = this.config.get('FRONTEND_URL');
    const projectUrl = `${frontendUrl}/explore/${projectSlug}`;
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    this.logger.log(`📢 Broadcasting Milestone: "${milestonePhase}" to ${recipients.length} donors.`);

    // 5. Batch Sending (Async)
    // allSettled ensures one bad email address doesn't stop the whole broadcast
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
      // Extract Paystack specific error message if available
      const message = error.response?.data?.message || error.message;
      this.logger.error(`Paystack Refund Failed: ${message}`);
      throw new BadRequestException(`Paystack Refund Failed: ${message}`);
    }
  }

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
            description: `${tx.description} [GATEWAY-REFUNDED]`
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

      // NEW: STRICT CAPACITY GUARD
      // Pre-validate all target projects to ensure we don't trap capital or overfund
      for (const split of dto.allocations) {
        const targetProj = await this.prisma.project.findUnique({
          where: { id: split.projectId }
        });

        if (!targetProj) throw new BadRequestException(`Project ${split.projectId} not found.`);

        const isClosed = ([ProjectStatus.COMPLETED, ProjectStatus.SUSPENDED] as ProjectStatus[]).includes(targetProj.status);
        if (isClosed) {
          throw new BadRequestException(`Cannot allocate to "${targetProj.title}" because it is already closed or suspended.`);
        }

        const remaining = targetProj.targetAmount - targetProj.raisedAmount;
        if (BigInt(split.amount) > remaining) {
          throw new BadRequestException(
            `Allocation to "${targetProj.title}" exceeds its remaining goal. It only needs ₦${(Number(remaining) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}. Please adjust your splits.`
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
            select: { title: true, id: true, userId: true, targetAmount: true, raisedAmount: true }
          });

          // Logic: Check Goal Completion
          const isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;
          if (isGoalMet) {
            await txPrisma.project.update({
              where: { id: updatedProject.id },
              data: { status: 'FUNDED', fundedAt: new Date() }
            });
          }

          // Logic: Notify Owner of Reallocation
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
          }

          // Forensic update: Log both raw and human-readable amounts
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
    const milestone = timeline.find(m => m.id === dto.milestoneId);

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
            milestone: milestone?.phase || 'Unknown',
            amount_naira: (Number(dto.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            hasReceipt: !!dto.receiptKey
          }
        }
      });

      // Automatically generate a public Project Update for the disbursement
      await tx.projectUpdate.create({
        data: {
          projectId,
          title: 'Funds Disbursed',
          content: `A payment of ${(Number(dto.amount) / 100).toLocaleString()} ${project.currency} has been securely disbursed to ${dto.vendorName} for the execution of the "${milestone?.phase || 'Current Phase'}" phase.`,
          type: 'FUNDS_DISBURSED',
          // Optionally link the receipt if it exists
          imageUrl: dto.receiptKey ? dto.receiptKey : null
        }
      });

      // Notify the organizer to provide proof of work for this disbursement
      await tx.notification.create({
        data: {
          userId: project.userId,
          type: 'MILESTONE_ALERT',
          title: 'Action required: Proof of work',
          content: `Funds disbursed to ${dto.vendorName} for "${milestone?.phase || 'Current Phase'}". Please upload evidence.`,
          link: `/dashboard/projects/${projectId}/manage#submit-evidence`
        }
      });

      return { disbursement, owner: project.user, milestoneName: milestone?.phase };
    }).then(async (res) => {
      await this.emailService.sendEvidenceRequest(res.owner.email, {
        name: res.owner.firstName,
        project: project.title,
        milestone: res.milestoneName || 'Current Phase',
        vendor: dto.vendorName
      }).catch(err => this.logger.error(`Evidence email failed: ${err.message}`));

      return res.disbursement;
    });
  }

  async getPendingProofs() {
    const proofs = await this.prisma.milestoneProof.findMany({
      include: {
        project: { select: { id: true, title: true, slug: true, executionTimeline: true } },
      },
      orderBy: { submittedAt: 'asc' }, // Queue: Oldest first
    });

    // Hydrate S3 keys with temporary view URLs
    return Promise.all(proofs.map(async (proof) => {
      const signedImages = await Promise.all(
        proof.imageKeys.map(key => this.storage.getPresignedViewUrl(key).then(r => r.viewUrl))
      );

      const timeline = (proof.project.executionTimeline as any[]) || [];
      const milestone = timeline.find(m => m.id === proof.milestoneId);

      return {
        ...proof,
        imageUrls: signedImages,
        phaseName: milestone?.phase || 'Unknown Phase',
        projectId: proof.project.id,
      };
    }));
  }

  /**
   * Review and Process Proof
   */
  async reviewMilestoneProof(
    adminId: string,
    proofId: string,
    status: 'APPROVED' | 'REJECTED',
    feedback?: string
  ) {
    const proof = await this.prisma.milestoneProof.findUnique({
      where: { id: proofId },
      include: { project: true }
    });

    if (!proof) throw new NotFoundException('Proof record not found');

    if (status === 'REJECTED') {
      const rejected = await this.prisma.milestoneProof.update({
        where: { id: proofId },
        data: {
          status: 'REJECTED',
          adminFeedback: feedback || 'Evidence provided does not satisfy milestone requirements.',
        }
      });

      await this.audit.log({
        userId: adminId,
        action: AuditAction.PROJECT_UPDATED,
        entityId: proof.projectId,
        entityType: 'MilestoneProof',
        metadata: { action: 'PROOF_REJECTED', proofId, feedback }
      });

      return rejected;
    }

    return this.prisma.$transaction(async (tx) => {
      await this.updateProjectMilestone(
        proof.projectId,
        proof.milestoneId,
        'COMPLETED',
        { status: 'COMPLETED', imageUrl: proof.imageKeys[0] },
        adminId,
        true // Ensure skipProofCreation is true so it doesn't generate a duplicate proof
      );

      return tx.milestoneProof.update({
        where: { id: proofId },
        data: {
          status: 'APPROVED',
          adminFeedback: 'Verified and approved by Givar Admin.',
        }
      });
    }, {
      timeout: 15000
    });
  }

  /**
   * Scalable Evidence Queue Fetcher
   * Supports pagination, project-based filtering, and status grouping.
   */
  async getEvidenceQueue(query: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
    search?: string;
    sort?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 15, projectId, status, search, sort = 'asc' } = query;
    const skip = (page - 1) * limit;

    // 1. Initialize the base where clause
    const where: Prisma.MilestoneProofWhereInput = {
      ...(projectId && { projectId }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { project: { title: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    if (status && status !== 'all') {
      where.status = status as any;
    } else if (!status) {
      where.status = 'PENDING';
    }

    const [proofs, total] = await Promise.all([
      this.prisma.milestoneProof.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: { select: { id: true, title: true, slug: true, executionTimeline: true } },
        },
        orderBy: { submittedAt: sort },
      }),
      this.prisma.milestoneProof.count({ where }),
    ]);

    const hydratedData = await Promise.all(
      proofs.map(async (proof) => {
        const signedImages = await Promise.all(
          proof.imageKeys.map((key) =>
            this.storage.getPresignedViewUrl(key).then((r) => r.viewUrl).catch(() => null)
          ),
        );

        const timeline = (proof.project.executionTimeline as any[]) || [];
        const milestone = timeline.find((m) => m.id === proof.milestoneId);

        return {
          ...proof,
          imageUrls: signedImages.filter(url => url !== null),
          phaseName: milestone?.phase || 'Unknown Phase',
        };
      }),
    );

    return {
      data: hydratedData,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
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
        Cause: tx.donation?.project?.title || 'System Top-up',
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
}
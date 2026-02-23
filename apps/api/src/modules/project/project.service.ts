import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectQueryDto, ProjectSort } from './dto/project-query.dto';
import { AuditAction, NotificationType, Prisma, ProjectStatus, UserRole } from '@givar/database';
import { SubmitMilestoneProofDto } from './dto/evidence.dto';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';

type ProjectMediaValue = {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
};

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private storage: StorageService,
    private emailService: EmailService
  ) { }

  async create(dto: CreateProjectDto) {
    const slug = this.generateSlug(dto.title);

    const galleryData: ProjectMediaValue[] = dto.gallery
      ? dto.gallery.map(item => ({
        url: item.url,
        type: item.type as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
        caption: item.caption
      }))
      : [];

    return this.prisma.project.create({
      data: {
        title: dto.title,
        slug,
        userId: dto.userId,
        description: dto.description,
        shortDesc: dto.shortDesc,
        imageUrl: dto.imageUrl,
        gallery: galleryData as Prisma.InputJsonValue,
        targetAmount: BigInt(dto.targetAmount),
        currency: dto.currency,
        categoryId: dto.categoryId,
        location: dto.location,
        tags: dto.tags || [],
        status: ProjectStatus.ACTIVE,
        isActive: true,
      },
    });
  }

  // Robust Search Engine
  async findAllAdvanced(query: ProjectQueryDto) {
    const { page = 1, limit = 9, search, category, status, sort } = query;
    const skip = (page - 1) * limit;

    // Logic: Fetch the global recommendation config to respect the "showFundedProjects" toggle
    // even when users bypass the smart feed using manual search/filters.
    const config = await this.prisma.recommendationConfig.findUnique({ where: { id: 'default' } });
    const showFunded = config?.showFundedProjects ?? false;

    // Determine allowed statuses based on the admin config
    const baseStatuses = showFunded
      ? [ProjectStatus.ACTIVE, ProjectStatus.FUNDED, ProjectStatus.COMPLETED]
      : [ProjectStatus.ACTIVE];

    // 1. Dynamic Filter Construction
    const where: Prisma.ProjectWhereInput = {
      status: { in: baseStatuses },
      isActive: true,
      ...(status && { status }), // If user explicitly passes a status, it overrides
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // 2. Dynamic Sorting
    let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case ProjectSort.OLDEST: orderBy = { createdAt: 'asc' }; break;
      case ProjectSort.MOST_FUNDED: orderBy = { raisedAmount: 'desc' }; break;
      case ProjectSort.ENDING_SOON: orderBy = { endDate: 'asc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    // 3. Execution
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          _count: { select: { donations: true } },
          user: {
            select: {
              role: true,
              organization: { select: { status: true, legalName: true } }
            }
          }
        }
      }),
      this.prisma.project.count({ where }),
    ]);

    // 4. Data Transformation
    const data = await Promise.all(projects.map(async (p) => {
      const hydrated = await this.storage.hydrateEntityMedia(p);
      const raised = Number(hydrated.raisedAmount || 0n);
      const target = Number(hydrated.targetAmount || 0n);

      const isSystemProject = p.user?.role === 'ADMIN' || p.user?.role === 'SUPERADMIN';

      return {
        ...hydrated,
        targetAmount: hydrated.targetAmount.toString(),
        raisedAmount: hydrated.raisedAmount.toString(),
        percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
        categoryName: hydrated.category?.name,
        categorySlug: hydrated.category?.slug,
        isVerifiedOrganizer: isSystemProject ? true : p.user?.organization?.status === 'VERIFIED',
        organizerName: isSystemProject ? 'Givar' : (p.user?.organization?.legalName || 'Individual'),
        isGivarOfficial: isSystemProject
      };
    }));

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // Single Project Detail Fetcher
  async findOneWithUpdates(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        category: true,
        updates: { orderBy: { createdAt: 'desc' } },
        user: {
          select: {
            role: true,
            organization: { select: { status: true, legalName: true, verifiedAt: true } }
          }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const hydrated = await this.storage.hydrateEntityMedia(project);

    // Count donors
    const [userDonors, guestDonors] = await Promise.all([
      this.prisma.donation.groupBy({ by: ['userId'], where: { projectId: project.id } }),
      this.prisma.guestDonation.groupBy({ by: ['guestDonorId'], where: { projectId: project.id } })
    ]);
    const donorCount = userDonors.length + guestDonors.length;

    const isSystemProject = project.user?.role === 'ADMIN' || project.user?.role === 'SUPERADMIN';

    return {
      ...hydrated,
      targetAmount: hydrated.targetAmount.toString(),
      raisedAmount: hydrated.raisedAmount.toString(),
      percentFunded: Number(hydrated.targetAmount) > 0 ? Math.min(100, Math.round((Number(hydrated.raisedAmount) / Number(hydrated.targetAmount)) * 100)) : 0,
      donorCount,
      isVerifiedOrganizer: isSystemProject ? true : hydrated.user?.organization?.status === 'VERIFIED',
      organizerName: isSystemProject ? 'Givar' : (hydrated.user?.organization?.legalName || 'Individual'),
      isGivarOfficial: isSystemProject
    };
  }

  async update(id: string, dto: UpdateProjectDto) {
    try {
      return await this.prisma.project.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      throw new NotFoundException('Project not found');
    }
  }

  async remove(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { isActive: false, status: ProjectStatus.SUSPENDED },
    });
  }

  async getPlatformStats() {
    const aggregate = await this.prisma.project.aggregate({
      _sum: { raisedAmount: true },
      where: { isActive: true },
    });

    const latestDonation = await this.prisma.donation.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { title: true } } }
    });

    return {
      totalVolume: aggregate._sum.raisedAmount || 0n,
      latestDonation: latestDonation ? {
        projectTitle: latestDonation.project.title,
        amount: latestDonation.amount,
        createdAt: latestDonation.createdAt
      } : null
    };
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  private generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
  }

  async submitMilestoneProof(userId: string, projectId: string, dto: SubmitMilestoneProofDto) {
    // 1. Security: Verify Ownership
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { proposalId: projectId }
        ]
      },
      select: { id: true, userId: true, title: true, executionTimeline: true }
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    // 2. Validate Milestone ID exists in this project
    const timeline = (project.executionTimeline as any[]) || [];
    const milestone = timeline.find(m => m.id === dto.milestoneId);
    if (!milestone) throw new BadRequestException('Invalid milestone ID');

    // 3. Atomic Transaction for Proof and Notifications
    return this.prisma.$transaction(async (tx) => {
      const proof = await tx.milestoneProof.create({
        data: {
          projectId: project.id,
          milestoneId: dto.milestoneId,
          description: dto.description,
          imageKeys: dto.imageKeys,
        }
      });

      // Logic: Fetch all admins to generate in-app alerts
      const admins = await tx.user.findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
        select: { id: true }
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'MILESTONE_ALERT' as NotificationType,
            title: 'New proof of work',
            content: `Evidence has been submitted for "${project.title}" (${milestone.phase}).`,
            link: '/admin/verifications?tab=evidence'
          }))
        });
      }

      await this.audit.log({
        userId,
        action: AuditAction.MILESTONE_PROOF_SUBMITTED,
        entityId: project.id,
        entityType: 'MilestoneProof',
        metadata: {
          milestone: milestone.phase,
          proofId: proof.id,
          imageCount: dto.imageKeys.length
        }
      }, tx);

      return { proof, projectTitle: project.title, phase: milestone.phase };
    }).then(async (res) => {
      // 4. Trigger External Broadcast to Admin Emails
      this.emailService.sendAdminEvidenceAlert({
        projectTitle: res.projectTitle,
        milestonePhase: res.phase
      }).catch(err => this.logger.error(`Admin Evidence Email Failed: ${err.message}`));

      return res.proof;
    });
  }

  /**
   * Secure Project Management Data Fetcher
   * Includes private execution data and enforces IDOR protection.
   */
  async getProjectForOwner(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        userId: userId,
        OR: [
          { id: id },
          { proposalId: id }
        ]
      },
      include: {
        category: true,
        disbursements: {
          orderBy: { createdAt: 'desc' },
        },
        milestoneProofs: {
          orderBy: { submittedAt: 'desc' },
          select: {
            id: true,
            milestoneId: true,
            description: true,
            imageKeys: true,
            status: true,
            adminFeedback: true,
            submittedAt: true,
            updatedAt: true,
          }
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Security Guard: Prevent IDOR (Insecure Direct Object Reference)
    if (project.userId !== userId) {
      await this.audit.log({
        userId,
        action: AuditAction.USER_LOGIN_FAILED,
        metadata: { reason: 'Unauthorized project management access', projectId: project.id }
      });
      throw new ForbiddenException('You do not have permission to manage this project');
    }

    const disbursementsWithStatus = project.disbursements.map((d) => {
      const latestProof = project.milestoneProofs.find(p => p.milestoneId === d.milestoneId);

      let satisfactionStatus: 'ACTION_REQUIRED' | 'AUDITING' | 'VERIFIED' = 'ACTION_REQUIRED';

      if (latestProof) {
        if (latestProof.status === 'APPROVED') satisfactionStatus = 'VERIFIED';
        else if (latestProof.status === 'PENDING') satisfactionStatus = 'AUDITING';
      }

      return {
        ...d,
        amount: d.amount.toString(),
        satisfactionStatus,
        adminFeedback: latestProof?.status === 'REJECTED' ? latestProof.adminFeedback : null
      };
    });

    return {
      ...project,
      targetAmount: project.targetAmount.toString(),
      raisedAmount: project.raisedAmount.toString(),
      disbursements: disbursementsWithStatus,
    };
  }

  /**
   * User-Scoped Global Search
   * Searches public projects + user-specific private data (proposals, transactions, etc.)
   * Scoped to the specific userId to prevent data leakage.
   */
  async userGlobalSearch(userId: string, query: string) {
    if (!query || query.trim().length < 2) return null;

    const searchTerm = query.trim();
    const textFilter = { contains: searchTerm, mode: 'insensitive' as const };

    // Find valid Enum values for AuditAction that match the search string 
    // to avoid the PrismaClientValidationError on Enum fields.
    const matchedActions = Object.values(AuditAction).filter((a) =>
      a.toLowerCase().includes(searchTerm.toLowerCase()),
    ) as AuditAction[];

    const [projects, proposals, transactions, subscriptions, auditLogs] = await Promise.all([
      // 1. All Active Projects (Public Discovery)
      this.prisma.project.findMany({
        where: {
          status: ProjectStatus.ACTIVE,
          isActive: true,
          OR: [
            { title: textFilter },
            { description: textFilter },
            { location: textFilter },
          ],
        },
        take: 5,
        select: { id: true, title: true, slug: true, currency: true, raisedAmount: true, targetAmount: true },
      }),

      // 2. User's Own Proposals (Private Scope)
      this.prisma.projectProposal.findMany({
        where: {
          userId,
          OR: [
            { title: textFilter },
            { shortDesc: textFilter }
          ],
        },
        take: 5,
        select: { id: true, title: true, status: true },
      }),

      // 3. User's Own Wallet Transactions (Private Scope)
      this.prisma.walletTransaction.findMany({
        where: {
          wallet: { userId },
          OR: [
            { reference: textFilter },
            { description: textFilter }
          ],
        },
        take: 5,
        select: { id: true, reference: true, amount: true, currency: true, createdAt: true, description: true },
      }),

      // 4. User's Own Subscriptions (Private Scope)
      this.prisma.subscription.findMany({
        where: {
          userId,
          project: { title: textFilter },
        },
        take: 3,
        include: { project: { select: { title: true, slug: true } } },
      }),

      // 5. User's Own Audit Logs (Excludes simple logins, filtered by Enum match)
      this.prisma.auditLog.findMany({
        where: {
          userId,
          action: { not: AuditAction.USER_LOGIN },
          OR: [
            ...(matchedActions.length > 0 ? [{ action: { in: matchedActions } }] : []),
            { entityType: textFilter },
          ],
        },
        take: 5,
        select: { id: true, action: true, createdAt: true },
      }),
    ]);

    // 6. Navigation Shortcuts (Client-side virtual results)
    const nav: any[] = [];
    const q = searchTerm.toLowerCase();
    if ('profile'.includes(q)) nav.push({ label: 'Edit Profile', path: '/dashboard/settings?tab=profile' });
    if ('security password 2fa'.includes(q)) nav.push({ label: 'Security & Password', path: '/dashboard/settings?tab=security' });
    if ('wallet fund deposit'.includes(q)) nav.push({ label: 'Fund Wallet', path: '/dashboard/wallet/fund' });
    if ('subscription recurring'.includes(q)) nav.push({ label: 'Manage Subscriptions', path: '/dashboard/subscriptions' });
    if ('history ledger'.includes(q)) nav.push({ label: 'Transaction History', path: '/dashboard/history' });

    return {
      projects,
      proposals,
      transactions,
      subscriptions,
      auditLogs,
      navigation: nav,
    };
  }
}
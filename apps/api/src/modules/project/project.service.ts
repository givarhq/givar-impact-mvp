// ... existing imports ...
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectQueryDto, ProjectSort } from './dto/project-query.dto';
import { AuditAction, NotificationType, Prisma, ProjectStatus, UserRole } from '@givar/database';
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
    const { page = 1, limit = 9, search, category, subcategory, status, sort } = query;
    const skip = (page - 1) * limit;

    const config = await this.prisma.recommendationConfig.findUnique({ where: { id: 'default' } });
    const showFunded = config?.showFundedProjects ?? false;

    const baseStatuses = showFunded
      ? [ProjectStatus.ACTIVE, ProjectStatus.FUNDED, ProjectStatus.COMPLETED]
      : [ProjectStatus.ACTIVE];

    // 1. Dynamic Filter Construction
    const where: Prisma.ProjectWhereInput = {
      status: { in: baseStatuses },
      isActive: true,
      ...(status && { status }),
      ...(category && { category: { slug: category } }),
      ...(subcategory && { subcategory: { slug: subcategory } }), // <-- NEW: Apply subcategory filter
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case ProjectSort.OLDEST: orderBy = { createdAt: 'asc' }; break;
      case ProjectSort.MOST_FUNDED: orderBy = { raisedAmount: 'desc' }; break;
      case ProjectSort.ENDING_SOON: orderBy = { endDate: 'asc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          subcategory: { select: { name: true } },
          _count: { select: { donations: true } },
          user: {
            select: {
              role: true,
              organization: { select: { status: true, legalName: true, kycType: true } }
            }
          }
        }
      }),
      this.prisma.project.count({ where }),
    ]);

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
        subcategoryName: hydrated.subcategory?.name,
        isVerifiedOrganizer: isSystemProject ? true : p.user?.organization?.status === 'VERIFIED',
        organizerName: isSystemProject ? 'Givar' : (p.user?.organization?.legalName || 'Individual'),
        organizerType: isSystemProject ? 'SYSTEM' : (p.user?.organization?.kycType || 'INDIVIDUAL'),
        isGivarOfficial: isSystemProject
      };
    }));

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  // Single Project Detail Fetcher
  async findOneWithUpdates(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        category: true,
        subcategory: true, // <-- NEW: Fetch subcategory
        updates: { orderBy: { createdAt: 'desc' } },
        user: {
          select: {
            role: true,
            organization: { select: { status: true, legalName: true, verifiedAt: true, kycType: true } }
          }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const hydrated = await this.storage.hydrateEntityMedia(project);

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
      subcategoryName: hydrated.subcategory?.name, // <-- NEW: Map subcategory
      isVerifiedOrganizer: isSystemProject ? true : hydrated.user?.organization?.status === 'VERIFIED',
      organizerName: isSystemProject ? 'Givar' : (hydrated.user?.organization?.legalName || 'Individual'),
      organizerType: isSystemProject ? 'SYSTEM' : (hydrated.user?.organization?.kycType || 'INDIVIDUAL'),
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

    const latestDonations = await this.prisma.donation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            title: true,
            targetAmount: true,
            raisedAmount: true
          }
        }
      }
    });

    return {
      totalVolume: aggregate._sum.raisedAmount || 0n,
      latestDonations: latestDonations.map(d => ({
        projectTitle: d.project.title,
        amount: d.amount.toString(),
        raised: d.project.raisedAmount.toString(),
        target: d.project.targetAmount.toString(),
        createdAt: d.createdAt
      }))
    };
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        // Hydrate the associated subcategories for the cascading UI
        subcategories: {
          orderBy: { name: 'asc' }
        }
      }
    });
  }

  private generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
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
      // Under the new offline admin-verification architecture, a proof is uploaded
      // directly by the admin upon verification. If it exists, the phase is verified.
      const latestProof = project.milestoneProofs.find(p => p.milestoneId === d.milestoneId);

      let satisfactionStatus: 'PENDING_VERIFICATION' | 'VERIFIED' = 'PENDING_VERIFICATION';

      if (latestProof && latestProof.status === 'APPROVED') {
        satisfactionStatus = 'VERIFIED';
      }

      return {
        ...d,
        amount: d.amount.toString(),
        satisfactionStatus,
        adminFeedback: null
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

    const matchedActions = Object.values(AuditAction).filter((a) =>
      a.toLowerCase().includes(searchTerm.toLowerCase()),
    ) as AuditAction[];

    // --- GHOST FIX: Removed the costly Subscription database query entirely ---
    const [projects, proposals, transactions, auditLogs] = await Promise.all([
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
      this.prisma.projectProposal.findMany({
        where: {
          userId,
          OR: [{ title: textFilter }, { shortDesc: textFilter }],
        },
        take: 5,
        select: { id: true, title: true, status: true, category: { select: { name: true } } }
      }),
      this.prisma.walletTransaction.findMany({
        where: {
          wallet: { userId },
          OR: [{ reference: textFilter }, { description: textFilter }],
        },
        take: 5,
        select: { id: true, reference: true, amount: true, currency: true, createdAt: true, description: true },
      }),
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

    const nav: any[] = [];
    const q = searchTerm.toLowerCase();
    if ('profile'.includes(q)) nav.push({ label: 'Edit Profile', path: '/dashboard/settings?tab=profile' });
    if ('security password 2fa'.includes(q)) nav.push({ label: 'Security & Password', path: '/dashboard/settings?tab=security' });
    if ('history ledger'.includes(q)) nav.push({ label: 'Transaction History', path: '/dashboard/history' });
    if ('support help contact'.includes(q)) nav.push({ label: 'Contact Support', path: '/contact' });

    return {
      projects,
      proposals,
      transactions,
      auditLogs,
      navigation: nav,
    };
  }


  /**
   * Public Ledger Aggregation Engine
   * Unifies platform-wide or project-specific capital flow with masked identities.
   */
  async getProjectLedger(slug: string | null, query: { page?: number; limit?: number; type?: string; requestingUserId?: string }) {
    const { page = 1, limit = 15, type = 'all', requestingUserId } = query;
    const skip = (page - 1) * limit;

    let projectTitleContext = 'Platform-Wide';
    let targetProjectId: string | undefined = undefined;

    if (slug) {
      const project = await this.prisma.project.findUnique({
        where: { slug },
        select: { id: true, title: true }
      });
      if (!project) throw new NotFoundException('Project not found');
      targetProjectId = project.id;
      projectTitleContext = project.title;
    }

    const fetchInflows = type === 'all' || type === 'INFLOW';
    const fetchOutflows = type === 'all' || type === 'OUTFLOW';

    const donationWhere: Prisma.DonationWhereInput = targetProjectId ? { projectId: targetProjectId } : {};
    const guestDonationWhere: Prisma.GuestDonationWhereInput = targetProjectId ? { projectId: targetProjectId, status: 'COMPLETED' } : { status: 'COMPLETED' };
    const disbursementWhere: Prisma.DisbursementWhereInput = targetProjectId ? { projectId: targetProjectId } : {};

    const [donations, guestDonations, disbursements, countD, countG, countDisp] = await Promise.all([
      fetchInflows ? this.prisma.donation.findMany({
        where: donationWhere,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { title: true, slug: true } },
          transaction: { select: { reference: true, metadata: true } } // <-- Added metadata to extract phaseName
        },
        orderBy: { createdAt: 'desc' },
        take: skip + limit
      }) : Promise.resolve([]),
      fetchInflows ? this.prisma.guestDonation.findMany({
        where: guestDonationWhere,
        include: { guestDonor: { select: { name: true } }, project: { select: { title: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        take: skip + limit
      }) : Promise.resolve([]),
      fetchOutflows ? this.prisma.disbursement.findMany({
        where: disbursementWhere,
        include: { project: { select: { title: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        take: skip + limit
      }) : Promise.resolve([]),
      fetchInflows ? this.prisma.donation.count({ where: donationWhere }) : Promise.resolve(0),
      fetchInflows ? this.prisma.guestDonation.count({ where: guestDonationWhere }) : Promise.resolve(0),
      fetchOutflows ? this.prisma.disbursement.count({ where: disbursementWhere }) : Promise.resolve(0),
    ]);

    const maskName = (firstName?: string | null, lastName?: string | null, fullName?: string | null) => {
      if (firstName && lastName) return `${firstName[0]}*** ${lastName[0]}.`;
      if (fullName) {
        const parts = fullName.trim().split(' ');
        if (parts.length > 1) return `${parts[0][0]}*** ${parts[1][0]}.`;
        return `${fullName[0]}***`;
      }
      return 'Anonymous Supporter';
    };

    const entries: any[] = [];

    donations.forEach(d => {
      const isRequester = requestingUserId && d.userId === requestingUserId;
      entries.push({
        id: d.id,
        type: 'INFLOW',
        amount: (d.baseAmount > 0n ? d.baseAmount : d.amount).toString(), // Fallback fix
        currency: d.currency,
        reference: d.transaction?.reference || d.transactionId,
        createdAt: d.createdAt,
        actorName: isRequester ? `${d.user?.firstName} ${d.user?.lastName}` : maskName(d.user?.firstName, d.user?.lastName),
        isYou: isRequester,
        projectName: d.project.title,
        projectSlug: d.project.slug,
        phaseName: (d.transaction?.metadata as any)?.phaseName || null // <-- Expose Phase Name
      });
    });

    guestDonations.forEach(d => entries.push({
      id: d.id,
      type: 'INFLOW',
      amount: (d.baseAmount > 0n ? d.baseAmount : d.amount).toString(),
      currency: d.currency,
      reference: d.reference,
      createdAt: d.createdAt,
      actorName: maskName(null, null, d.guestDonor?.name),
      projectName: d.project.title,
      projectSlug: d.project.slug,
      phaseName: d.message?.startsWith('Phase') ? d.message : null // <-- Parse Phase Name from message field
    }));

    disbursements.forEach(d => entries.push({
      id: d.id,
      type: 'OUTFLOW',
      amount: d.amount.toString(),
      currency: d.currency,
      reference: d.reference,
      createdAt: d.createdAt,
      actorName: d.vendorName,
      receiptKey: d.receiptKey,
      projectName: d.project.title,
      projectSlug: d.project.slug
    }));

    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paginatedData = entries.slice(skip, skip + limit);
    return { data: paginatedData, meta: { total: countD + countG + countDisp, page, lastPage: Math.ceil((countD + countG + countDisp) / limit) || 1, context: projectTitleContext } };
  }

  async joinWaitlist(projectId: string, email: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { waitlistEmails: true }
    });

    if (!project) throw new NotFoundException('Project not found');

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent duplicates
    if (project.waitlistEmails.includes(normalizedEmail)) {
      return { success: true, message: 'Already on waitlist' };
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        waitlistEmails: { push: normalizedEmail }
      }
    });

    return { success: true };
  }
}
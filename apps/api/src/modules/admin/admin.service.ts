import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, ProposalStatus, AuditAction, Prisma } from '@givar/database';
import { StorageService } from '../storage/storage.service';
import { CreateAdminProjectDto, UpdateAdminProjectDto } from './dto/admin-project.dto';
import { WalletService } from '../wallet/wallet.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
    private walletService: WalletService,
  ) {}

  // Dashboard Stats
  async getDashboardStats() {
    const [totalUsers, totalProjects, totalDonations, totalVolume] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.donation.count(),
      this.prisma.project.aggregate({ _sum: { raisedAmount: true } })
    ]);

    return {
      users: totalUsers,
      projects: totalProjects,
      donations: totalDonations,
      volume: totalVolume._sum.raisedAmount || 0n
    };
  }

  async getAllProjects(query: any) {
    const { page = 1, limit = 20 } = query;
    return this.prisma.project.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { donations: true } } }
    });
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
      status: status ? status : { not: ProposalStatus.DRAFT },
      
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
      include: { category: true },
    });

    if (!proposal || (proposal.status !== ProposalStatus.SUBMITTED && proposal.status !== ProposalStatus.UNDER_REVIEW)) {
      throw new BadRequestException('Proposal is not in a submittable state for approval');
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          userId: proposal.userId,
          title: proposal.title!,
          slug: this.generateSlug(proposal.title!),
          description: proposal.description!,
          shortDesc: proposal.shortDesc,
          targetAmount: proposal.targetAmount!,
          currency: proposal.currency,
          imageUrl: proposal.coverImage,
          gallery: proposal.gallery || [],
          location: proposal.location,
          status: ProjectStatus.ACTIVE,
          categoryId: proposal.categoryId,
          tags: ['Verified'],
          isActive: true,
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
          metadata: { proposalId: proposal.id, title: project.title },
        },
      });

      return project;
    });
  }

  async rejectProposal(id: string, adminId: string, feedback: string) {
    return this.prisma.projectProposal.update({
      where: { id },
      data: {
        status: ProposalStatus.REJECTED,
        adminFeedback: feedback,
        reviewedBy: adminId,
      },
    });
  }

  async requestChanges(id: string, adminId: string, feedback: string) {
    const proposal = await this.prisma.projectProposal.update({
      where: { id },
      data: {
        status: ProposalStatus.CHANGES_REQUESTED,
        adminFeedback: feedback,
        reviewedBy: adminId,
      },
    });

    await this.prisma.auditLog.create({
        data: {
            userId: adminId,
            action: AuditAction.PROJECT_UPDATED,
            entityId: id,
            entityType: 'ProjectProposal',
            metadata: { action: 'REQUEST_CHANGES', feedback }
        }
    });

    return proposal;
  }

  private generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
  }

  // User Management
  async getAllUsers(page = 1, limit = 20) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, emailVerified: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProject(adminId: string, dto: CreateAdminProjectDto) {
    const slug = this.generateSlug(dto.title);
    
    const createData: Prisma.ProjectCreateInput = {
      title: dto.title,
      description: dto.description,
      shortDesc: dto.shortDesc,
      location: dto.location,
      currency: dto.currency,
      imageUrl: dto.coverImage,
      slug: slug,
      targetAmount: BigInt(dto.targetAmount * 100),
      raisedAmount: 0n,
      status: ProjectStatus.ACTIVE,
      isActive: true,
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
          metadata: { title: project.title, method: 'ADMIN_DIRECT' },
        },
      });

      return project;
    });
  }

  async updateProject(adminId: string, projectId: string, dto: UpdateAdminProjectDto) {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundException('Project not found');

    const updateData: Prisma.ProjectUpdateInput = {
      title: dto.title,
      description: dto.description,
      shortDesc: dto.shortDesc,
      location: dto.location,
      currency: dto.currency,
      imageUrl: dto.coverImage,
      status: dto.status,
      isActive: dto.isActive,
      tags: dto.tags,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };

    if (dto.targetAmount) {
      updateData.targetAmount = BigInt(dto.targetAmount * 100);
    }

    if (dto.categoryId) {
      updateData.category = { connect: { id: dto.categoryId } };
    }

    if (dto.gallery) {
      updateData.gallery = dto.gallery as unknown as Prisma.InputJsonValue;
    }
    if (dto.budgetBreakdown) {
      updateData.budgetBreakdown = dto.budgetBreakdown as unknown as Prisma.InputJsonValue;
    }
    if (dto.executionTimeline) {
      updateData.executionTimeline = dto.executionTimeline as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.PROJECT_UPDATED,
          entityId: projectId,
          entityType: 'Project',
          metadata: { fieldsUpdated: Object.keys(dto) },
        },
      });

      return project;
    });
  }

  // Hard Delete (Nuclear Option)
  async deleteProject(adminId: string, projectId: string) {
    // Check for donations first
    const donationCount = await this.prisma.donation.count({ where: { projectId } });
    if (donationCount > 0) {
        throw new ForbiddenException('Cannot delete a project that has received donations. Suspend it instead.');
    }

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.project.delete({ where: { id: projectId } });
      
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.PROJECT_DELETED,
          entityId: projectId,
          entityType: 'Project',
          metadata: { title: deleted.title },
        },
      });
      
      return deleted;
    });
  }

  async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { category: true }
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.imageUrl && !project.imageUrl.startsWith('http')) {
      const { viewUrl } = await this.storage.getPresignedViewUrl(project.imageUrl);
      project.imageUrl = viewUrl;
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
    });

    // High-priority Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: AuditAction.RECONCILIATION_PERFORMED,
        entityId: reference,
        entityType: 'LedgerCorrection',
        metadata: { reference, adminId, result },
      },
    });

    return result;
  }
}
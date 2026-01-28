import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, ProposalStatus, AuditAction, Prisma } from '@givar/database';
import { StorageService } from '../storage/storage.service';
import { CreateAdminProjectDto, UpdateAdminProjectDto } from './dto/admin-project.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
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

    // Transform Major -> Minor units for DB
    const targetAmountMinor = BigInt(dto.targetAmount * 100);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          userId: adminId, // Admin is the "Owner" initially
          title: dto.title,
          slug,
          description: dto.description,
          shortDesc: dto.shortDesc,
          categoryId: dto.categoryId,
          location: dto.location,
          targetAmount: targetAmountMinor,
          raisedAmount: 0n,
          currency: dto.currency,
          imageUrl: dto.coverImage,
          gallery: dto.gallery as any, // Cast JSON
          status: ProjectStatus.ACTIVE,
          isActive: true,
          tags: dto.tags || ['Admin Created', 'Verified'],
        },
      });

      // Audit
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

  // Direct Project Update
  async updateProject(adminId: string, projectId: string, dto: UpdateAdminProjectDto) {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundException('Project not found');

    const updateData: any = { ...dto };
    if (dto.targetAmount) updateData.targetAmount = BigInt(dto.targetAmount * 100);
    
    // Remove complex fields if they are undefined to avoid overwriting with null
    if (!dto.gallery) delete updateData.gallery;

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
      include: {
        category: true,
        _count: { select: { donations: true } }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    return {
      ...project,
      targetAmount: project.targetAmount.toString(),
      raisedAmount: project.raisedAmount.toString(),
    };
  }
}
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectQueryDto, ProjectSort } from './dto/project-query.dto';
import { AuditAction, Prisma, ProjectStatus } from '@givar/database';
import { SubmitMilestoneProofDto } from './dto/evidence.dto';
import { AuditService } from '../audit/audit.service';

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

    // 1. Dynamic Filter Construction
    const where: Prisma.ProjectWhereInput = {
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.FUNDED, ProjectStatus.COMPLETED] },
      isActive: true,
      ...(status && { status }),
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
    const data = projects.map((p) => {
      const raised = Number(p.raisedAmount || 0n);
      const target = Number(p.targetAmount || 0n);

      const isSystemProject = p.user?.role === 'ADMIN';

      return {
        ...p,
        targetAmount: p.targetAmount.toString(),
        raisedAmount: p.raisedAmount.toString(),
        percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
        categoryName: p.category?.name,
        categorySlug: p.category?.slug,
        isVerifiedOrganizer: isSystemProject ? true : p.user?.organization?.status === 'VERIFIED',
        organizerName: isSystemProject ? 'Givar' : (p.user?.organization?.legalName || 'Individual'),
        isGivarOfficial: isSystemProject
      };
    });

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

    // Count donors
    const [userDonors, guestDonors] = await Promise.all([
      this.prisma.donation.groupBy({ by: ['userId'], where: { projectId: project.id } }),
      this.prisma.guestDonation.groupBy({ by: ['guestDonorId'], where: { projectId: project.id } })
    ]);
    const donorCount = userDonors.length + guestDonors.length;

    const isSystemProject = project.user?.role === 'ADMIN';

    return {
      ...project,
      targetAmount: project.targetAmount.toString(),
      raisedAmount: project.raisedAmount.toString(),
      percentFunded: Number(project.targetAmount) > 0 ? Math.min(100, Math.round((Number(project.raisedAmount) / Number(project.targetAmount)) * 100)) : 0,
      donorCount,
      isVerifiedOrganizer: isSystemProject ? true : project.user?.organization?.status === 'VERIFIED',
      organizerName: isSystemProject ? 'Givar' : (project.user?.organization?.legalName || 'Individual'),
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
    // 3. Create the Proof Record
    return this.prisma.$transaction(async (tx) => {
      const proof = await tx.milestoneProof.create({
        data: {
          projectId: project.id,  // Use resolved project ID
          milestoneId: dto.milestoneId,
          description: dto.description,
          imageKeys: dto.imageKeys,
        }
      });
      // 4. Audit: Log the submission
      await this.audit.log({
        userId,
        action: AuditAction.MILESTONE_PROOF_SUBMITTED,
        entityId: project.id,  // Use resolved project ID
        entityType: 'MilestoneProof',
        metadata: {
          milestone: milestone.phase,
          proofId: proof.id,
          imageCount: dto.imageKeys.length
        }
      }, tx);
      // 5. System Logic: Optional - Auto-notify Admins via internal logging
      this.logger.log(`New Proof of Work submitted for ${project.title} - ${milestone.phase}`);
      return proof;
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
}
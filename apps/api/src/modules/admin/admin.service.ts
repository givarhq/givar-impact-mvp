import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, ProposalStatus, AuditAction } from '@givar/database';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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

  async getSubmittedProposals() {
    return this.prisma.projectProposal.findMany({
      where: {
        status: { in: [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW, ProposalStatus.CHANGES_REQUESTED] },
      },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        category: { select: { name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // Promotion Logic
  async approveAndPromote(proposalId: string, adminId: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id: proposalId },
      include: { category: true },
    });

    if (!proposal || proposal.status !== ProposalStatus.SUBMITTED && proposal.status !== ProposalStatus.UNDER_REVIEW) {
      throw new BadRequestException('Proposal is not in a submittable state for approval');
    }

    // Atomic Promotion Transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the public Project
      const project = await tx.project.create({
        data: {
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

      // 2. Update Proposal Status
      await tx.projectProposal.update({
        where: { id: proposalId },
        data: {
          status: ProposalStatus.APPROVED,
          approvedAt: new Date(),
          reviewedBy: adminId,
        },
      });

      // 3. Log the high-level Audit event
      await this.prisma.auditLog.create({
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
}
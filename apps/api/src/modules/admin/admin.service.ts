import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, ProposalStatus, AuditAction, Prisma, TxStatus } from '@givar/database';
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
  ) { }

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
      include: { category: true, user: { select: { email: true, firstName: true } } },
    });

    if (!proposal || (proposal.status !== ProposalStatus.SUBMITTED && proposal.status !== ProposalStatus.UNDER_REVIEW)) {
      throw new BadRequestException('Proposal is not in a submittable state for approval');
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          proposalId: proposal.id,
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
          budgetBreakdown: proposal.budgetBreakdown ?? [],
          executionTimeline: proposal.executionTimeline ?? [],
          riskAnalysis: proposal.riskAnalysis,
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
      targetAmount: BigInt(dto.targetAmount),
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
      updateData.targetAmount = BigInt(dto.targetAmount);
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

  // Update specific phase in the execution timeline
  async updateProjectMilestone(
    projectId: string,
    milestoneId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    dto: UpdateMilestoneDto,
    adminId: string
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
      select: { user: { select: { email: true, firstName: true } } },
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
      ...userDonors.map((d) => ({
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
      throw new BadRequestException('Transaction not found or not in suspense');
    }

    if (dto.action === SuspenseAction.REFUND) {
      // 1. TRIGGER REAL REFUND
      // We call this BEFORE the DB transaction. If it fails, we abort everything.
      await this.triggerPaystackRefund(tx.reference);

      // 2. Mark Ledger as Reversed
      return this.prisma.$transaction(async (prisma) => {
        const updated = await prisma.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: TxStatus.REVERSED,
            description: `${tx.description} [AUTO-REFUNDED]`
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: AuditAction.TRANSACTION_RESOLVED,
            entityId: transactionId,
            entityType: 'WalletTransaction',
            metadata: { action: 'AUTO_REFUND', originalRef: tx.reference },
          },
        });
        return updated;
      });
    }
    if (dto.action === SuspenseAction.ALLOCATE) {
      // 2. RE-ALLOCATION LOGIC
      if (!dto.targetProjectId) throw new BadRequestException('Target Project ID required for allocation');

      return this.prisma.$transaction(async (prisma) => {
        // A. Update Transaction to COMPLETED
        const updatedTx = await prisma.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: TxStatus.COMPLETED,
            description: `${tx.description} [RE-ALLOCATED]`
          }
        });

        // B. Handle Guest vs User Donation Creation
        // We check metadata to see who the original donor was
        const guestEmail = (tx.metadata as any)?.guestEmail;

        if (guestEmail) {
          // It was a guest
          // Find/Create GuestDonor (Reuse logic or simplify)
          const guestDonor = await prisma.guestDonor.upsert({
            where: { email: guestEmail },
            update: { totalDonated: { increment: tx.amount }, donationCount: { increment: 1 } },
            create: { email: guestEmail, totalDonated: tx.amount, donationCount: 1 }
          });

          await prisma.guestDonation.create({
            data: {
              guestDonorId: guestDonor.id,
              projectId: dto.targetProjectId!,
              amount: tx.amount,
              currency: tx.currency,
              reference: tx.reference,
              status: 'COMPLETED',
              message: 'Re-allocated by Admin'
            }
          });
        } else {
          // It was a user
          await prisma.donation.create({
            data: {
              userId: tx.wallet.userId, // Link to wallet owner
              projectId: dto.targetProjectId!,
              transactionId: tx.id, // Link to the now-completed tx
              amount: tx.amount,
              currency: tx.currency,
              message: 'Re-allocated by Admin'
            }
          });
        }

        // C. Update Target Project
        await prisma.project.update({
          where: { id: dto.targetProjectId },
          data: { raisedAmount: { increment: tx.amount } }
        });

        // D. Audit
        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: AuditAction.FUNDS_REALLOCATED,
            entityId: transactionId,
            entityType: 'WalletTransaction',
            metadata: { action: 'RE_ALLOCATE', targetProject: dto.targetProjectId },
          },
        });

        return updatedTx;
      });
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

      await this.audit.log({
        userId: adminId,
        action: AuditAction.DISBURSEMENT_RECORDED,
        entityId: disbursement.id,
        entityType: 'Disbursement',
        metadata: {
          vendor: dto.vendorName,
          milestone: milestone?.phase || 'Unknown',
          hasReceipt: !!dto.receiptKey
        }
      }, tx);

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
        adminId
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
}
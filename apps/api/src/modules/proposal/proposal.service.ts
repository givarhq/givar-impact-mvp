import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';
import { ProposalStatus, Prisma, AuditAction } from '@givar/database';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private storage: StorageService,
    private emailService: EmailService
  ) { }

  // 1. Start a Draft
  async createDraft(userId: string, dto: CreateProposalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true }
    });

    if (!user?.emailVerified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }

    // Organization Verification Check
    const orgProfile = await this.prisma.organizationProfile.findUnique({
      where: { userId },
    });

    if (!orgProfile || orgProfile.status !== 'VERIFIED') {
      throw new BadRequestException(
        'Your identity must be verified before you can start a cause.'
      );
    }

    return this.prisma.projectProposal.create({
      data: {
        userId,
        title: dto.title,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        status: ProposalStatus.DRAFT,
        beneficiaryName: dto.beneficiaryName,
        beneficiaryAge: dto.beneficiaryAge,
        beneficiaryRelationship: dto.beneficiaryRelationship,
        beneficiaryContact: dto.beneficiaryContact,
        organizationName: dto.organizationName,
        contactPhone: dto.contactPhone,
        // Initialize empty structures
        budgetBreakdown: [],
        executionTimeline: [],
        vendors: [],
        gallery: [],
        kycDocuments: [],
      },
    });
  }

  // 2. Update Draft (Auto-save)
  async updateDraft(userId: string, proposalId: string, dto: UpdateProposalDto) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);

    if (proposal.status !== ProposalStatus.DRAFT && proposal.status !== ProposalStatus.CHANGES_REQUESTED) {
      throw new ForbiddenException('Cannot edit a proposal that is under review or approved.');
    }

    // Handle BigInt conversion for targetAmount if present
    const data: Prisma.ProjectProposalUpdateInput = { ...dto } as any;

    if (dto.targetAmount !== undefined && dto.targetAmount !== null) {
      data.targetAmount = BigInt(dto.targetAmount);
    }

    if (dto.preCollectedAmount !== undefined && dto.preCollectedAmount !== null) {
      data.preCollectedAmount = BigInt(dto.preCollectedAmount);
    }

    return this.prisma.projectProposal.update({
      where: { id: proposalId },
      data,
    });
  }

  // 3. Submit for Review (The Gatekeeper)
  async submitProposal(userId: string, proposalId: string) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);

    // --- GATEKEEPER: Organization Verification Check ---
    const orgProfile = await this.prisma.organizationProfile.findUnique({
      where: { userId },
    });

    if (!orgProfile || orgProfile.status !== 'VERIFIED') {
      throw new BadRequestException(
        'Your organization must be VERIFIED before you can submit a proposal for review.'
      );
    }

    // --- Validation Gate: Content Requirements ---
    const strippedDescription = proposal.description ? proposal.description.replace(/<[^>]*>?/gm, '').trim() : '';

    if (strippedDescription.length < 20 || !proposal.coverImage) {
      throw new BadRequestException('A narrative description (at least 20 characters) and a cover image are required.');
    }

    if (!proposal.title || proposal.title.trim().length < 10) {
      throw new BadRequestException('A descriptive title of at least 10 characters is required.');
    }

    if (!proposal.location || proposal.location.trim().length < 2) {
      throw new BadRequestException('A primary location for this cause is required.');
    }

    const budget = proposal.budgetBreakdown as any[];
    if (!budget || budget.length === 0) {
      throw new BadRequestException('Budget breakdown is required.');
    }

    // Relaxed Validation: Only amount, costType, and description are required.
    // payTo and vendorContact are optional so Givar can assist in sourcing.
    const isValidBudget = budget.every(item => item.costType && item.amount > 0 && item.description?.trim());
    if (!isValidBudget) {
      throw new BadRequestException('All budget items must have a valid amount, cost type, and description.');
    }

    const kyc = proposal.kycDocuments as string[];
    if (!kyc || kyc.length === 0) {
      throw new BadRequestException('At least one cause evidence or procurement quote must be uploaded.');
    }

    // --- Execution: State Transition ---
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectProposal.update({
        where: { id: proposalId },
        data: {
          status: ProposalStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      // Alert all administrators that a new cause requires vetting
      const admins = await tx.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
        select: { id: true }
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'SYSTEM',
            title: 'New proposal for review',
            content: `A new cause "${proposal.title}" has been submitted and requires technical vetting.`,
            link: `/admin/proposals/${proposalId}`
          }))
        });
      }

      return updated;
    }).then(async (result) => {
      // Logic: Explicitly fetch user details to provide proposer context to admins
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      // BROADCAST TO ADMINS
      this.emailService.sendAdminProposalAlert({
        projectTitle: proposal.title || 'Untitled',
        proposerName: `${user?.firstName} ${user?.lastName}`,
        proposalId: result.id
      }).catch(err => this.logger.error(`Admin Proposal Alert Failed: ${err.message}`));

      // DISPATCH TO PROPOSER
      this.emailService.sendProposalSubmittedConfirmation(user!.email, {
        name: user!.firstName,
        projectTitle: proposal.title || 'Untitled'
      }).catch(err => this.logger.error(`Proposer Confirmation Email Failed: ${err.message}`));

      return result;
    });
  }

  // 4. Get My Proposals
  async getMyProposals(userId: string) {
    const proposals = await this.prisma.projectProposal.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        category: true,
        subcategory: { select: { name: true } }
      }
    });

    const proposalIds = proposals.map(p => p.id);
    const projects = await this.prisma.project.findMany({
      where: { proposalId: { in: proposalIds } },
      select: { proposalId: true, status: true }
    });

    const projectMap = new Map(projects.map(p => [p.proposalId, p.status]));

    return proposals.map(p => ({
      ...p,
      targetAmount: p.targetAmount?.toString() || '0',
      projectStatus: projectMap.get(p.id) || null,
      subcategoryName: p.subcategory?.name
    }));
  }

  async deleteProposal(userId: string, proposalId: string) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);

    // Guard: Can only delete Drafts or Rejected proposals.
    // Submitted/Under Review proposals are locked to preserve audit trails during review.
    if (
      proposal.status !== ProposalStatus.DRAFT &&
      proposal.status !== ProposalStatus.REJECTED &&
      proposal.status !== ProposalStatus.CHANGES_REQUESTED
    ) {
      throw new ForbiddenException('Cannot delete a proposal currently under review or approved.');
    }

    const keysToPurge: string[] = [];

    if (proposal.coverImage && !proposal.coverImage.startsWith('http')) {
      keysToPurge.push(proposal.coverImage);
    }

    if (proposal.videoUrl && !proposal.videoUrl.startsWith('http')) {
      keysToPurge.push(proposal.videoUrl);
    }

    if (proposal.gallery && Array.isArray(proposal.gallery)) {
      proposal.gallery.forEach((item: any) => {
        if (item.url && !item.url.startsWith('http')) {
          keysToPurge.push(item.url);
        }
      });
    }

    if (proposal.kycDocuments && Array.isArray(proposal.kycDocuments)) {
      proposal.kycDocuments.forEach((key: string) => {
        if (key && !key.startsWith('http')) {
          keysToPurge.push(key);
        }
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // FIX: Clean up related feedback threads before deleting the proposal
      // to avoid a foreign key constraint violation.
      await tx.message.deleteMany({
        where: { proposalId }
      });

      const deleted = await tx.projectProposal.delete({
        where: { id: proposalId },
      });

      await this.audit.log({
        userId,
        action: AuditAction.PROJECT_DELETED,
        entityId: proposalId,
        entityType: 'ProjectProposal',
        metadata: { title: deleted.title, purgedFileCount: keysToPurge.length },
      }, tx);

      return deleted;
    }).then(async (result) => {
      // Safely delete from S3 outside of the transaction to prevent database rollback if cloud fails
      if (keysToPurge.length > 0) {
        await this.storage.deleteFiles(keysToPurge).catch(err =>
          this.logger.error(`Storage purge failed for deleted proposal: ${err.message}`)
        );
      }
      return result;
    });
  }

  // 5. Get Single Proposal (for editing)
  async getOne(userId: string, proposalId: string) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);

    // CRITICAL FIX: Backup the raw S3/Cloudinary Key before hydration transforms it into a URL.
    // This guarantees the frontend won't accidentally auto-save the expiring URL back to the DB.
    const originalCoverImageKey = proposal.coverImage;

    const hydrated = await this.storage.hydrateEntityMedia(proposal);

    return {
      ...hydrated,
      coverImageKey: originalCoverImageKey,
      targetAmount: hydrated.targetAmount?.toString() || '0'
    };
  }

  /**
   * Verifies that a user owns a specific proposal/project. Throws if not found or not owned.
   * @returns The proposal/project ID if successful.
   */
  async verifyOwnership(entityId: string, userId: string): Promise<string> {
    // 1. Try to find as a Proposal (Draft/Submitted)
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id: entityId },
      select: { userId: true },
    });

    if (proposal) {
      if (proposal.userId !== userId) throw new ForbiddenException('Access Denied');
      return entityId;
    }

    // 2. Try to find as a Live Project
    const project = await this.prisma.project.findUnique({
      where: { id: entityId },
      select: { userId: true },
    });

    if (project) {
      if (project.userId !== userId) throw new ForbiddenException('Access Denied');
      return entityId;
    }

    throw new NotFoundException('Project or Proposal not found');
  }

  /**
   * Defer Submission
   * Moves a draft to a "waiting room" that auto-promotes once the user is verified.
   */
  async deferProposal(userId: string, proposalId: string) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);

    // Guard: Only DRAFT proposals can be deferred
    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new BadRequestException('Only draft proposals can be queued for verification.');
    }

    const updated = await this.prisma.projectProposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.AWAITING_VERIFICATION,
        submittedAt: new Date(),
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.PROJECT_UPDATED,
      entityId: proposalId,
      entityType: 'ProjectProposal',
      metadata: { action: 'DEFERRED_SUBMISSION', status: 'AWAITING_VERIFICATION' }
    });

    return updated;
  }

  /**
   * Forensic Asset Verification
   * Checks if a file key is legitimately linked to the project's official records
   * (Disbursements or Proofs), allowing access even if the path owner differs.
   */
  async isProjectAsset(projectId: string, key: string): Promise<boolean> {
    // 1. Check Disbursements (Admin uploaded receipts)
    const disbursement = await this.prisma.disbursement.findFirst({
      where: {
        projectId,
        receiptKey: key
      },
      select: { id: true }
    });

    if (disbursement) return true;

    // 2. Check Milestone Proofs (User uploaded evidence)
    // Note: Array check logic
    const proof = await this.prisma.milestoneProof.findFirst({
      where: {
        projectId,
        imageKeys: { has: key }
      },
      select: { id: true }
    });

    if (proof) return true;

    return false;
  }

  /**
   * Forensic Asset Context Retriever
   * Verifies if a file key is valid AND retrieves rich metadata for auditing.
   */
  async getAssetContext(projectId: string, key: string) {
    // 1. Check Disbursements (Receipts uploaded by Admin)
    const disbursement = await this.prisma.disbursement.findFirst({
      where: { projectId, receiptKey: key },
      select: {
        milestoneId: true,
        project: { select: { title: true, executionTimeline: true } }
      }
    });

    if (disbursement) {
      const timeline = (disbursement.project.executionTimeline as any[]) || [];
      const phase = timeline.find(m => m.id === disbursement.milestoneId)?.phase || 'Unknown Phase';
      return {
        valid: true,
        title: disbursement.project.title,
        phase,
        type: 'DISBURSEMENT_RECEIPT'
      };
    }

    // 2. Check Milestone Proofs (Evidence uploaded by Owner)
    // Note: Project Owners usually own these paths, but this handles edge cases (e.g. multi-user orgs)
    const proof = await this.prisma.milestoneProof.findFirst({
      where: { projectId, imageKeys: { has: key } },
      select: {
        milestoneId: true,
        project: { select: { title: true, executionTimeline: true } }
      }
    });

    if (proof) {
      const timeline = (proof.project.executionTimeline as any[]) || [];
      const phase = timeline.find(m => m.id === proof.milestoneId)?.phase || 'Unknown Phase';
      return {
        valid: true,
        title: proof.project.title,
        phase,
        type: 'MILESTONE_PROOF'
      };
    }

    return { valid: false };
  }

  // Helper
  private async getProposalOrThrow(id: string, userId: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: { select: { name: true } }
      }
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.userId !== userId) throw new ForbiddenException('Access Denied');
    return {
      ...proposal,
      subcategoryName: proposal.subcategory?.name
    };
  }
}
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
    return this.prisma.projectProposal.create({
      data: {
        userId,
        title: dto.title,
        categoryId: dto.categoryId,
        status: ProposalStatus.DRAFT,
        // Initialize empty structures
        budgetBreakdown: [],
        executionTimeline: [],
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
    if (dto.targetAmount) {
      data.targetAmount = BigInt(dto.targetAmount);
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
    if (!proposal.description || !proposal.coverImage) {
      throw new BadRequestException('Description and Cover Image are required.');
    }

    const budget = proposal.budgetBreakdown as any[];
    if (!budget || budget.length === 0) {
      throw new BadRequestException('Budget breakdown is required.');
    }

    const kyc = proposal.kycDocuments as string[];
    if (!kyc || kyc.length === 0) {
      throw new BadRequestException('At least one KYC document is required.');
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

      this.emailService.sendAdminProposalAlert({
        projectTitle: proposal.title || 'Untitled',
        proposerName: `${user.firstName} ${user.lastName}`,
        proposalId: result.id
      }).catch(err => this.logger.error(`Admin Proposal Alert Failed: ${err.message}`));

      return result;
    });
  }

  // 4. Get My Proposals
  async getMyProposals(userId: string) {
    const proposals = await this.prisma.projectProposal.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { category: true } // Include category name
    });

    // Serialize BigInts
    return proposals.map(p => ({
      ...p,
      targetAmount: p.targetAmount?.toString() || '0'
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

    return this.prisma.projectProposal.delete({
      where: { id: proposalId },
    });
  }

  // 5. Get Single Proposal (for editing)
  async getOne(userId: string, proposalId: string) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);

    const hydrated = await this.storage.hydrateEntityMedia(proposal);

    return {
      ...hydrated,
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
      include: { category: true }
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.userId !== userId) throw new ForbiddenException('Access Denied');
    return proposal;
  }
}
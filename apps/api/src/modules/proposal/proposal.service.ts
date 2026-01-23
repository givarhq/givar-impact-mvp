import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';
import { ProposalStatus, Prisma } from '@givar/database';

@Injectable()
export class ProposalService {
  constructor(private prisma: PrismaService) {}

  // 1. Start a Draft
  async createDraft(userId: string, dto: CreateProposalDto) {
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

    // Validation Gate: Ensure critical fields exist
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

    return this.prisma.projectProposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.SUBMITTED,
        submittedAt: new Date(),
      },
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

  // 5. Get Single Proposal (for editing)
  async getOne(userId: string, proposalId: string) {
    const proposal = await this.getProposalOrThrow(proposalId, userId);
    return {
        ...proposal,
        targetAmount: proposal.targetAmount?.toString() || '0'
    };
  }

  // Helper
  private async getProposalOrThrow(id: string, userId: string) {
    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.userId !== userId) throw new ForbiddenException('Access Denied');
    return proposal;
  }
}
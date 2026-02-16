import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuditAction, UserRole } from '@givar/database';

@Injectable()
export class CommunicationService {
    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
        private emailService: EmailService,
    ) { }

    async sendMessage(userId: string, userRole: UserRole, dto: {
        content: string;
        proposalId?: string;
        projectId?: string;
    }) {
        const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

        // 1. Context Validation & Ownership Check
        let recipientEmail: string | null = null;
        let contextTitle: string = '';

        if (dto.proposalId) {
            const proposal = await this.prisma.projectProposal.findUnique({
                where: { id: dto.proposalId },
                include: { user: { select: { email: true, id: true } } }
            });
            if (!proposal) throw new NotFoundException('Proposal not found');
            if (!isAdmin && proposal.userId !== userId) throw new ForbiddenException('Access denied');

            recipientEmail = isAdmin ? proposal.user.email : null; // Only notify user if admin sends msg
            contextTitle = proposal.title || 'Project Proposal';
        } else if (dto.projectId) {
            const project = await this.prisma.project.findUnique({
                where: { id: dto.projectId },
                include: { user: { select: { email: true, id: true } } }
            });
            if (!project) throw new NotFoundException('Project not found');
            if (!isAdmin && project.userId !== userId) throw new ForbiddenException('Access denied');

            recipientEmail = isAdmin ? project.user.email : null;
            contextTitle = project.title;
        } else {
            throw new BadRequestException('Context (Proposal or Project) is required');
        }

        // 2. Atomic Persistence & Audit
        return this.prisma.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: {
                    content: dto.content,
                    authorId: userId,
                    proposalId: dto.proposalId,
                    projectId: dto.projectId,
                    isAdmin,
                },
                include: { author: { select: { firstName: true, lastName: true } } }
            });

            await this.audit.log({
                userId,
                action: AuditAction.MESSAGE_SENT,
                entityId: dto.proposalId || dto.projectId,
                entityType: dto.proposalId ? 'ProjectProposal' : 'Project',
                metadata: { isAdmin, context: contextTitle }
            }, tx);

            // 3. Notification Logic
            if (isAdmin && recipientEmail) {
                // Trigger non-blocking email notification to the project owner
                // Using existing generic logic - can be refined with specific template later
                this.emailService.sendProposalStatusUpdate(recipientEmail, {
                    name: message.author.firstName,
                    project: contextTitle,
                    status: 'New Feedback Received',
                    feedback: dto.content
                }).catch(() => { });
            }

            return message;
        });
    }

    async getMessages(userId: string, userRole: UserRole, context: { proposalId?: string; projectId?: string }) {
        const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

        // Security: Check if user has right to see this thread
        if (context.proposalId) {
            const proposal = await this.prisma.projectProposal.findUnique({ where: { id: context.proposalId } });
            if (!proposal) throw new NotFoundException();
            if (!isAdmin && proposal.userId !== userId) throw new ForbiddenException();
        } else if (context.projectId) {
            const project = await this.prisma.project.findUnique({ where: { id: context.projectId } });
            if (!project) throw new NotFoundException();
            if (!isAdmin && project.userId !== userId) throw new ForbiddenException();
        }

        return this.prisma.message.findMany({
            where: {
                proposalId: context.proposalId,
                projectId: context.projectId
            },
            include: {
                author: { select: { firstName: true, lastName: true, avatarKey: true, role: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
}
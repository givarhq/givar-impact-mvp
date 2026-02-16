import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuditAction, UserRole, Prisma } from '@givar/database';

@Injectable()
export class CommunicationService {
    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
        private emailService: EmailService,
    ) { }

    /**
     * Internal Feedback Logic
     * Logic: Validates context ownership -> Atomic persistence -> Audit logging -> Specialized Notification.
     */
    async sendMessage(userId: string, userRole: UserRole, dto: {
        content: string;
        proposalId?: string;
        projectId?: string;
    }) {
        const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

        let recipientEmail: string | null = null;
        let recipientName: string | null = null;
        let contextTitle: string = '';

        // 1. Context Resolution & Identity Guard
        if (dto.proposalId) {
            const proposal = await this.prisma.projectProposal.findUnique({
                where: { id: dto.proposalId },
                include: { user: { select: { email: true, id: true, firstName: true } } }
            });

            if (!proposal) throw new NotFoundException('Proposal not found');
            if (!isAdmin && proposal.userId !== userId) throw new ForbiddenException('Access denied');

            recipientEmail = isAdmin ? proposal.user.email : null;
            recipientName = isAdmin ? proposal.user.firstName : null;
            contextTitle = proposal.title || 'Project Proposal';
        } else if (dto.projectId) {
            const project = await this.prisma.project.findUnique({
                where: { id: dto.projectId },
                include: { user: { select: { email: true, id: true, firstName: true } } }
            });

            if (!project) throw new NotFoundException('Project not found');
            if (!isAdmin && project.userId !== userId) throw new ForbiddenException('Access denied');

            recipientEmail = isAdmin ? project.user.email : null;
            recipientName = isAdmin ? project.user.firstName : null;
            contextTitle = project.title;
        } else {
            throw new BadRequestException('Proposal or Project ID is required');
        }

        // 2. Ledger Transaction for Message Persistence
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

            // 3. Specialized Stakeholder Notification
            if (isAdmin && recipientEmail && recipientName) {
                this.emailService.sendFeedbackNotification(recipientEmail, {
                    userName: recipientName,
                    projectTitle: contextTitle,
                    messageContent: dto.content,
                    proposalId: dto.proposalId,
                    projectId: dto.projectId
                }).catch(() => { });
            }

            return message;
        });
    }

    /**
     * Retrieve Thread History
     */
    async getMessages(userId: string, userRole: UserRole, context: { proposalId?: string; projectId?: string }) {
        const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

        if (context.proposalId) {
            const proposal = await this.prisma.projectProposal.findUnique({ where: { id: context.proposalId } });
            if (!proposal) throw new NotFoundException('Proposal not found');
            if (!isAdmin && proposal.userId !== userId) throw new ForbiddenException('Access denied');
        } else if (context.projectId) {
            const project = await this.prisma.project.findUnique({ where: { id: context.projectId } });
            if (!project) throw new NotFoundException('Project not found');
            if (!isAdmin && project.userId !== userId) throw new ForbiddenException('Access denied');
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
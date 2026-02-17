import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuditAction, UserRole, Prisma, NotificationType } from '@givar/database';

@Injectable()
export class CommunicationService {
    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
        private emailService: EmailService,
    ) { }

    /**
     * Internal Feedback Logic
     * Logic: Validates context ownership -> Atomic persistence -> Audit logging -> Cross-Node Notification.
     */
    async sendMessage(userId: string, userRole: UserRole, dto: {
        content: string;
        proposalId?: string;
        projectId?: string;
    }) {
        const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

        let recipientEmail: string | null = null;
        let recipientName: string | null = null;
        let ownerId: string | null = null;
        let contextTitle: string = '';
        let appLink: string = '';

        // 1. Context Resolution & Identity Guard
        if (dto.proposalId) {
            const proposal = await this.prisma.projectProposal.findUnique({
                where: { id: dto.proposalId },
                include: { user: { select: { email: true, id: true, firstName: true } } }
            });

            if (!proposal) throw new NotFoundException('Proposal not found');
            if (!isAdmin && proposal.userId !== userId) throw new ForbiddenException('Access denied');

            ownerId = proposal.userId;
            recipientEmail = isAdmin ? proposal.user.email : null;
            recipientName = isAdmin ? proposal.user.firstName : null;
            contextTitle = proposal.title || 'Project Proposal';
            appLink = `/dashboard/proposals/edit/${dto.proposalId}/hook`;
        } else if (dto.projectId) {
            const project = await this.prisma.project.findUnique({
                where: { id: dto.projectId },
                include: { user: { select: { email: true, id: true, firstName: true } } }
            });

            if (!project) throw new NotFoundException('Project not found');
            if (!isAdmin && project.userId !== userId) throw new ForbiddenException('Access denied');

            ownerId = project.userId;
            recipientEmail = isAdmin ? project.user.email : null;
            recipientName = isAdmin ? project.user.firstName : null;
            contextTitle = project.title;
            appLink = `/dashboard/projects/${dto.projectId}/manage`;
        } else {
            throw new BadRequestException('Proposal or Project ID is required');
        }

        // 2. Ledger Transaction for Message Persistence and In-App Alerts
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

            // Logic: Trigger bidirectional in-app notifications
            if (isAdmin) {
                // If Admin sent it -> Notify the specific Owner
                await tx.notification.create({
                    data: {
                        userId: ownerId!,
                        type: 'MESSAGE' as NotificationType,
                        title: 'New message from Givar',
                        content: `The team sent a message regarding "${contextTitle}".`,
                        link: appLink
                    }
                });
            } else {
                // If Owner sent it -> Notify all Administrators
                const admins = await tx.user.findMany({
                    where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
                    select: { id: true }
                });

                if (admins.length > 0) {
                    await tx.notification.createMany({
                        data: admins.map(admin => ({
                            userId: admin.id,
                            type: 'MESSAGE' as NotificationType,
                            title: 'New message from owner',
                            content: `You have a new reply for "${contextTitle}".`,
                            link: dto.proposalId ? `/admin/proposals/${dto.proposalId}` : `/admin/projects/${dto.projectId}/edit`
                        }))
                    });
                }
            }

            await this.audit.log({
                userId,
                action: AuditAction.MESSAGE_SENT,
                entityId: dto.proposalId || dto.projectId,
                entityType: dto.proposalId ? 'ProjectProposal' : 'Project',
                metadata: { isAdmin, context: contextTitle }
            }, tx);

            // 3. Specialized Stakeholder Email Notification (Async)
            if (isAdmin && recipientEmail && recipientName) {
                this.emailService.sendFeedbackNotification(recipientEmail, {
                    userName: recipientName,
                    projectTitle: contextTitle,
                    messageContent: dto.content,
                    proposalId: dto.proposalId,
                    projectId: dto.projectId
                }).catch(() => { });
            }

            // Logic: If the sender is an Organizer, broadcast to Admin nodes via email
            if (!isAdmin) {
                this.emailService.sendAdminMessageAlert({
                    senderName: `${message.author.firstName} ${message.author.lastName}`,
                    projectTitle: contextTitle,
                    content: message.content,
                    contextId: dto.proposalId || dto.projectId!,
                    isProposal: !!dto.proposalId
                }).catch(() => { });
            }

            return message;
        });
    }

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
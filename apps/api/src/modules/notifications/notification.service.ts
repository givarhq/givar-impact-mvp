import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationType } from '@givar/database';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Internal Trigger Logic
     * Logic: Dispatches a new alert to a specific user node.
     */
    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        content: string;
        link?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                content: data.content,
                link: data.link,
            },
        });
    }

    /**
     * Retrieval Logic
     * Logic: Fetches the most recent 50 notifications for the authenticated user.
     */
    async getForUser(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    /**
     * State Management: Mark as Read
     * Logic: Updates the read status for a specific notification, verifying ownership.
     */
    async markAsRead(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found or access denied');
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    /**
     * State Management: Bulk Read
     * Logic: Clears all unread badges for the user's current session.
     */
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    /**
     * Count Logic
     * Logic: Returns the number of unread alerts for the header badge.
     */
    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
}
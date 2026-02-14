import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ModerationStatus, ProjectStatus } from '@givar/database';
import { subDays } from 'date-fns';

@Injectable()
export class RecommendationsRepository {
    constructor(private prisma: PrismaService) { }

    async getConfig() {
        return this.prisma.recommendationConfig.findUnique({
            where: { id: 'default' },
        });
    }

    async getCandidates() {
        return this.prisma.project.findMany({
            where: {
                isActive: true,
                status: ProjectStatus.ACTIVE,
                moderationStatus: { in: [ModerationStatus.APPROVED, ModerationStatus.FLAGGED] },
            },
            include: {
                category: { select: { id: true, slug: true } },
            },
        });
    }

    /**
     * Optimized velocity fetcher.
     * Returns a map of ProjectID -> 7-day donation count to avoid N+1 queries.
     */
    async getDonationVelocityMap(projectIds: string[]): Promise<Map<string, number>> {
        const sevenDaysAgo = subDays(new Date(), 7);

        const counts = await this.prisma.donation.groupBy({
            by: ['projectId'],
            where: {
                projectId: { in: projectIds },
                createdAt: { gte: sevenDaysAgo },
            },
            _count: {
                id: true,
            },
        });

        const velocityMap = new Map<string, number>();
        counts.forEach((c) => {
            velocityMap.set(c.projectId, c._count.id);
        });

        return velocityMap;
    }

    /**
     * Fetches the unique categories and tags a user has supported.
     */
    async getUserAffinity(userId: string) {
        const donations = await this.prisma.donation.findMany({
            where: { userId },
            select: {
                project: {
                    select: {
                        categoryId: true,
                        tags: true,
                    },
                },
            },
        });

        const categoryIds = new Set<string>();
        const tags = new Set<string>();

        donations.forEach((d) => {
            if (d.project.categoryId) categoryIds.add(d.project.categoryId);
            d.project.tags.forEach((tag) => tags.add(tag));
        });

        return { categoryIds, tags };
    }

    async getFeaturedSlots() {
        return this.prisma.featuredSlot.findMany({
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
            orderBy: { position: 'asc' },
            include: { project: true },
        });
    }
}
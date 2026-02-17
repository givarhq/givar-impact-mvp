import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus, Prisma } from '@givar/database';
import { subDays } from 'date-fns';

@Injectable()
export class RecommendationsRepository {
    constructor(private prisma: PrismaService) { }

    async getConfig() {
        return this.prisma.recommendationConfig.findUnique({
            where: { id: 'default' },
        });
    }

    /**
     * Fetches discovery candidates.
     * Logic: Captures projects regardless of moderationStatus nullability to ensure 
     * visibility during the system transition. Includes category weight for ranking.
     */
    async getCandidates() {
        return this.prisma.project.findMany({
            where: {
                isActive: true,
                status: { in: [ProjectStatus.ACTIVE, ProjectStatus.FUNDED, ProjectStatus.COMPLETED] },
            },
            select: {
                id: true,
                status: true,
                raisedAmount: true,
                targetAmount: true,
                categoryId: true,
                createdAt: true,
                featureWeight: true,
                visibilityScore: true,
                tags: true,
                category: {
                    select: {
                        visibilityWeight: true
                    }
                }
            }
        });
    }

    async getDonationVelocityMap(projectIds: string[]): Promise<Map<string, number>> {
        if (projectIds.length === 0) return new Map();
        const sevenDaysAgo = subDays(new Date(), 7);
        const counts = await this.prisma.donation.groupBy({
            by: ['projectId'],
            where: {
                projectId: { in: projectIds },
                createdAt: { gte: sevenDaysAgo },
            },
            _count: { id: true },
        });
        const velocityMap = new Map<string, number>();
        counts.forEach((c) => velocityMap.set(c.projectId, c._count.id));
        return velocityMap;
    }

    async getUserAffinity(userId: string) {
        const donations = await this.prisma.donation.findMany({
            where: { userId },
            select: { project: { select: { categoryId: true, tags: true } } },
        });
        const categoryIds = new Set<string>();
        const tags = new Set<string>();
        donations.forEach((d) => {
            if (d.project.categoryId) categoryIds.add(d.project.categoryId);
            if (d.project.tags) d.project.tags.forEach((tag) => tags.add(tag));
        });
        return { categoryIds, tags };
    }

    /**
     * Manual Overrides Fetcher.
     * Logic: Explicitly join project data to prevent undefined property errors on frontend.
     */
    async getFeaturedSlots() {
        return this.prisma.featuredSlot.findMany({
            where: {
                OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { position: 'asc' },
        });
    }
}
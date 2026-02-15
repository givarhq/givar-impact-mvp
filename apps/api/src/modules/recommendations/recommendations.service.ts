import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RecommendationsRepository } from './recommendations.repository';
import { RankingEngine, RankingCandidate } from './ranking.engine';
import { DiversityEngine, ScoredItem } from './diversity.engine';
import { PersonalizationEngine } from './personalization.engine';
import { AdminOverrideEngine } from './admin-override.engine';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class RecommendationsService {
    private readonly logger = new Logger('DiscoveryEngine');
    private configCache: any = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 60000;

    constructor(
        private repo: RecommendationsRepository,
        private ranking: RankingEngine,
        private diversity: DiversityEngine,
        private personalization: PersonalizationEngine,
        private overrides: AdminOverrideEngine,
        private prisma: PrismaService,
        private storage: StorageService,
    ) { }

    async getFeatured(userId?: string) {
        return this.recommendPipeline({ limit: 5, page: 1, userId });
    }

    async getDiscoveryFeed(userId?: string, page: number = 1, limit: number = 24) {
        return this.recommendPipeline({ limit, page, userId });
    }

    async getRecommendationConfig() { return this.getInternalConfig(); }

    async updateConfig(dto: any) {
        const updated = await this.prisma.recommendationConfig.upsert({
            where: { id: 'default' },
            update: dto,
            create: { id: 'default', ...dto, updatedAt: new Date() },
        });
        this.configCache = updated;
        this.cacheTimestamp = Date.now();
        return updated;
    }

    async getSlots() { return this.repo.getFeaturedSlots(); }

    async createSlot(dto: { projectId: string; position: number; expiresAt?: string }) {
        return this.prisma.featuredSlot.upsert({
            where: { position: dto.position },
            update: { projectId: dto.projectId, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
            create: { projectId: dto.projectId, position: dto.position, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
        });
    }

    async deleteSlot(id: string) { return this.prisma.featuredSlot.delete({ where: { id } }); }

    async updateProjectWeights(id: string, dto: any) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project node not found');

        return this.prisma.project.update({ where: { id }, data: dto });
    }

    private async recommendPipeline(options: { limit: number; page: number; userId?: string }) {
        // console.log(`\n🚀 [DISCOVERY START] User: ${options.userId || 'GUEST'} Page: ${options.page}`);

        const config = await this.getInternalConfig();
        const projects = await this.repo.getCandidates();

        if (projects.length === 0) return [];

        const projectIds = projects.map((p) => p.id);
        const velocityMap = await this.repo.getDonationVelocityMap(projectIds);
        const slots = await this.repo.getFeaturedSlots();

        // 1. Score All (Fast)
        const scored: ScoredItem[] = projects.map((p) => ({
            id: p.id,
            categoryId: p.categoryId || 'none',
            score: this.ranking.calculateScore({
                id: p.id,
                createdAt: p.createdAt,
                featureWeight: p.featureWeight || 0,
                visibilityScore: p.visibilityScore || 0,
                donationVelocity: velocityMap.get(p.id) || 0,
                engagementScore: 0,
            }, config),
        }));

        // 2. Personalize All
        let processed = scored;
        if (options.userId) {
            try {
                const affinity = await this.repo.getUserAffinity(options.userId);
                processed = this.personalization.apply(scored, affinity, projects);
            } catch (err) {
                this.logger.error(`Personalization logic failed for user ${options.userId}`, err);
            }
        }

        // 3. Sort & Diversify All
        const sorted = [...processed].sort((a, b) => b.score - a.score);
        const diversified = this.diversity.enforce(sorted, config.diversityLimit || 3);
        const finalOrder = this.overrides.apply(
            diversified,
            slots.map(s => ({ projectId: s.projectId, position: s.position }))
        );

        // 4. Pagination Slice (Selecting only the range we need)
        const startIndex = (options.page - 1) * options.limit;
        const endIndex = startIndex + options.limit;
        const topIds = finalOrder.slice(startIndex, endIndex).map((item) => item.id);

        // 5. Heavy Hydration (Only for the sliced 24 projects)
        const hydratedProjects = await this.prisma.project.findMany({
            where: { id: { in: topIds } },
            include: {
                category: { select: { name: true, slug: true, icon: true } },
                user: { select: { role: true, organization: { select: { status: true, legalName: true } } } }
            }
        });

        const orderedHydrated = topIds
            .map(id => hydratedProjects.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => !!p);

        return Promise.all(orderedHydrated.map(async (p) => {
            const hydrated = await this.storage.hydrateEntityMedia(p as any);
            const raised = Number(hydrated.raisedAmount || 0n);
            const target = Number(hydrated.targetAmount || 0n);
            const isSystem = p.user?.role === 'ADMIN' || p.user?.role === 'SUPERADMIN';

            return {
                ...hydrated,
                targetAmount: hydrated.targetAmount.toString(),
                raisedAmount: hydrated.raisedAmount.toString(),
                percentFunded: Number(hydrated.targetAmount) > 0 ? Math.min(100, Math.round((Number(hydrated.raisedAmount) / Number(hydrated.targetAmount)) * 100)) : 0,
                categoryName: hydrated.category?.name || 'General Impact',
                isVerifiedOrganizer: isSystem || p.user?.organization?.status === 'VERIFIED',
                organizerName: isSystem ? 'Givar' : (p.user?.organization?.legalName || 'Individual Donor'),
            };
        }));
    }

    private async getInternalConfig() {
        const now = Date.now();
        if (!this.configCache || (now - this.cacheTimestamp) > this.CACHE_TTL) {
            let config = await this.repo.getConfig();
            if (!config) {
                config = {
                    id: 'default',
                    recencyWeight: 1,
                    velocityWeight: 1.5,
                    engagementWeight: 1,
                    adminWeight: 2,
                    diversityLimit: 3,
                    updatedAt: new Date()
                };
            }
            this.configCache = config;
            this.cacheTimestamp = now;
        }
        return this.configCache;
    }
}
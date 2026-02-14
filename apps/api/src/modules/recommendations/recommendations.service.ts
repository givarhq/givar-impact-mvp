import { Injectable, Logger } from '@nestjs/common';
import { RecommendationsRepository } from './recommendations.repository';
import { RankingEngine, RankingCandidate } from './ranking.engine';
import { DiversityEngine, ScoredItem } from './diversity.engine';
import { PersonalizationEngine } from './personalization.engine';
import { AdminOverrideEngine } from './admin-override.engine';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class RecommendationsService {
    private readonly logger = new Logger(RecommendationsService.name);
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
        return this.recommendPipeline({ limit: 5, userId });
    }

    async getDiscoveryFeed(userId?: string) {
        return this.recommendPipeline({ limit: 12, userId });
    }

    async getRecommendationConfig() {
        return this.getInternalConfig();
    }

    async updateConfig(dto: any) {
        const updated = await this.prisma.recommendationConfig.update({
            where: { id: 'default' },
            data: dto,
        });
        this.configCache = updated;
        this.cacheTimestamp = Date.now();
        return updated;
    }

    private async recommendPipeline(options: { limit: number; userId?: string }) {
        const config = await this.getInternalConfig();
        const projects = await this.repo.getCandidates();

        const projectIds: string[] = projects.map((p) => p.id);
        const velocityMap = await this.repo.getDonationVelocityMap(projectIds);
        const slots = await this.repo.getFeaturedSlots();

        const scored: ScoredItem[] = projects.map((p) => {
            const candidate: RankingCandidate = {
                id: p.id,
                createdAt: p.createdAt,
                featureWeight: p.featureWeight,
                visibilityScore: p.visibilityScore,
                donationVelocity: velocityMap.get(p.id) || 0,
                engagementScore: 0,
            };
            return {
                id: p.id,
                categoryId: p.categoryId || '',
                score: this.ranking.calculateScore(candidate, config),
            };
        });

        let processed = scored;
        if (options.userId) {
            const affinity = await this.repo.getUserAffinity(options.userId);
            processed = this.personalization.apply(scored, affinity, projects);
        }

        const sorted = [...processed].sort((a, b) => b.score - a.score);
        const diversified = this.diversity.enforce(sorted, config.diversityLimit);

        const finalOrder = this.overrides.apply(
            diversified,
            slots.map(s => ({ projectId: s.projectId, position: s.position }))
        );

        const topIds = finalOrder.slice(0, options.limit).map((item) => item.id);

        const hydratedProjects = await this.prisma.project.findMany({
            where: { id: { in: topIds } },
            include: {
                category: { select: { name: true, slug: true, icon: true } },
                user: {
                    select: {
                        role: true,
                        organization: { select: { status: true, legalName: true } }
                    }
                }
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
                percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
                categoryName: hydrated.category?.name,
                isVerifiedOrganizer: isSystem ? true : p.user?.organization?.status === 'VERIFIED',
                organizerName: isSystem ? 'Givar' : (p.user?.organization?.legalName || 'Individual'),
            };
        }));
    }

    private async getInternalConfig() {
        const now = Date.now();
        if (!this.configCache || (now - this.cacheTimestamp) > this.CACHE_TTL) {
            let config = await this.repo.getConfig();
            if (!config) {
                config = await this.prisma.recommendationConfig.create({
                    data: { id: 'default' }
                });
            }
            this.configCache = config;
            this.cacheTimestamp = now;
        }
        return this.configCache;
    }
}
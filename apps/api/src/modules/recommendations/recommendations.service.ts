import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RecommendationsRepository } from './recommendations.repository';
import { RankingEngine, RankingCandidate } from './ranking.engine';
import { DiversityEngine, ScoredItem } from './diversity.engine';
import { PersonalizationEngine } from './personalization.engine';
import { AdminOverrideEngine } from './admin-override.engine';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ProjectStatus } from '@givar/database';

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
        private audit: AuditService
    ) { }

    async getFeatured(userId?: string) {
        return this.recommendPipeline({ limit: 5, page: 1, userId });
    }

    /**
     * Discovery Feed Logic.
     */
    async getDiscoveryFeed(userId?: string, page: number = 1, limit: number = 18) {
        return this.recommendPipeline({ limit, page, userId });
    }

    async getRecommendationConfig() { return this.getInternalConfig(); }

    async updateConfig(dto: any, adminId: string) {
        // Logic: Snapshot previous state to prevent reference mutation in logs
        const previousState = { ...(await this.getInternalConfig()) };

        // Logic: Force explicit float casting to prevent integer truncation in Json metadata
        const sanitizedDto = { ...dto };
        ['recencyWeight', 'velocityWeight', 'engagementWeight', 'adminWeight'].forEach(key => {
            if (sanitizedDto[key] !== undefined) sanitizedDto[key] = Number(parseFloat(sanitizedDto[key]));
        });

        const updated = await this.prisma.recommendationConfig.upsert({
            where: { id: 'default' },
            update: sanitizedDto,
            create: { id: 'default', ...sanitizedDto, updatedAt: new Date() },
        });

        await this.audit.log({
            userId: adminId,
            action: AuditAction.RECOMMENDATION_CONFIG_UPDATED,
            entityType: 'RecommendationConfig',
            entityId: 'default',
            metadata: {
                before: previousState,
                after: updated,
                delta: sanitizedDto
            }
        });

        this.configCache = updated;
        this.cacheTimestamp = Date.now();
        return updated;
    }

    async getSlots() { return this.repo.getFeaturedSlots(); }

    async createSlot(dto: { projectId: string; position: number; expiresAt?: string }, adminId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: dto.projectId },
            select: { title: true }
        });

        const slot = await this.prisma.featuredSlot.upsert({
            where: { position: dto.position },
            update: { projectId: dto.projectId, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
            create: { projectId: dto.projectId, position: dto.position, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
        });

        await this.audit.log({
            userId: adminId,
            action: AuditAction.FEATURED_SLOT_CREATED,
            entityType: 'FeaturedSlot',
            entityId: slot.id,
            metadata: {
                projectTitle: project?.title,
                projectId: dto.projectId,
                position: dto.position,
                expiresAt: dto.expiresAt
            }
        });

        return slot;
    }

    async deleteSlot(id: string, adminId: string) {
        const slot = await this.prisma.featuredSlot.findUnique({
            where: { id },
            include: { project: { select: { title: true } } }
        });

        await this.prisma.featuredSlot.delete({ where: { id } });

        await this.audit.log({
            userId: adminId,
            action: AuditAction.FEATURED_SLOT_DELETED,
            entityType: 'FeaturedSlot',
            entityId: id,
            metadata: {
                projectTitle: slot?.project?.title,
                position: slot?.position
            }
        });
    }

    /**
     * Updates the visibility multiplier for an entire category.
     * This affects the ranking score of all projects within this sector.
     */
    async updateCategoryWeight(id: string, weight: number, adminId: string) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        const previousWeight = Number(category?.visibilityWeight || 1.0);

        const updated = await this.prisma.category.update({
            where: { id },
            data: { visibilityWeight: Number(weight) }
        });

        await this.audit.log({
            userId: adminId,
            action: AuditAction.CATEGORY_WEIGHT_UPDATED,
            entityType: 'Category',
            entityId: id,
            metadata: {
                categoryName: category?.name,
                before: previousWeight,
                after: Number(weight)
            }
        });

        return updated;
    }

    async updateProjectWeights(id: string, dto: any, adminId: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project node not found');

        const updated = await this.prisma.project.update({
            where: { id },
            data: dto,
        });

        await this.audit.log({
            userId: adminId,
            action: AuditAction.PROJECT_DISCOVERY_WEIGHTS_UPDATED,
            entityType: 'Project',
            entityId: id,
            metadata: {
                projectTitle: project.title,
                changes: dto,
                previous: {
                    featureWeight: project.featureWeight,
                    visibilityScore: project.visibilityScore,
                    moderationStatus: project.moderationStatus
                }
            }
        });

        return updated;
    }

    private async recommendPipeline(options: { limit: number; page: number; userId?: string }) {
        const config = await this.getInternalConfig();
        const projects = await this.repo.getCandidates();

        if (projects.length === 0) return { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

        // Logic: If toggle is OFF, exclude anything with a final status OR where raised >= target.
        const filteredCandidates = config.showFundedProjects
            ? projects
            : projects.filter(p => {
                const isStatusActive = p.status === ProjectStatus.ACTIVE;
                const isMathIncomplete = BigInt(p.raisedAmount) < BigInt(p.targetAmount);
                return isStatusActive && isMathIncomplete;
            });

        if (filteredCandidates.length === 0) return { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

        const projectIds = filteredCandidates.map((p) => p.id);
        const velocityMap = await this.repo.getDonationVelocityMap(projectIds);
        const slots = await this.repo.getFeaturedSlots();

        // Ensure we only use filtered candidates for the scoring map
        const scored: ScoredItem[] = filteredCandidates.map((p: any) => {
            const raised = Number(p.raisedAmount);
            const target = Number(p.targetAmount);
            const percentFunded = target > 0 ? (raised / target) * 100 : 0;

            return {
                id: p.id,
                categoryId: p.categoryId || 'none',
                score: this.ranking.calculateScore({
                    id: p.id,
                    createdAt: p.createdAt,
                    featureWeight: p.featureWeight || 0,
                    visibilityScore: p.visibilityScore || 0,
                    donationVelocity: velocityMap.get(p.id) || 0,
                    engagementScore: percentFunded,
                    categoryWeight: p.category?.visibilityWeight ?? 1.0,
                }, config),
            }
        });

        let processed = scored;
        if (options.userId) {
            try {
                const affinity = await this.repo.getUserAffinity(options.userId);
                processed = this.personalization.apply(scored, affinity, filteredCandidates);
            } catch (err) {
                this.logger.error(`Personalization failed`, err);
            }
        }

        const sorted = [...processed].sort((a, b) => b.score - a.score);
        const diversified = this.diversity.enforce(sorted, config.diversityLimit || 3);

        // Final Security Filter: Ensure manually pinned items are also subject to the global visibility toggle
        const validSlots = slots.filter(s => filteredCandidates.some(c => c.id === s.projectId));

        const finalOrder = this.overrides.apply(
            diversified,
            validSlots.map(s => ({ projectId: s.projectId, position: s.position }))
        );

        // --- Hydration ---
        const total = finalOrder.length;
        const lastPage = Math.ceil(total / options.limit);
        const startIndex = (options.page - 1) * options.limit;
        const topIds = finalOrder.slice(startIndex, startIndex + options.limit).map((item) => item.id);

        const hydratedProjects = await this.prisma.project.findMany({
            where: { id: { in: topIds } },
            include: {
                category: { select: { name: true, slug: true, icon: true } },
                user: { select: { role: true, organization: { select: { status: true, legalName: true } } } }
            }
        });

        // Use topIds to preserve the ranking order
        const orderedHydrated = topIds
            .map(id => hydratedProjects.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => !!p);

        const data = await Promise.all(orderedHydrated.map(async (p) => {
            const hydrated = await this.storage.hydrateEntityMedia(p as any);
            const raised = Number(hydrated.raisedAmount || 0n);
            const target = Number(hydrated.targetAmount || 0n);
            const isSystem = p.user?.role === 'ADMIN' || p.user?.role === 'SUPERADMIN';

            return {
                ...hydrated,
                targetAmount: hydrated.targetAmount.toString(),
                raisedAmount: hydrated.raisedAmount.toString(),
                percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
                categoryName: hydrated.category?.name || 'General Impact',
                isVerifiedOrganizer: isSystem || p.user?.organization?.status === 'VERIFIED',
                organizerName: isSystem ? 'Givar' : (p.user?.organization?.legalName || 'Individual Donor'),
            };
        }));

        return { data, meta: { total, page: options.page, lastPage } };
    }

    private async getInternalConfig() {
        const now = Date.now();
        if (!this.configCache || (now - this.cacheTimestamp) > this.CACHE_TTL) {
            let config = await this.repo.getConfig();
            if (!config) {
                config = {
                    id: 'default',
                    recencyWeight: 5.0, // Tuned for high modern crowd-fund elasticity
                    velocityWeight: 7.0, // Highly sensitive trending boost
                    engagementWeight: 3.0,
                    adminWeight: 4.0,
                    diversityLimit: 3,
                    showFundedProjects: false,
                    updatedAt: new Date()
                };
            }
            this.configCache = config;
            this.cacheTimestamp = now;
        }
        return this.configCache;
    }

    /**
     * Grouped Discovery Feed Logic.
     * Ranks projects and groups them by category for App-Store style rows.
     */
    async getGroupedFeed(userId?: string, limitPerCategory: number = 3) {
        const config = await this.getInternalConfig();
        const projects = await this.repo.getCandidates();

        if (projects.length === 0) return [];

        const filteredCandidates = config.showFundedProjects
            ? projects
            : projects.filter(p => {
                const isStatusActive = p.status === ProjectStatus.ACTIVE;
                const isMathIncomplete = BigInt(p.raisedAmount) < BigInt(p.targetAmount);
                return isStatusActive && isMathIncomplete;
            });

        if (filteredCandidates.length === 0) return [];

        const projectIds = filteredCandidates.map((p) => p.id);
        const velocityMap = await this.repo.getDonationVelocityMap(projectIds);

        // 1. Score all candidates using the core engine
        let scored: ScoredItem[] = filteredCandidates.map((p: any) => {
            const raised = Number(p.raisedAmount);
            const target = Number(p.targetAmount);
            const percentFunded = target > 0 ? (raised / target) * 100 : 0;

            return {
                id: p.id,
                categoryId: p.categoryId || 'none',
                score: this.ranking.calculateScore({
                    id: p.id,
                    createdAt: p.createdAt,
                    featureWeight: p.featureWeight || 0,
                    visibilityScore: p.visibilityScore || 0,
                    donationVelocity: velocityMap.get(p.id) || 0,
                    engagementScore: percentFunded,
                    categoryWeight: p.category?.visibilityWeight ?? 1.0,
                }, config),
            }
        });

        // 2. Apply Personalization Multipliers if logged in
        if (userId) {
            try {
                const affinity = await this.repo.getUserAffinity(userId);
                scored = this.personalization.apply(scored, affinity, filteredCandidates);
            } catch (err) {
                this.logger.error(`Personalization failed`, err);
            }
        }

        // 3. Sort globally by score and bucket into categories
        const groupedByCat: Record<string, string[]> = {};
        scored.sort((a, b) => b.score - a.score).forEach(item => {
            if (!groupedByCat[item.categoryId]) groupedByCat[item.categoryId] = [];
            // Only keep the top 'X' projects per category
            if (groupedByCat[item.categoryId].length < limitPerCategory) {
                groupedByCat[item.categoryId].push(item.id);
            }
        });

        // 4. Fetch categories to establish global ordering based on Admin weights
        const categories = await this.prisma.category.findMany({
            orderBy: { visibilityWeight: 'desc' }
        });

        const resultGroups = [];
        for (const cat of categories) {
            const pIds = groupedByCat[cat.id];
            if (pIds && pIds.length > 0) {
                resultGroups.push({
                    category: { id: cat.id, name: cat.name, slug: cat.slug },
                    projectIds: pIds
                });
            }
        }

        // 5. Heavy Hydration for only the selected subset (Database + S3 Pre-signing)
        const allSelectedIds = resultGroups.flatMap(g => g.projectIds);
        if (allSelectedIds.length === 0) return [];

        const hydratedProjects = await this.prisma.project.findMany({
            where: { id: { in: allSelectedIds } },
            include: {
                category: { select: { name: true, slug: true, icon: true } },
                user: { select: { role: true, organization: { select: { status: true, legalName: true } } } }
            }
        });

        const processedProjects = await Promise.all(hydratedProjects.map(async (p) => {
            const hydrated = await this.storage.hydrateEntityMedia(p as any);
            const raised = Number(hydrated.raisedAmount || 0n);
            const target = Number(hydrated.targetAmount || 0n);
            const isSystem = p.user?.role === 'ADMIN' || p.user?.role === 'SUPERADMIN';

            return {
                ...hydrated,
                targetAmount: hydrated.targetAmount.toString(),
                raisedAmount: hydrated.raisedAmount.toString(),
                percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
                categoryName: hydrated.category?.name || 'General Impact',
                isVerifiedOrganizer: isSystem || p.user?.organization?.status === 'VERIFIED',
                organizerName: isSystem ? 'Givar' : (p.user?.organization?.legalName || 'Individual Donor'),
            };
        }));

        // 6. Map hydrated projects back into their respective category groups
        return resultGroups.map(group => ({
            category: group.category,
            projects: group.projectIds
                .map(id => processedProjects.find(p => p.id === id))
                .filter(Boolean)
        }));
    }
}
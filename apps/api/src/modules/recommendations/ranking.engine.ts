import { Injectable } from '@nestjs/common';

export interface RankingCandidate {
    id: string;
    createdAt: Date;
    featureWeight: number;
    visibilityScore: number;
    donationVelocity: number; // Count of donations in last 7 days
    engagementScore: number;  // Placeholder for future metrics
    categoryWeight: number;   // Global multiplier for the project's sector
}

export interface RankingWeights {
    recencyWeight: number;
    velocityWeight: number;
    engagementWeight: number;
    adminWeight: number;
}

@Injectable()
export class RankingEngine {
    /**
     * Computes hybrid score using logarithmic recency decay and weighted velocity,
     * then applies a global category multiplier for sector-wide prioritization.
     * 
     * score = ( (recencyWeight * recencyScore) + 
     *           (velocityWeight * donationVelocity) + 
     *           (engagementWeight * engagementScore) + 
     *           (adminWeight * featureWeight) + 
     *           visibilityScore ) * categoryWeight
     */
    calculateScore(candidate: RankingCandidate, weights: RankingWeights): number {
        const recencyScore = this.calculateRecencyScore(candidate.createdAt);

        const weightedRecency = weights.recencyWeight * recencyScore;
        const weightedVelocity = weights.velocityWeight * candidate.donationVelocity;
        const weightedEngagement = weights.engagementWeight * candidate.engagementScore;
        const weightedAdmin = weights.adminWeight * candidate.featureWeight;

        const baseScore = (
            weightedRecency +
            weightedVelocity +
            weightedEngagement +
            weightedAdmin +
            candidate.visibilityScore
        );

        // Apply the category-level multiplier to shift priority across entire sectors
        return baseScore * candidate.categoryWeight;
    }

    private calculateRecencyScore(createdAt: Date): number {
        const now = Date.now();
        const ageInDays = Math.max(0, (now - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Logarithmic decay: 1 / log2(2 + age)
        // Ensures new projects get a significant boost that tapers off smoothly
        return 1 / Math.log2(2 + ageInDays);
    }

    sort(candidates: { candidate: RankingCandidate; score: number }[]) {
        return [...candidates].sort((a, b) => b.score - a.score);
    }
}
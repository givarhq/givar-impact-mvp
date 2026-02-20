import { Injectable } from '@nestjs/common';

export interface RankingCandidate {
    id: string;
    createdAt: Date;
    featureWeight: number;
    visibilityScore: number;
    donationVelocity: number;
    engagementScore: number;
    categoryWeight: number;
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
     * then applies a high-sensitivity category multiplier for sector-wide prioritization.
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

        // Logic: Scattering Algorithm
        // Apply a randomized jitter (between 0.4 and 1.0) to the sector multiplier. 
        // This ensures that highly prioritized sectors don't clump together in a solid block, 
        // but instead scatter frequently across the feed based on probability.
        const jitter = 0.4 + (Math.random() * 0.6);
        const exponentialWeight = Math.pow(candidate.categoryWeight, 1.5);
        const dynamicMultiplier = exponentialWeight * jitter;

        // Base constant ensures even 0-velocity projects can be multiplied
        return (baseScore + 10.0) * dynamicMultiplier;
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
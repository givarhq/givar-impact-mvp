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
     * then applies a high-sensitivity category multiplier for sector-wide prioritization.
     * 
     * logic: we add a constant base (10.0) and square the category weight to ensure 
     * that administrative sector boosts provide a significant vertical lift.
     * 
     * score = (baseScore + 10.0) * (categoryWeight ^ 2)
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

        // Sensitivity Logic: 
        // 1. Add +10 to the base so the multiplier has a meaningful 'sum' to act on.
        // 2. Square the weight so that 2.0x is 4x more powerful than 1.0x, 
        //    creating a more responsive administrative lever.
        const sensitivityConstant = 10.0;
        const exponentialWeight = Math.pow(candidate.categoryWeight, 2);

        return (baseScore + sensitivityConstant) * exponentialWeight;
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

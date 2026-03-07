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
     * Computes deterministic score for "App Store" style ranking.
     * Removed jitter/randomization to ensure the top 4 slots are always merit-based.
     */
    calculateScore(candidate: RankingCandidate, weights: RankingWeights): number {
        // 1. Recency Score (0 to 100)
        // Exponential decay over 14 days. A brand new post gets 100.
        const ageInDays = Math.max(0, (Date.now() - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const recencyScore = 100 * Math.exp(-ageInDays / 14);

        // 2. Velocity Score (0 to 100)
        // Normalize 20 donations in 7 days to a perfect 100 score.
        const velocityScore = Math.min((candidate.donationVelocity / 20) * 100, 100);

        // 3. Engagement Score (0 to 100)
        // Percentage funded passed as engagement. High percentage = high urgency.
        const engagementScore = Math.min(candidate.engagementScore, 100);

        // 4. Admin Feature Score (0 to 100)
        // candidate.featureWeight is already 0-100 from the UI slider.
        const adminScore = candidate.featureWeight;

        // Apply Configured Weights (Intensity levels from UI sliders, 0.0 to 10.0)
        const weightedRecency = weights.recencyWeight * recencyScore;
        const weightedVelocity = weights.velocityWeight * velocityScore;
        const weightedEngagement = weights.engagementWeight * engagementScore;
        const weightedAdmin = weights.adminWeight * adminScore;

        const baseScore = (
            weightedRecency +
            weightedVelocity +
            weightedEngagement +
            weightedAdmin +
            (candidate.visibilityScore * 10) // Visibility score slider 0-50, multiplied by 10 to heavily boost (up to 500)
        );

        // Category Weight Impact
        // In "Grouped" mode, this technically cancels out within the group, 
        // but we keep it to maintain consistent scoring logic across different views.
        // Removed jitter factor to ensure stability.
        const categoryMultiplier = Math.pow(candidate.categoryWeight, 2);

        return (baseScore + 10.0) * categoryMultiplier;
    }

    sort(candidates: { candidate: RankingCandidate; score: number }[]) {
        return [...candidates].sort((a, b) => b.score - a.score);
    }
}
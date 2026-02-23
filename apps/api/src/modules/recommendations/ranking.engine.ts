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

        // Logic: Scattering Algorithm
        // Apply a randomized jitter to prevent block clustering.
        const jitter = 0.8 + (Math.random() * 0.2);

        // Category weight from admin settings (0.5 to 5.0). Power of 2 makes category prioritization extremely effective.
        const exponentialWeight = Math.pow(candidate.categoryWeight, 2);
        const dynamicMultiplier = exponentialWeight * jitter;

        return (baseScore + 10.0) * dynamicMultiplier; // +10 to ensure even 0-activity items can be multiplied
    }

    sort(candidates: { candidate: RankingCandidate; score: number }[]) {
        return [...candidates].sort((a, b) => b.score - a.score);
    }
}
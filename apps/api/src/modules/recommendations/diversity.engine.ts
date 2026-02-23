import { Injectable } from '@nestjs/common';

export interface ScoredItem {
    id: string;
    categoryId: string;
    score: number;
}

@Injectable()
export class DiversityEngine {
    /**
     * Re-ranks items to ensure category diversity while maintaining score integrity.
     * Logic: Instead of a hard limit that banishes items to the end of the feed,
     * we apply a progressive decay penalty to scatter them naturally.
     */
    enforce(items: ScoredItem[], diversityLimit: number): ScoredItem[] {
        if (diversityLimit <= 0) return items;

        const categoryCounts = new Map<string, number>();

        const penalizedItems = items.map((item) => {
            const currentCount = categoryCounts.get(item.categoryId) || 0;
            categoryCounts.set(item.categoryId, currentCount + 1);

            if (currentCount >= diversityLimit) {
                // Logic: Apply a 40% score penalty (0.6 multiplier) for each item beyond the diversity limit.
                // This ensures viral projects from over-represented sectors still appear moderately high 
                // but prevents them from monopolizing the very top of the feed block.
                const overageCount = currentCount - diversityLimit + 1;
                const penaltyMultiplier = Math.pow(0.6, overageCount);

                return {
                    ...item,
                    score: item.score * penaltyMultiplier
                };
            }

            return item;
        });

        // Logic: Re-sort the array based on the new penalized scores to scatter them organically
        return penalizedItems.sort((a, b) => b.score - a.score);
    }

    /**
     * Ensures that the top N results contain at least a specific spread of categories.
     * Useful for the "Featured" carousel to prevent single-category takeovers.
     */
    getSpread(items: ScoredItem[], limit: number, categoryLimit: number): ScoredItem[] {
        const reranked = this.enforce(items, categoryLimit);
        return reranked.slice(0, limit);
    }
}
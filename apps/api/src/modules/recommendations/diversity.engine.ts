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
     * Items exceeding the diversityLimit per category are pushed to the end.
     */
    enforce(items: ScoredItem[], diversityLimit: number): ScoredItem[] {
        if (diversityLimit <= 0) return items;

        const result: ScoredItem[] = [];
        const overflow: ScoredItem[] = [];
        const categoryCounts = new Map<string, number>();

        // Single pass selection
        for (const item of items) {
            const currentCount = categoryCounts.get(item.categoryId) || 0;

            if (currentCount < diversityLimit) {
                result.push(item);
                categoryCounts.set(item.categoryId, currentCount + 1);
            } else {
                // Push to overflow to be appended at the end
                overflow.push(item);
            }
        }

        return [...result, ...overflow];
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
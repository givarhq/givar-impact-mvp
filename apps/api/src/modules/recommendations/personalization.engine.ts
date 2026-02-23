import { Injectable } from '@nestjs/common';
import { ScoredItem } from './diversity.engine';

export interface UserAffinity {
    categoryIds: Set<string>;
    tags: Set<string>;
}

@Injectable()
export class PersonalizationEngine {
    // Widened multiplier gap to make personalization highly effective.
    // A perfect match now provides a massive 100% boost (2.0x) to the base score.
    private readonly MULTIPLIER_MIN = 1.2;
    private readonly MULTIPLIER_MAX = 2.0;

    /**
     * Applies a personalized boost to items based on user history.
     * Boost is calculated based on category and tag matches.
     */
    apply(items: ScoredItem[], affinity: UserAffinity | null, projects: any[]): ScoredItem[] {
        if (!affinity) return items;

        return items.map((item) => {
            const project = projects.find((p) => p.id === item.id);
            if (!project) return item;

            let boost = 1.0;

            // Category Affinity Match (Significant bump for primary sector alignment)
            if (affinity.categoryIds.has(project.categoryId)) {
                boost += 0.4;
            }

            // Tag Affinity Match (Incremental scaling for deep personalization)
            const matchingTags = project.tags.filter((tag: string) => affinity.tags.has(tag));
            if (matchingTags.length > 0) {
                boost += Math.min(0.2 * matchingTags.length, 0.6);
            }

            // Cap multiplier between 1.2x and 2.0x
            const finalMultiplier = Math.min(Math.max(boost, this.MULTIPLIER_MIN), this.MULTIPLIER_MAX);

            return {
                ...item,
                score: item.score * finalMultiplier,
            };
        });
    }
}
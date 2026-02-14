import { Injectable } from '@nestjs/common';
import { ScoredItem } from './diversity.engine';

export interface UserAffinity {
    categoryIds: Set<string>;
    tags: Set<string>;
}

@Injectable()
export class PersonalizationEngine {
    private readonly MULTIPLIER_MIN = 1.2;
    private readonly MULTIPLIER_MAX = 1.5;

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

            // Category Affinity Match
            if (affinity.categoryIds.has(project.categoryId)) {
                boost += 0.2;
            }

            // Tag Affinity Match (Incremental)
            const matchingTags = project.tags.filter((tag: string) => affinity.tags.has(tag));
            if (matchingTags.length > 0) {
                boost += Math.min(0.1 * matchingTags.length, 0.3);
            }

            // Cap multiplier between 1.2 and 1.5
            const finalMultiplier = Math.min(Math.max(boost, this.MULTIPLIER_MIN), this.MULTIPLIER_MAX);

            return {
                ...item,
                score: item.score * finalMultiplier,
            };
        });
    }
}
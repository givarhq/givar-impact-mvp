import { Injectable } from '@nestjs/common';
import { ScoredItem } from './diversity.engine';

export interface FeaturedSlotDescriptor {
    projectId: string;
    position: number;
}

@Injectable()
export class AdminOverrideEngine {
    /**
     * Injects featured projects into specific positions in the ranked list.
     * Prevents duplicates by removing injected projects from their original scored positions.
     */
    apply(items: ScoredItem[], slots: FeaturedSlotDescriptor[]): ScoredItem[] {
        if (slots.length === 0) return items;

        // 1. Create a deep copy to avoid mutating the original ranked array
        let result = [...items];

        // 2. Sort slots by position to ensure predictable insertion behavior
        const sortedSlots = [...slots].sort((a, b) => a.position - b.position);

        for (const slot of sortedSlots) {
            // Find the item if it already exists in the ranked list
            const existingIndex = result.findIndex((item) => item.id === slot.projectId);
            let itemToInject: ScoredItem;

            if (existingIndex !== -1) {
                // If it exists, extract it (removes from current rank to move to pin)
                itemToInject = result.splice(existingIndex, 1)[0];
            } else {
                // Fallback: If for some reason not in candidate list (e.g. filtered), 
                // give it a default low score object (Service will handle hydration validation)
                itemToInject = { id: slot.projectId, categoryId: '', score: 999999 };
            }

            // Insert at designated position
            result.splice(slot.position, 0, itemToInject);
        }

        return result;
    }
}
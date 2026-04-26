/**
 * Dynamic mapping for expense types and labels based on cause categories.
 * Aligned with the Product Spec 1.1 for Medical, Education, and Community.
 */

export const CATEGORY_COST_TYPES: Record<string, { label: string; value: string }[]> = {
    medical: [
        { label: 'Surgery', value: 'SURGERY' },
        { label: 'Medication', value: 'MEDICATION' },
        { label: 'Hospital stay', value: 'HOSPITAL_STAY' },
        { label: 'Diagnostics', value: 'DIAGNOSTICS' },
        { label: 'Equipment', value: 'EQUIPMENT' },
        { label: 'Logistics', value: 'LOGISTICS' },
        { label: 'Other', value: 'OTHER' },
    ],
    education: [
        { label: 'Tuition fees', value: 'TUITION' },
        { label: 'Books and materials', value: 'MATERIALS' },
        { label: 'Accommodation', value: 'ACCOMMODATION' },
        { label: 'Research and projects', value: 'RESEARCH' },
        { label: 'Infrastructure', value: 'INFRASTRUCTURE' },
        { label: 'Logistics', value: 'LOGISTICS' },
        { label: 'Other', value: 'OTHER' },
    ],
    community: [
        { label: 'Infrastructure', value: 'INFRASTRUCTURE' },
        { label: 'Relief goods', value: 'RELIEF_GOODS' },
        { label: 'Training and workshops', value: 'TRAINING' },
        { label: 'Tools and equipment', value: 'TOOLS' },
        { label: 'Operations', value: 'OPERATIONS' },
        { label: 'Logistics', value: 'LOGISTICS' },
        { label: 'Other', value: 'OTHER' },
    ],
};

export const DEFAULT_COST_TYPES = [
    { label: 'Goods', value: 'GOODS' },
    { label: 'Service', value: 'SERVICE' },
    { label: 'Logistics', value: 'LOGISTICS' },
    { label: 'Other', value: 'OTHER' },
];
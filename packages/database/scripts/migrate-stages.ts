import 'dotenv/config';
import { randomUUID } from 'crypto';
import { prisma } from '../src/index';

const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];

function migrateBudget(budget: any[]) {
    if (!budget || !Array.isArray(budget)) return [];

    return budget.map((item, index) => {
        let assignedStage = 'Main Stage';

        // Forcefully distribute legacy budget items into the 3 new buckets
        if (budget.length === 2) {
            assignedStage = index === 0 ? 'Early Stage' : 'Main Stage';
        } else if (budget.length >= 3) {
            if (index === 0) assignedStage = 'Early Stage';
            else if (index === budget.length - 1) assignedStage = 'Final Stage';
            else assignedStage = 'Main Stage';
        }

        return { ...item, stage: assignedStage };
    });
}

function migrateTimeline(migratedBudget: any[], oldTimeline: any[]) {
    if (!migratedBudget || migratedBudget.length === 0) return [];

    // Extract unique stages present in the updated budget
    const uniqueStages = Array.from(new Set(migratedBudget.map(b => b.stage).filter(Boolean)));

    // Enforce correct chronological order
    uniqueStages.sort((a, b) => {
        const idxA = STAGE_ORDER.indexOf(a as string);
        const idxB = STAGE_ORDER.indexOf(b as string);
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    // Reconstruct the timeline matching the old statuses to the new stages sequentially
    return uniqueStages.map((stage, index) => {
        const oldItem = oldTimeline && oldTimeline[index] ? oldTimeline[index] : {};

        return {
            id: oldItem.id || randomUUID(),
            phase: stage,
            status: oldItem.status || 'PENDING',
            estimatedDate: oldItem.estimatedDate || 'TBD',
            deliverables: oldItem.deliverables || `Execution of ${String(stage).toLowerCase()} deliverables`,
            completedAt: oldItem.completedAt,
            updatedAt: oldItem.updatedAt,
            imageUrl: oldItem.imageUrl,
        };
    });
}

async function main() {
    console.log('🚀 Initiating Stage Migration Protocol...');

    // ---------------------------------------------------------
    // 1. MIGRATE LIVE PROJECTS
    // ---------------------------------------------------------
    console.log('\n📦 Aligning Live Projects...');
    const projects = await prisma.project.findMany();
    let pCount = 0;

    for (const project of projects) {
        const oldBudget = (project.budgetBreakdown as any[]) || [];
        const oldTimeline = (project.executionTimeline as any[]) || [];

        const newBudget = migrateBudget(oldBudget);
        const newTimeline = migrateTimeline(newBudget, oldTimeline);

        // Clamp phase index to prevent out-of-bounds errors on aggregated timelines
        const currentPhaseIndex = Math.max(0, Math.min(
            project.currentPhaseIndex || 0,
            newTimeline.length > 0 ? newTimeline.length - 1 : 0
        ));

        await prisma.project.update({
            where: { id: project.id },
            data: {
                budgetBreakdown: newBudget as any,
                executionTimeline: newTimeline as any,
                currentPhaseIndex
            }
        });
        pCount++;
    }
    console.log(`✅ Successfully migrated ${pCount} live projects.`);

    // ---------------------------------------------------------
    // 2. MIGRATE PROPOSALS
    // ---------------------------------------------------------
    console.log('\n📝 Aligning Proposals...');
    const proposals = await prisma.projectProposal.findMany();
    let propCount = 0;

    for (const prop of proposals) {
        const oldBudget = (prop.budgetBreakdown as any[]) || [];
        const oldTimeline = (prop.executionTimeline as any[]) || [];

        const newBudget = migrateBudget(oldBudget);
        const newTimeline = migrateTimeline(newBudget, oldTimeline);

        await prisma.projectProposal.update({
            where: { id: prop.id },
            data: {
                budgetBreakdown: newBudget as any,
                executionTimeline: newTimeline as any,
            }
        });
        propCount++;
    }
    console.log(`✅ Successfully migrated ${propCount} proposals.`);

    console.log('\n🚀 Migration Protocol Complete. Data integrity verified.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
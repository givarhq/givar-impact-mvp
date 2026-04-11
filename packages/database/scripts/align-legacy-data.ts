import 'dotenv/config';
import { randomUUID } from 'crypto';
import { prisma } from '../src/index';

async function main() {
    console.log('🚀 Initiating Legacy Data Alignment Protocol...');

    // 1. Fetch the new taxonomy tree
    const categories = await prisma.category.findMany({
        include: { subcategories: true }
    });

    if (categories.length === 0 || categories[0].subcategories.length === 0) {
        console.error('❌ Taxonomy missing. Please run `pnpm db:seed` on a fresh db or ensure subcategories exist.');
        process.exit(1);
    }

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Helper to generate realistic phased budgets based on Category
    const generateRealisticPhases = (categoryName: string, targetAmountMinor: bigint) => {
        const T = targetAmountMinor;

        // Split: 20% / 50% / 30% (Ensuring exact total via subtraction on the last phase)
        const p1Amount = (T * 20n) / 100n;
        const p2Amount = (T * 50n) / 100n;
        const p3Amount = T - p1Amount - p2Amount;

        let phases = [];

        if (categoryName.toLowerCase().includes('medical')) {
            phases = [
                { desc: "Diagnostics & Pre-Op Prep", costType: "SERVICE", vendor: "Prime Diagnostics Labs", amount: p1Amount },
                { desc: "Primary Surgery & Equipment", costType: "GOODS", vendor: "Continental Medical Supplies", amount: p2Amount },
                { desc: "Post-Op Care & Medication", costType: "MEDICATION", vendor: "LifeCare Pharmacy", amount: p3Amount }
            ];
        } else if (categoryName.toLowerCase().includes('education')) {
            phases = [
                { desc: "Infrastructure & Setup", costType: "SERVICE", vendor: "BuildWell Contractors", amount: p1Amount },
                { desc: "Tuition & Core Materials", costType: "TUITION", vendor: "Regional Education Board", amount: p2Amount },
                { desc: "Logistics & Final Assessments", costType: "LOGISTICS", vendor: "EduTransport Hub", amount: p3Amount }
            ];
        } else {
            phases = [
                { desc: "Procurement & Logistics", costType: "LOGISTICS", vendor: "Swift Transit Co.", amount: p1Amount },
                { desc: "Core Implementation", costType: "SERVICE", vendor: "Apex Community Works", amount: p2Amount },
                { desc: "Monitoring & Close-out", costType: "OTHER", vendor: "Givar Audit Partners", amount: p3Amount }
            ];
        }

        const budgetBreakdown = phases.map(p => ({
            id: randomUUID(),
            description: p.desc,
            costType: p.costType,
            payTo: p.vendor,
            amount: Number(p.amount) / 100 // Convert back to major units for the JSON storage format
        }));

        const executionTimeline = phases.map((p, i) => ({
            id: budgetBreakdown[i].id, // Map timeline to budget ID
            phase: `Phase ${i + 1}: ${p.desc.split('&')[0].trim()}`,
            estimatedDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PENDING',
            deliverables: `Verified receipts and visual proof of ${p.desc.toLowerCase()}`
        }));

        return { budgetBreakdown, executionTimeline };
    };

    // ---------------------------------------------------------
    // ALIGN PROJECTS (LIVE CAUSES)
    // ---------------------------------------------------------
    console.log('\n📦 Aligning Live Projects...');
    const projects = await prisma.project.findMany();
    let pCount = 0;

    for (const project of projects) {
        const cat = categoryMap.get(project.categoryId || '');
        if (!cat) continue;

        // Assign random subcategory from parent
        const subcats = cat.subcategories;
        const assignedSub = subcats[Math.floor(Math.random() * subcats.length)];

        // Generate Phased Math
        const { budgetBreakdown, executionTimeline } = generateRealisticPhases(cat.name, project.targetAmount);

        // Calculate currentPhaseIndex based on raisedAmount
        let currentPhaseIndex = 0;
        let cumulativeMajor = 0;
        const raisedMajor = Number(project.raisedAmount) / 100;

        for (let i = 0; i < budgetBreakdown.length; i++) {
            cumulativeMajor += budgetBreakdown[i].amount;
            if (raisedMajor >= cumulativeMajor) {
                currentPhaseIndex = i + 1; // Move to next phase
                executionTimeline[i].status = 'COMPLETED'; // Retrospectively complete past phases
            } else {
                if (raisedMajor > cumulativeMajor - budgetBreakdown[i].amount) {
                    executionTimeline[i].status = 'IN_PROGRESS';
                }
                break; // Stop at the active phase
            }
        }

        // Cap index to prevent out of bounds if overfunded
        if (currentPhaseIndex >= executionTimeline.length) {
            currentPhaseIndex = executionTimeline.length - 1;
        }

        await prisma.project.update({
            where: { id: project.id },
            data: {
                subcategoryId: assignedSub.id,
                budgetBreakdown: budgetBreakdown as any,
                executionTimeline: executionTimeline as any,
                currentPhaseIndex
            }
        });
        pCount++;
    }
    console.log(`✅ Successfully aligned ${pCount} live projects.`);

    // ---------------------------------------------------------
    // ALIGN PROPOSALS (DRAFTS & SUBMISSIONS)
    // ---------------------------------------------------------
    console.log('\n📝 Aligning Proposals...');
    const proposals = await prisma.projectProposal.findMany();
    let propCount = 0;

    for (const prop of proposals) {
        if (!prop.categoryId || !prop.targetAmount) continue;
        const cat = categoryMap.get(prop.categoryId);
        if (!cat) continue;

        const subcats = cat.subcategories;
        const assignedSub = subcats[Math.floor(Math.random() * subcats.length)];

        const { budgetBreakdown, executionTimeline } = generateRealisticPhases(cat.name, prop.targetAmount);

        await prisma.projectProposal.update({
            where: { id: prop.id },
            data: {
                subcategoryId: assignedSub.id,
                budgetBreakdown: budgetBreakdown as any,
                executionTimeline: executionTimeline as any,
            }
        });
        propCount++;
    }
    console.log(`✅ Successfully aligned ${propCount} proposals.`);

    console.log('\n🚀 Alignment Protocol Complete. You can safely start your app.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
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

        // Split: 20% / 50% / 30%
        const p1Amount = (T * 20n) / 100n;
        const p2Amount = (T * 50n) / 100n;
        const p3Amount = T - p1Amount - p2Amount;

        const p1A = p1Amount / 2n;
        const p1B = p1Amount - p1A;
        const p2A = p2Amount / 2n;
        const p2B = p2Amount - p2A;

        let vendors: any[] = [];
        let budgetBreakdown: any[] = [];

        if (categoryName.toLowerCase().includes('medical')) {
            const v1 = randomUUID(), v2 = randomUUID(), v3 = randomUUID();
            vendors = [
                { id: v1, name: 'Prime Diagnostics Labs', email: 'hello@primelabs.com', phone: '', subaccountCode: 'ACCT_11111111' },
                { id: v2, name: 'Continental Medical Supplies', email: 'sales@continental.com', phone: '', subaccountCode: 'ACCT_22222222' },
                { id: v3, name: 'LifeCare Pharmacy', email: 'support@lifecare.com', phone: '', subaccountCode: 'ACCT_33333333' }
            ];
            budgetBreakdown = [
                { id: randomUUID(), description: "Diagnostics", costType: "SERVICE", vendorId: v1, amount: Number(p1A) / 100, stage: 'Early Stage' },
                { id: randomUUID(), description: "Pre-Op Prep", costType: "SERVICE", vendorId: v1, amount: Number(p1B) / 100, stage: 'Early Stage' },
                { id: randomUUID(), description: "Primary Surgery", costType: "SERVICE", vendorId: v2, amount: Number(p2A) / 100, stage: 'Main Stage' },
                { id: randomUUID(), description: "Medical Equipment", costType: "GOODS", vendorId: v2, amount: Number(p2B) / 100, stage: 'Main Stage' },
                { id: randomUUID(), description: "Post-Op Care & Medication", costType: "MEDICATION", vendorId: v3, amount: Number(p3Amount) / 100, stage: 'Final Stage' }
            ];
        } else if (categoryName.toLowerCase().includes('education')) {
            const v1 = randomUUID(), v2 = randomUUID(), v3 = randomUUID();
            vendors = [
                { id: v1, name: 'BuildWell Contractors', email: '', phone: '', subaccountCode: 'ACCT_44444444' },
                { id: v2, name: 'Regional Education Board', email: '', phone: '', subaccountCode: 'ACCT_55555555' },
                { id: v3, name: 'EduTransport Hub', email: '', phone: '', subaccountCode: 'ACCT_66666666' }
            ];
            budgetBreakdown = [
                { id: randomUUID(), description: "Site Audit", costType: "SERVICE", vendorId: v1, amount: Number(p1A) / 100, stage: 'Early Stage' },
                { id: randomUUID(), description: "Clearance", costType: "SERVICE", vendorId: v1, amount: Number(p1B) / 100, stage: 'Early Stage' },
                { id: randomUUID(), description: "Tuition Fees", costType: "TUITION", vendorId: v2, amount: Number(p2A) / 100, stage: 'Main Stage' },
                { id: randomUUID(), description: "Core Materials", costType: "MATERIALS", vendorId: v2, amount: Number(p2B) / 100, stage: 'Main Stage' },
                { id: randomUUID(), description: "Logistics & Assessments", costType: "LOGISTICS", vendorId: v3, amount: Number(p3Amount) / 100, stage: 'Final Stage' }
            ];
        } else {
            const v1 = randomUUID(), v2 = randomUUID(), v3 = randomUUID();
            vendors = [
                { id: v1, name: 'Swift Transit Co.', email: '', phone: '', subaccountCode: 'ACCT_77777777' },
                { id: v2, name: 'Apex Community Works', email: '', phone: '', subaccountCode: 'ACCT_88888888' },
                { id: v3, name: 'Givar Audit Partners', email: '', phone: '', subaccountCode: 'ACCT_99999999' }
            ];
            budgetBreakdown = [
                { id: randomUUID(), description: "Procurement", costType: "LOGISTICS", vendorId: v1, amount: Number(p1A) / 100, stage: 'Early Stage' },
                { id: randomUUID(), description: "Logistics", costType: "LOGISTICS", vendorId: v1, amount: Number(p1B) / 100, stage: 'Early Stage' },
                { id: randomUUID(), description: "Core Implementation A", costType: "SERVICE", vendorId: v2, amount: Number(p2A) / 100, stage: 'Main Stage' },
                { id: randomUUID(), description: "Core Implementation B", costType: "SERVICE", vendorId: v2, amount: Number(p2B) / 100, stage: 'Main Stage' },
                { id: randomUUID(), description: "Monitoring & Close-out", costType: "OTHER", vendorId: v3, amount: Number(p3Amount) / 100, stage: 'Final Stage' }
            ];
        }

        const stages = ['Early Stage', 'Main Stage', 'Final Stage'];
        const executionTimeline = stages.map((phase, index) => {
            const items = budgetBreakdown.filter(b => b.stage === phase).map(b => b.description).join(', ');
            return {
                id: `stage-${index}-${randomUUID().slice(0, 4)}`,
                phase,
                estimatedDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'PENDING',
                deliverables: `Verified receipts and visual proof of ${items.toLowerCase()}`
            };
        });

        return { budgetBreakdown, executionTimeline, vendors };
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

        const subcats = cat.subcategories;
        const assignedSub = subcats[Math.floor(Math.random() * subcats.length)];

        const { budgetBreakdown, executionTimeline, vendors } = generateRealisticPhases(cat.name, project.targetAmount);

        // Advanced Dynamic Phase Index Calculator (Based purely on aggregate grouping)
        let currentPhaseIndex = 0;
        let cumulativeMajor = 0;
        const raisedMajor = Number(project.raisedAmount) / 100;

        for (let i = 0; i < executionTimeline.length; i++) {
            const phaseName = executionTimeline[i].phase;
            const phaseBudget = budgetBreakdown.filter(b => b.stage === phaseName).reduce((sum, b) => sum + b.amount, 0);
            cumulativeMajor += phaseBudget;

            if (raisedMajor >= cumulativeMajor) {
                currentPhaseIndex = i + 1; // Move to next phase
                executionTimeline[i].status = 'COMPLETED'; // Retrospectively complete past phases
            } else {
                if (raisedMajor > cumulativeMajor - phaseBudget) {
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
                vendors: vendors as any,
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

        const { budgetBreakdown, executionTimeline, vendors } = generateRealisticPhases(cat.name, prop.targetAmount);

        await prisma.projectProposal.update({
            where: { id: prop.id },
            data: {
                subcategoryId: assignedSub.id,
                budgetBreakdown: budgetBreakdown as any,
                executionTimeline: executionTimeline as any,
                vendors: vendors as any,
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
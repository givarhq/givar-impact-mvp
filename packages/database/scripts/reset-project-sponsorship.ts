import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from apps/api/.env, packages/database/.env, and root .env
dotenv.config({ path: resolve(__dirname, '../../../apps/api/.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

import { prisma } from '../src/index';

const TARGET_PROJECT = process.argv[2];

async function main() {
    if (!TARGET_PROJECT) {
        console.error('Please specify the project ID or slug: npx tsx packages/database/scripts/reset-project-sponsorship.ts <slug-or-id>');
        process.exit(1);
    }

    const cleanTarget = TARGET_PROJECT.trim();

    // Search by project ID, slug, or proposal ID
    const project = await prisma.project.findFirst({
        where: {
            OR: [
                { id: cleanTarget },
                { slug: cleanTarget },
                { proposalId: cleanTarget }
            ]
        },
        include: {
            guestDonations: {
                where: {
                    OR: [
                        { guestDonor: { isCorporate: true } },
                        { message: 'Corporate Sponsorship' }
                    ]
                }
            }
        }
    });

    if (!project) {
        console.error(`Project "${cleanTarget}" not found in database.`);
        const existingProjects = await prisma.project.findMany({
            select: { id: true, slug: true, title: true, proposalId: true },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        if (existingProjects.length > 0) {
            console.log('\nAvailable recent projects in this database:');
            existingProjects.forEach(p => {
                console.log(`- Title: "${p.title}" | Slug: "${p.slug}" | ID: "${p.id}"${p.proposalId ? ` | Proposal ID: "${p.proposalId}"` : ''}`);
            });
        } else {
            console.log('No projects found in this database. Please check your DATABASE_URL connection.');
        }
        process.exit(1);
    }

    if (project.guestDonations.length === 0) {
        console.log(`Project "${project.title}" has no corporate sponsorships to reset.`);
        return;
    }

    const corporateTotal = project.guestDonations.reduce((sum, d) => sum + d.amount, 0n);
    const donationIds = project.guestDonations.map(d => d.id);

    await prisma.$transaction(async (tx) => {
        // 1. Delete the corporate guest donations
        await tx.guestDonation.deleteMany({
            where: { id: { in: donationIds } }
        });

        // 2. Recalculate raised amount and reset project status
        const newRaised = project.raisedAmount - corporateTotal < 0n ? 0n : project.raisedAmount - corporateTotal;
        await tx.project.update({
            where: { id: project.id },
            data: {
                raisedAmount: newRaised,
                status: 'ACTIVE'
            }
        });

        // 3. Clean up audit logs
        await tx.auditLog.deleteMany({
            where: {
                action: 'CORPORATE_SPONSORSHIP_LOGGED',
                entityId: { in: donationIds }
            }
        });
    });

    console.log(`Successfully reset corporate sponsorship for "${project.title}".`);
    console.log(`Deducted ₦${(Number(corporateTotal) / 100).toLocaleString()} from raisedAmount.`);
    console.log(`Project status restored to ACTIVE.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
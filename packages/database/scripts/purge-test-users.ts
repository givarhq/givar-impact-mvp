import 'dotenv/config';
import { prisma } from '../src/index';
import { UserRole, VerificationStatus, ProposalStatus, ProjectStatus } from '@prisma/client';

async function main() {
    console.log('🚀 Starting Targeted User Purge Protocol...');

    const targetUserIds = [
        '8fd70e5c-b939-456f-92a3-d5235958ea9e', // Admin
        '94b6dc81-8be9-473b-9a73-9748ab160424', // Donor
        'cabbf781-122e-4e4b-acbf-839fcd54465e', // Admin
        'd3d58e30-ffd1-4848-8419-709de0cfc352'  // Donor
    ];

    await prisma.$transaction(async (tx) => {
        // 1. Identify all dependent descendant nodes
        const projects = await tx.project.findMany({
            where: { userId: { in: targetUserIds } },
            select: { id: true }
        });
        const projectIds = projects.map(p => p.id);

        const proposals = await tx.projectProposal.findMany({
            where: { userId: { in: targetUserIds } },
            select: { id: true }
        });
        const proposalIds = proposals.map(p => p.id);

        const wallets = await tx.wallet.findMany({
            where: { userId: { in: targetUserIds } },
            select: { id: true }
        });
        const walletIds = wallets.map(w => w.id);

        console.log(`Identified ${projectIds.length} projects, ${proposalIds.length} proposals, and ${walletIds.length} wallets to destroy.`);

        // 2. Clear project level descendants
        if (projectIds.length > 0) {
            await tx.featuredSlot.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.milestoneProof.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.disbursement.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.projectUpdate.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.message.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.subscription.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.guestDonation.deleteMany({ where: { projectId: { in: projectIds } } });
            await tx.donation.deleteMany({ where: { projectId: { in: projectIds } } });
        }

        // 3. Clear proposal level descendants
        if (proposalIds.length > 0) {
            await tx.message.deleteMany({ where: { proposalId: { in: proposalIds } } });
        }

        // 4. Clear wallet level descendants
        if (walletIds.length > 0) {
            await tx.donation.deleteMany({ where: { userId: { in: targetUserIds } } });
            await tx.walletTransaction.deleteMany({ where: { walletId: { in: walletIds } } });
        }

        // 5. Delete direct user assignments
        await tx.subscription.deleteMany({ where: { userId: { in: targetUserIds } } });
        await tx.givingGoal.deleteMany({ where: { userId: { in: targetUserIds } } });
        await tx.auditLog.deleteMany({ where: { userId: { in: targetUserIds } } });
        await tx.message.deleteMany({ where: { authorId: { in: targetUserIds } } });
        await tx.notification.deleteMany({ where: { userId: { in: targetUserIds } } });
        await tx.organizationProfile.deleteMany({ where: { userId: { in: targetUserIds } } });

        // 6. Handle active fee rules created by target admins to prevent foreign key errors
        const fallbackAdmin = await tx.user.findFirst({
            where: {
                role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
                id: { notIn: targetUserIds }
            },
            select: { id: true }
        });

        if (fallbackAdmin) {
            await tx.transactionFeeRule.updateMany({
                where: { createdById: { in: targetUserIds } },
                data: { createdById: fallbackAdmin.id }
            });
        } else {
            const rules = await tx.transactionFeeRule.findMany({
                where: { createdById: { in: targetUserIds } },
                select: { id: true }
            });
            const ruleIds = rules.map(r => r.id);
            if (ruleIds.length > 0) {
                await tx.donation.deleteMany({ where: { feeRuleId: { in: ruleIds } } });
                await tx.guestDonation.deleteMany({ where: { feeRuleId: { in: ruleIds } } });
                await tx.transactionFeeRule.deleteMany({ where: { id: { in: ruleIds } } });
            }
        }

        // 7. Delete parents
        if (proposalIds.length > 0) {
            await tx.projectProposal.deleteMany({ where: { id: { in: proposalIds } } });
        }
        if (projectIds.length > 0) {
            await tx.project.deleteMany({ where: { id: { in: projectIds } } });
        }
        if (walletIds.length > 0) {
            await tx.wallet.deleteMany({ where: { id: { in: walletIds } } });
        }

        // 8. Delete user nodes
        const result = await tx.user.deleteMany({
            where: { id: { in: targetUserIds } }
        });

        console.log(`Successfully purged ${result.count} users from the database.`);
    }, {
        timeout: 30000 // High timeout to accommodate large cascades
    });
}

main()
    .catch(e => {
        console.error('❌ Purge failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
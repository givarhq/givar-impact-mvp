import 'dotenv/config';
import { prisma } from '../src/index';

async function main() {
    console.log('🚀 Initiating Go-Live Clean Slate Protocol...');

    // 1. Identity Matrix Definitions
    // The sole account that retains ALL historical data and nodes (drafts, etc.)
    const FULLY_PROTECTED_ID = '196b3b1c-7418-4b08-9cb7-4f129845b8bd'; // phinehasuzochukwu@gmail.com

    // The core administration accounts to retain, but whose test nodes will be wiped
    const MAIN_ADMIN_ID = '12434608-75b7-499e-873f-4b53e4805a79'; // admin@givarapp.com
    const ACCOUNT_ONLY_IDS = [
        'cf8fb5ec-04ac-44d5-8d54-1282a4741187', // tedunjaiyem@gmail.com
        MAIN_ADMIN_ID,
        'c4e83791-fe53-4d51-8180-a76a91598f35'  // folarin@rytali.com
    ];

    const ALL_SAVED_USERS = [FULLY_PROTECTED_ID, ...ACCOUNT_ONLY_IDS];
    const notFullyProtected = { not: FULLY_PROTECTED_ID };
    const notAnySavedUser = { notIn: ALL_SAVED_USERS };

    await prisma.$transaction(async (tx) => {
        console.log('🧹 Purging isolated test tables...');
        // Total truncation for tables that have no relation to the real user's draft
        await tx.guestDonation.deleteMany({});
        await tx.guestDonor.deleteMany({});

        console.log('🛡️ Reassigning system dependencies to prevent cascade deletion...');
        // If any of the deleted test users authored a fee rule or legal document, 
        // we map it to the Main Admin to prevent those vital tables from being deleted.
        await tx.transactionFeeRule.updateMany({
            where: { createdById: notAnySavedUser },
            data: { createdById: MAIN_ADMIN_ID }
        });
        await tx.legalDocument.updateMany({
            where: { lastUpdatedBy: notAnySavedUser },
            data: { lastUpdatedBy: MAIN_ADMIN_ID }
        });

        console.log('🧹 Collapsing relational nodes for all non-protected accounts...');

        // Wipe messages sent by, or attached to projects owned by, non-protected users
        await tx.message.deleteMany({
            where: {
                OR: [
                    { authorId: notFullyProtected },
                    { project: { userId: notFullyProtected } },
                    { proposal: { userId: notFullyProtected } }
                ]
            }
        });

        // Wipe generic tracking records
        await tx.notification.deleteMany({ where: { userId: notFullyProtected } });
        await tx.auditLog.deleteMany({ where: { userId: notFullyProtected } });
        await tx.givingGoal.deleteMany({ where: { userId: notFullyProtected } });
        await tx.subscription.deleteMany({ where: { userId: notFullyProtected } });
        await tx.donation.deleteMany({ where: { userId: notFullyProtected } });

        // Wipe project dependencies
        const projectNotFullyProtected = { project: { userId: notFullyProtected } };
        await tx.featuredSlot.deleteMany({ where: projectNotFullyProtected });
        await tx.milestoneProof.deleteMany({ where: projectNotFullyProtected });
        await tx.disbursement.deleteMany({ where: projectNotFullyProtected });
        await tx.projectUpdate.deleteMany({ where: projectNotFullyProtected });
        await tx.projectReport.deleteMany({ where: projectNotFullyProtected });

        // Wipe wallet history
        await tx.walletTransaction.deleteMany({ where: { wallet: { userId: notFullyProtected } } });

        // Zero out wallets for the admins (ensuring they start production with clean 0.00 balances)
        await tx.wallet.updateMany({
            where: { userId: { in: ACCOUNT_ONLY_IDS } },
            data: { balance: 0n }
        });

        // Wipe core projects & proposals
        await tx.project.deleteMany({ where: { userId: notFullyProtected } });
        await tx.projectProposal.deleteMany({ where: { userId: notFullyProtected } });

        console.log('🧹 Executing final physical deletion of unregistered users...');
        await tx.organizationProfile.deleteMany({ where: { userId: notAnySavedUser } });
        await tx.wallet.deleteMany({ where: { userId: notAnySavedUser } });
        await tx.user.deleteMany({ where: { id: notAnySavedUser } });

    }, {
        timeout: 40000 // Extended timeout to accommodate large cascade trees
    });

    console.log('✅ Clean slate completed successfully.');
    console.log('🛡️ Phinehas account and nodes preserved.');
    console.log('🛡️ Tedunjaiye, Folarin, and Admin accounts preserved.');
    console.log('🛡️ Taxonomy, Fee Config, Discovery Algorithm, and Legal Docs preserved.');
}

main()
    .catch((e) => {
        console.error('❌ Clean slate execution failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
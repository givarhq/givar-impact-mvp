import 'dotenv/config';
import { prisma } from '../src/index';
import * as bcrypt from 'bcrypt';
import { Currency, UserRole, AccountType } from '@prisma/client';

async function main() {
    console.log('🚀 Initiating Clean Slate Protocol...');

    // 1. Purge dependants and transactional tables
    console.log('🧹 Purging transactional tables...');
    await prisma.notification.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.featuredSlot.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.milestoneProof.deleteMany({});
    await prisma.disbursement.deleteMany({});
    await prisma.projectUpdate.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.guestDonation.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.givingGoal.deleteMany({});
    await prisma.walletTransaction.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.projectProposal.deleteMany({});
    await prisma.organizationProfile.deleteMany({});
    await prisma.transactionFeeRule.deleteMany({});
    await prisma.guestDonor.deleteMany({});

    // 2. Anonymize and delete user profiles except target ones
    const preservedEmails = ['admin@givarapp.com', 'tedunjaiyem@gmail.com'];

    console.log('👥 Pruning non-essential identities...');

    // Clear wallets of users slated for deletion
    await prisma.wallet.deleteMany({
        where: {
            user: {
                email: { notIn: preservedEmails }
            }
        }
    });

    await prisma.user.deleteMany({
        where: {
            email: { notIn: preservedEmails }
        }
    });

    // 3. Self-healing setup: Ensure preserved identities are fully valid
    console.log('🔧 Verifying core system credentials...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Givartech1$', salt);
    const userPass = await bcrypt.hash('Password1', salt);

    // Upsert SuperAdmin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@givarapp.com' },
        update: {
            role: UserRole.SUPERADMIN,
            accountType: AccountType.INDIVIDUAL,
            emailVerified: true
        },
        create: {
            email: 'admin@givarapp.com',
            firstName: 'Givar',
            lastName: 'Admin',
            passwordHash: adminPass,
            role: UserRole.SUPERADMIN,
            emailVerified: true,
            accountType: AccountType.INDIVIDUAL
        }
    });

    // Upsert Matthew Tedunjaiye
    const organizer = await prisma.user.upsert({
        where: { email: 'tedunjaiyem@gmail.com' },
        update: {
            role: UserRole.USER,
            accountType: AccountType.ORGANIZER,
            emailVerified: true
        },
        create: {
            email: 'tedunjaiyem@gmail.com',
            firstName: 'Matthew',
            lastName: 'Tedunjaiye',
            passwordHash: userPass,
            role: UserRole.USER,
            emailVerified: true,
            accountType: AccountType.ORGANIZER
        }
    });

    // Ensure fresh, zero-balance NGN wallets exist for both users
    await prisma.wallet.upsert({
        where: { userId_currency: { userId: admin.id, currency: Currency.NGN } },
        update: { balance: 0n },
        create: { userId: admin.id, currency: Currency.NGN, balance: 0n }
    });

    await prisma.wallet.upsert({
        where: { userId_currency: { userId: organizer.id, currency: Currency.NGN } },
        update: { balance: 0n },
        create: { userId: organizer.id, currency: Currency.NGN, balance: 0n }
    });

    // Re-establish fresh compliance profile for Matthew
    await prisma.organizationProfile.upsert({
        where: { userId: organizer.id },
        update: {
            legalName: 'Ted Impact Ventures',
            registrationNumber: 'RC-TED-2024',
            status: 'VERIFIED',
            verifiedAt: new Date()
        },
        create: {
            userId: organizer.id,
            legalName: 'Ted Impact Ventures',
            registrationNumber: 'RC-TED-2024',
            status: 'VERIFIED',
            verifiedAt: new Date()
        }
    });

    console.log('✅ Clean slate completed successfully. Preserved core identities and category taxonomy.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
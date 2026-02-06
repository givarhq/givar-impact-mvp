import 'dotenv/config';
import {
  Currency, ProjectStatus, UserRole, ProposalStatus,
  VerificationStatus, AccountType, TxType, TxStatus,
  SubscriptionInterval, SubscriptionStatus, GoalInterval,
  GoalStatus, AuditAction, ProofStatus
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { subDays, addDays } from 'date-fns';
import { prisma } from '../src/index';

async function main() {
  console.log('🚀 Launching Optimized Forensic Seed (High-Capital Velocity & Professional Naming)...');

  // 1. CLEANUP
  console.log('🧹 Purging ledger...');
  await prisma.auditLog.deleteMany({});
  await prisma.milestoneProof.deleteMany({});
  await prisma.disbursement.deleteMany({});
  await prisma.projectUpdate.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.guestDonation.deleteMany({});
  await prisma.guestDonor.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.givingGoal.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.projectProposal.deleteMany({});
  await prisma.organizationProfile.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Givartech1$', salt);
  const userPass = await bcrypt.hash('Password1', salt);

  // 2. REALISTIC TAXONOMY (10 Categories)
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Clean Water & Sanitation', slug: 'water', icon: 'Droplets' } }),
    prisma.category.create({ data: { name: 'Quality Education', slug: 'education', icon: 'Book' } }),
    prisma.category.create({ data: { name: 'Healthcare Access', slug: 'health', icon: 'Heart' } }),
    prisma.category.create({ data: { name: 'Sustainable Agriculture', slug: 'agriculture', icon: 'Sprout' } }),
    prisma.category.create({ data: { name: 'Emergency Relief', slug: 'emergency', icon: 'Shield' } }),
    prisma.category.create({ data: { name: 'Climate Action', slug: 'climate', icon: 'Leaf' } }),
    prisma.category.create({ data: { name: 'Animal Welfare', slug: 'animals', icon: 'PawPrint' } }),
    prisma.category.create({ data: { name: 'Tech for Impact', slug: 'tech', icon: 'Cpu' } }),
    prisma.category.create({ data: { name: 'Arts & Youth Culture', slug: 'arts', icon: 'Palette' } }),
    prisma.category.create({ data: { name: 'Community Infrastructure', slug: 'community', icon: 'Building' } }),
  ]);

  // Optimized Stock Images (w=800, q=60)
  const photoParams = '?auto=format&fit=crop&q=60&w=800';
  const stockPhotos = [
    `https://images.unsplash.com/photo-1542601906990-b4d3fb778b09${photoParams}`,
    `https://images.unsplash.com/photo-1497633762265-9d179a990aa6${photoParams}`,
    `https://images.unsplash.com/photo-1584622650111-993a426fbf0a${photoParams}`,
    `https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad${photoParams}`,
    `https://images.unsplash.com/photo-1469571483398-62ff14bc03e0${photoParams}`,
    `https://images.unsplash.com/photo-1473081556163-2a1713ff9775${photoParams}`,
    `https://images.unsplash.com/photo-1591768793355-74d7c526cc15${photoParams}`,
    `https://images.unsplash.com/photo-1550751827-4bd374c3f58b${photoParams}`,
    `https://images.unsplash.com/photo-1460518451285-97b6aa326961${photoParams}`,
    `https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8${photoParams}`,
  ];

  const projectNouns = ['Initiative', 'Project', 'Drive', 'Fund', 'Mission', 'Hub', 'Action', 'Relief', 'Development', 'Grant'];

  // 3. USERS
  const adminUser = await prisma.user.create({
    data: { email: 'admin@givar.com', firstName: 'Givar', lastName: 'Admin', passwordHash: adminPass, role: UserRole.ADMIN, emailVerified: true, accountType: AccountType.INDIVIDUAL, createdAt: subDays(new Date(), 60) }
  });

  const tedUser = await prisma.user.create({
    data: { email: 'tedunjaiyem@gmail.com', firstName: 'Matthew', lastName: 'Tedunjaiye', passwordHash: userPass, role: UserRole.USER, emailVerified: true, accountType: AccountType.ORGANIZER, createdAt: subDays(new Date(), 45) }
  });

  const testUser = await prisma.user.create({
    data: { email: 'test@givar.com', firstName: 'Test', lastName: 'Giver', passwordHash: userPass, role: UserRole.USER, emailVerified: true, accountType: AccountType.INDIVIDUAL, createdAt: subDays(new Date(), 30) }
  });

  const backgroundDonors = [];
  for (let i = 0; i < 15; i++) {
    backgroundDonors.push(await prisma.user.create({
      data: { email: `donor${i}@example.com`, firstName: `Donor_${i}`, lastName: 'Verified', passwordHash: userPass, createdAt: subDays(new Date(), Math.floor(Math.random() * 40)) }
    }));
  }

  // 4. WALLETS (Starting with 10M NGN for donors to afford high velocity)
  await prisma.wallet.create({ data: { userId: adminUser.id, currency: Currency.NGN, balance: 0n } });
  await prisma.wallet.create({ data: { userId: tedUser.id, currency: Currency.NGN, balance: 0n } });

  const donorWallets = [];
  for (const donor of [...backgroundDonors, testUser]) {
    donorWallets.push(await prisma.wallet.create({
      data: { userId: donor.id, currency: Currency.NGN, balance: 1000000000n }
    }));
  }

  // 5. MATTHEW'S ORG PROFILE
  await prisma.organizationProfile.create({
    data: { userId: tedUser.id, legalName: 'Ted Impact Ventures', registrationNumber: 'RC-TED-2024', status: VerificationStatus.VERIFIED, verifiedAt: subDays(new Date(), 35) }
  });

  // 6. 10 PROPOSALS (Matthew)
  console.log('📥 Seeding 10 Proposals for Matthew...');
  const propStatuses = [
    ProposalStatus.DRAFT, ProposalStatus.SUBMITTED, ProposalStatus.AWAITING_VERIFICATION,
    ProposalStatus.UNDER_REVIEW, ProposalStatus.CHANGES_REQUESTED, ProposalStatus.REJECTED,
    ProposalStatus.APPROVED, ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW, ProposalStatus.DRAFT
  ];

  for (let i = 0; i < 10; i++) {
    const catIndex = i % 10;
    await prisma.projectProposal.create({
      data: {
        userId: tedUser.id,
        title: `${categories[catIndex].name} ${projectNouns[i]}`,
        shortDesc: `Proposal for regional ${categories[catIndex].name.toLowerCase()} enhancement.`,
        description: `Full technical implementation plan for ${categories[catIndex].name}. This cause targets systemic issues within the sector using verified procurement and local stakeholder engagement.`,
        categoryId: categories[catIndex].id,
        location: 'Lagos, Nigeria',
        targetAmount: BigInt(500000000 + (i * 20000000)), // 5M to 7M
        status: propStatuses[i],
        submittedAt: subDays(new Date(), i + 2),
        coverImage: stockPhotos[catIndex],
        budgetBreakdown: [{ id: randomUUID(), item: 'Initial Siting', cost: 450000, vendor: 'Surveyor Corps', type: 'SERVICE' }],
        executionTimeline: [{ id: `te-${i}`, phase: 'Inception', estimatedDate: '2026-04-01', deliverables: 'Audit and scoping' }],
      }
    });
  }

  // 7. 20 LIVE PROJECTS (5 Matthew, 15 Admin - No prefixes)
  console.log('🏗️ Seeding 20 Live Projects...');
  const liveProjects = [];
  for (let i = 0; i < 20; i++) {
    const ownerId = i < 5 ? tedUser.id : adminUser.id;
    const catIndex = i % 10;
    const project = await prisma.project.create({
      data: {
        userId: ownerId,
        title: `Regional ${categories[catIndex].name} ${projectNouns[(i + 5) % 10]}`,
        slug: `node-v${i + 1}-${randomUUID().slice(0, 4)}`,
        description: `Strategic operations for ${categories[catIndex].name.toLowerCase()} services in high-density urban corridors.`,
        shortDesc: `Active ${categories[catIndex].name.toLowerCase()} intervention.`,
        targetAmount: BigInt(2500000000 + (i * 100000000)), // 25M to 45M
        raisedAmount: 0n,
        currency: Currency.NGN,
        status: ProjectStatus.ACTIVE,
        categoryId: categories[catIndex].id,
        location: 'Abuja, Nigeria',
        imageUrl: stockPhotos[catIndex],
        executionTimeline: [
          { id: `m1-${i}`, phase: 'Procurement', status: 'COMPLETED', estimatedDate: '2026-02-01', deliverables: 'Hardware verified' },
          { id: `m2-${i}`, phase: 'Site Work', status: 'IN_PROGRESS', estimatedDate: '2026-03-01', deliverables: 'Personnel deployed' }
        ],
        createdAt: subDays(new Date(), 31)
      }
    });
    liveProjects.push(project);
  }

  // 8. 30-DAY LIQUIDITY VELOCITY (₦5,000.00 to ₦450,000.00 Range)
  console.log('📈 Simulating Multi-Million Transactional Throughput...');
  for (let day = 0; day < 30; day++) {
    const date = subDays(new Date(), day);
    const dailyEvents = Math.floor(Math.random() * 6); // Varying frequency

    for (let j = 0; j < dailyEvents; j++) {
      const donorWallet = donorWallets[Math.floor(Math.random() * donorWallets.length)];
      const project = liveProjects[Math.floor(Math.random() * liveProjects.length)];

      // LOGIC: Mix of community small gifts and larger "Impact Grant" figures
      const isLargeGift = Math.random() > 0.8;
      const amount = isLargeGift
        ? BigInt(Math.floor(Math.random() * 40000000) + 5000000) // 50,000 to 450,000
        : BigInt(Math.floor(Math.random() * 1000000) + 500000);   // 5,000 to 15,000

      const reference = `TXN-X-${day}-${j}-${randomUUID().slice(0, 4)}`;

      const walletTx = await prisma.walletTransaction.create({
        data: {
          walletId: donorWallet.id,
          amount,
          currency: Currency.NGN,
          type: TxType.DEBIT,
          status: TxStatus.COMPLETED,
          reference,
          description: `Contribution: ${project.title}`,
          createdAt: date
        }
      });

      await prisma.donation.create({
        data: { userId: donorWallet.userId, projectId: project.id, transactionId: walletTx.id, amount, currency: Currency.NGN, createdAt: date }
      });

      await prisma.project.update({
        where: { id: project.id },
        data: { raisedAmount: { increment: amount } }
      });
    }
  }

  // 9. DISBURSEMENTS (₦4,500,000.00)
  const targetProj = liveProjects[0];
  await prisma.disbursement.create({
    data: {
      projectId: targetProj.id,
      milestoneId: `m1-0`,
      amount: 450000000n,
      currency: Currency.NGN,
      vendorName: 'Continental Engineering Services',
      reference: 'BANK-TRF-V12-01'
    }
  });

  // 10. AUDIT LOGS
  for (let i = 0; i < 30; i++) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: i % 4 === 0 ? AuditAction.PROJECT_UPDATED : AuditAction.USER_LOGIN,
        entityType: 'SystemNode',
        createdAt: subDays(new Date(), i)
      }
    });
  }

  console.log('\n✨ Optimized Forensic Seed Finalized.');
  console.log('🔑 admin@givar.com / Givartech1$');
  console.log('🔑 tedunjaiyem@gmail.com / Password1');
  console.log('🔑 test@givar.com / Password1');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
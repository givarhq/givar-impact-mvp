import 'dotenv/config';
import {
  Currency, ProjectStatus, UserRole, ProposalStatus,
  VerificationStatus, AccountType, TxType, TxStatus, AuditAction, TxCategory, KycType, ModerationStatus
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { subDays } from 'date-fns';
import { prisma } from '../src/index';

async function main() {
  console.log('🚀 Launching Optimized Alignment Seed with Subcategories...');

  // 1. FORENSIC PURGE (Order matters due to foreign keys)
  console.log('🧹 Purging ledger & clearing existing nodes...');
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.featuredSlot.deleteMany({});
  await prisma.recommendationConfig.deleteMany({});
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
  await prisma.wallet.deleteMany({});
  await prisma.guestDonor.deleteMany({});
  await prisma.subcategory.deleteMany({}); // <-- NEW: Purge Subcategories
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Givartech1$', salt);
  const userPass = await bcrypt.hash('Password1', salt);

  // 2. CORE CATEGORIES & SUBCATEGORIES ALIGNMENT
  console.log('📂 Initializing Core Sectors and Subcategories...');

  // Create Main Categories
  const medicalCat = await prisma.category.create({ data: { name: 'Medical', slug: 'medical', icon: 'HeartPulse', visibilityWeight: 1.5 } });
  const educationCat = await prisma.category.create({ data: { name: 'Education', slug: 'education', icon: 'Book', visibilityWeight: 1.2 } });
  const communityCat = await prisma.category.create({ data: { name: 'Community', slug: 'community', icon: 'Building', visibilityWeight: 1.0 } });

  const categories = [medicalCat, educationCat, communityCat];

  // Create Subcategories
  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const medicalSubs = await Promise.all(
    ['Surgery', 'Emergency', 'Treatment', 'Cancer', 'Maternal', 'Disability'].map(name =>
      prisma.subcategory.create({ data: { name, slug: generateSlug(name), categoryId: medicalCat.id } })
    )
  );

  const educationSubs = await Promise.all(
    ['Tuition', 'Materials', 'Exams', 'Infrastructure', 'Scholarship'].map(name =>
      prisma.subcategory.create({ data: { name, slug: generateSlug(name), categoryId: educationCat.id } })
    )
  );

  const communitySubs = await Promise.all(
    ['Food', 'Shelter', 'Water', 'Infrastructure', 'Emergency'].map(name =>
      prisma.subcategory.create({ data: { name, slug: generateSlug(name), categoryId: communityCat.id } })
    )
  );

  const subcategoryMap = {
    [medicalCat.id]: medicalSubs,
    [educationCat.id]: educationSubs,
    [communityCat.id]: communitySubs,
  };

  // Optimized Stock Images
  const photoParams = '?auto=format&fit=crop&q=60&w=800';
  const stockPhotos = [
    `https://images.unsplash.com/photo-1505751172107-57325a3ec712${photoParams}`, // Medical
    `https://images.unsplash.com/photo-1497633762265-9d179a990aa6${photoParams}`, // Education
    `https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8${photoParams}`, // Community
  ];

  const projectNouns = ['Initiative', 'Project', 'Drive', 'Fund', 'Mission', 'Hub', 'Action', 'Relief', 'Development', 'Grant'];

  // 3. IDENTITIES & USERS
  console.log('👥 Generating Identities...');
  const adminUser = await prisma.user.create({
    data: { email: 'admin@givarapp.com', firstName: 'Givar', lastName: 'Admin', passwordHash: adminPass, role: UserRole.SUPERADMIN, emailVerified: true, accountType: AccountType.INDIVIDUAL, createdAt: subDays(new Date(), 60) }
  });

  const organizerUser = await prisma.user.create({
    data: { email: 'tedunjaiyem@gmail.com', firstName: 'Matthew', lastName: 'Tedunjaiye', passwordHash: userPass, role: UserRole.USER, emailVerified: true, accountType: AccountType.ORGANIZER, createdAt: subDays(new Date(), 45) }
  });

  const testUser = await prisma.user.create({
    data: { email: 'test@givarapp.com', firstName: 'Test', lastName: 'Giver', passwordHash: userPass, role: UserRole.USER, emailVerified: true, accountType: AccountType.INDIVIDUAL, createdAt: subDays(new Date(), 30) }
  });

  const backgroundDonors = [];
  for (let i = 0; i < 15; i++) {
    backgroundDonors.push(await prisma.user.create({
      data: { email: `donor${i}@example.com`, firstName: `Donor_${i}`, lastName: 'Verified', passwordHash: userPass, emailVerified: true, createdAt: subDays(new Date(), Math.floor(Math.random() * 40)) }
    }));
  }

  // 4. FINANCIAL GOVERNANCE & WALLETS
  console.log('🏦 Setting up Treasury & Fee Rules...');
  const feeRule = await prisma.transactionFeeRule.create({
    data: { percentage: 2.5, appliesGlobally: true, optionalTipEnabled: true, createdById: adminUser.id, isActive: true }
  });

  await prisma.recommendationConfig.create({
    data: { id: 'default', recencyWeight: 5.0, velocityWeight: 7.0, engagementWeight: 3.0, adminWeight: 4.0, diversityLimit: 3, showFundedProjects: false }
  });

  const adminWallet = await prisma.wallet.create({ data: { userId: adminUser.id, currency: Currency.NGN, balance: 0n } });
  await prisma.wallet.create({ data: { userId: organizerUser.id, currency: Currency.NGN, balance: 0n } });

  const donorWallets = [];
  for (const donor of [...backgroundDonors, testUser]) {
    donorWallets.push(await prisma.wallet.create({
      data: { userId: donor.id, currency: Currency.NGN, balance: 1000000000n }
    }));
  }

  // 5. ORGANIZATION PROFILES (HYBRID KYC)
  await prisma.organizationProfile.create({
    data: { userId: organizerUser.id, legalName: 'Ted Impact Ventures', registrationNumber: 'RC-TED-2024', kycType: KycType.ORGANIZATION, status: VerificationStatus.VERIFIED, verifiedAt: subDays(new Date(), 35) }
  });

  // 6. PROPOSALS
  console.log('📥 Seeding Cause Proposals...');
  const propStatuses = [
    ProposalStatus.DRAFT, ProposalStatus.SUBMITTED, ProposalStatus.AWAITING_VERIFICATION,
    ProposalStatus.UNDER_REVIEW, ProposalStatus.CHANGES_REQUESTED, ProposalStatus.REJECTED,
    ProposalStatus.APPROVED, ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW, ProposalStatus.DRAFT
  ];

  for (let i = 0; i < 10; i++) {
    const catIndex = i % 3;
    const activeCategory = categories[catIndex];
    const availableSubs = subcategoryMap[activeCategory.id];
    const activeSub = availableSubs[Math.floor(Math.random() * availableSubs.length)];

    await prisma.projectProposal.create({
      data: {
        userId: organizerUser.id,
        title: `${activeSub.name} ${projectNouns[i]}`,
        shortDesc: `Proposal for regional ${activeSub.name.toLowerCase()} enhancement.`,
        description: `Full technical implementation plan for ${activeSub.name}. This cause targets systemic issues within the sector using verified procurement and local stakeholder engagement.`,
        categoryId: activeCategory.id,
        subcategoryId: activeSub.id, // <-- NEW: Link Subcategory
        location: 'Lagos, Nigeria',
        targetAmount: BigInt(500000000 + (i * 20000000)), // 5M to 7M
        status: propStatuses[i],
        submittedAt: subDays(new Date(), i + 2),
        coverImage: stockPhotos[catIndex],
        budgetBreakdown: [{ id: randomUUID(), item: 'Initial Siting', cost: 450000, vendor: 'Surveyor Corps', type: 'SERVICE' }],
        executionTimeline: [{ id: `te-${i}`, phase: 'Inception', estimatedDate: '2026-04-01', deliverables: 'Audit and scoping' }],
        kycDocuments: ['proposals/doc-1.pdf'],
      }
    });
  }

  // 7. LIVE PROJECTS
  console.log('🏗️ Seeding Live Projects...');
  const liveProjects = [];
  for (let i = 0; i < 15; i++) {
    const ownerId = i < 5 ? organizerUser.id : adminUser.id;
    const catIndex = i % 3;
    const activeCategory = categories[catIndex];
    const availableSubs = subcategoryMap[activeCategory.id];
    const activeSub = availableSubs[Math.floor(Math.random() * availableSubs.length)];

    const project = await prisma.project.create({
      data: {
        userId: ownerId,
        title: `Regional ${activeSub.name} ${projectNouns[(i + 5) % 10]}`,
        slug: `cause-v${i + 1}-${randomUUID().slice(0, 4)}`,
        description: `Strategic operations for ${activeSub.name.toLowerCase()} services in high-density urban corridors.`,
        shortDesc: `Active ${activeSub.name.toLowerCase()} intervention.`,
        targetAmount: BigInt(2500000000 + (i * 100000000)), // 25M to 40M
        raisedAmount: 0n,
        currency: Currency.NGN,
        status: ProjectStatus.ACTIVE,
        moderationStatus: ModerationStatus.APPROVED,
        categoryId: activeCategory.id,
        subcategoryId: activeSub.id, // <-- NEW: Link Subcategory
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

  // 8. LIQUIDITY VELOCITY (With Accurate Fee Splits)
  console.log('📈 Simulating Transactional Throughput & Fee Deductions...');
  for (let day = 0; day < 30; day++) {
    const date = subDays(new Date(), day);
    const dailyEvents = Math.floor(Math.random() * 5) + 1;

    for (let j = 0; j < dailyEvents; j++) {
      const donorWallet = donorWallets[Math.floor(Math.random() * donorWallets.length)];
      const project = liveProjects[Math.floor(Math.random() * liveProjects.length)];

      const isLargeGift = Math.random() > 0.8;
      const baseAmount = isLargeGift
        ? BigInt(Math.floor(Math.random() * 40000000) + 5000000) // 50k to 450k
        : BigInt(Math.floor(Math.random() * 1000000) + 500000);   // 5k to 15k

      // Fee Math
      const feeAmount = (baseAmount * BigInt(Math.round(feeRule.percentage * 100))) / 10000n;
      const tipAmount = Math.random() > 0.7 ? 100000n : 0n; // 1,000 tip sometimes
      const totalCharge = baseAmount + feeAmount + tipAmount;

      const reference = `TXN-X-${day}-${j}-${randomUUID().slice(0, 4)}`;

      // Donor Debit
      const walletTx = await prisma.walletTransaction.create({
        data: {
          walletId: donorWallet.id,
          amount: totalCharge,
          currency: Currency.NGN,
          type: TxType.DEBIT,
          status: TxStatus.COMPLETED,
          category: TxCategory.DONATION,
          reference,
          description: `Contribution: ${project.title}`,
          createdAt: date
        }
      });

      // Treasury Credit (Fees & Tips)
      if (feeAmount > 0n || tipAmount > 0n) {
        await prisma.walletTransaction.create({
          data: {
            walletId: adminWallet.id,
            amount: feeAmount + tipAmount,
            currency: Currency.NGN,
            type: TxType.CREDIT,
            status: TxStatus.COMPLETED,
            category: TxCategory.TRANSACTION_FEE,
            reference: `FEE-${reference}`,
            description: `Operational Support Fee & Contribution: ${project.title}`,
            createdAt: date
          }
        });
        await prisma.wallet.update({
          where: { id: adminWallet.id },
          data: { balance: { increment: feeAmount + tipAmount } }
        });
      }

      await prisma.donation.create({
        data: {
          userId: donorWallet.userId,
          projectId: project.id,
          transactionId: walletTx.id,
          amount: totalCharge,
          baseAmount,
          feeAmount,
          tipAmount,
          feePercentageUsed: feeRule.percentage,
          feeRuleId: feeRule.id,
          currency: Currency.NGN,
          createdAt: date
        }
      });

      await prisma.project.update({
        where: { id: project.id },
        data: { raisedAmount: { increment: baseAmount } }
      });
    }
  }

  // 9. DISBURSEMENTS
  console.log('💸 Processing historical disbursements...');
  const targetProj = liveProjects[0];
  await prisma.disbursement.create({
    data: {
      projectId: targetProj.id,
      milestoneId: `m1-0`,
      amount: 450000000n, // 4.5M
      currency: Currency.NGN,
      vendorName: 'Continental Engineering Services',
      reference: 'BANK-TRF-V12-01'
    }
  });

  // 10. SYSTEM AUDIT LOGS
  console.log('🛡️ Generating Security Audit Logs...');
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: i % 3 === 0 ? AuditAction.PROJECT_UPDATED : AuditAction.USER_LOGIN,
        entityType: 'SystemNode',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: subDays(new Date(), i)
      }
    });
  }

  console.log('\n✨ Database Alignment Complete.');
  console.log('--- Development Credentials ---');
  console.log('Admin: admin@givarapp.com / Givartech1$');
  console.log('Organizer: tedunjaiyem@gmail.com / Password1');
  console.log('Donor: test@givarapp.com / Password1');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
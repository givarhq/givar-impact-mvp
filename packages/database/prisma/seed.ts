import 'dotenv/config';
import { Currency, ProjectStatus, UserRole, ProposalStatus, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '../src/index'; 

async function main() {
  console.log('🚀 Initializing Robust Seed...');

  await prisma.auditLog.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.guestDonation.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.projectProposal.deleteMany({});
  await prisma.organizationProfile.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('Givartech1$', salt);

  // 1. SEED USERS
  console.log('👤 Seeding System Personas...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@givar.com' },
    update: { passwordHash: password },
    create: {
      email: 'admin@givar.com',
      firstName: 'Givar',
      lastName: 'Admin',
      passwordHash: password,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  const proposer = await prisma.user.upsert({
    where: { email: 'test@givar.com' },
    update: { passwordHash: password },
    create: {
      email: 'test@givar.com',
      firstName: 'Chidi',
      lastName: 'Giver',
      passwordHash: password,
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  // Ensure Wallets
  for (const user of [admin, proposer]) {
    await prisma.wallet.upsert({
      where: { userId_currency: { userId: user.id, currency: Currency.NGN } },
      update: {},
      create: { userId: user.id, currency: Currency.NGN, balance: 0n }
    });
  }

  // 2. SEED ORGANIZATION PROFILE (Verification Gate)
  console.log('🛡️ Verifying Test Organization...');
  await prisma.organizationProfile.upsert({
    where: { userId: proposer.id },
    update: { status: VerificationStatus.VERIFIED },
    create: {
      userId: proposer.id,
      legalName: 'Global Impact Initiative (GII)',
      registrationNumber: 'RC-9928374',
      documentKeys: ['seeds/cac_cert.pdf', 'seeds/tax_clearance.pdf'],
      status: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
    }
  });

  // 3. SEED CATEGORIES
  console.log('🗂️ Seeding Taxonomy...');
  const categories = [
    { name: 'Clean Water', slug: 'water', icon: 'Droplets' },
    { name: 'Rural Education', slug: 'education', icon: 'Book' },
    { name: 'Sustainable Power', slug: 'power', icon: 'Zap' },
    { name: 'Health Equity', slug: 'health', icon: 'Heart' },
    { name: 'Emergency Relief', slug: 'emergency', icon: 'Shield' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  const dbCats = await prisma.category.findMany();

  // 4. SEED SUBMITTED PROPOSALS (The Admin Queue)
  console.log('📥 Filling Admin War Room Queue...');
  const locations = ['Kano, NG', 'Enugu, NG', 'Ibadan, NG', 'Accra, GH', 'Nairobi, KE'];
  
  for (let i = 0; i < 5; i++) {
    await prisma.projectProposal.create({
      data: {
        userId: proposer.id,
        title: `Proposal: ${dbCats[i].name} in ${locations[i]}`,
        shortDesc: `A highly feasible initiative targeting ${i + 5}00 direct beneficiaries.`,
        description: `This robust proposal outlines the deployment of ${dbCats[i].name} resources. We have conducted a 3-month feasibility study on the ground in ${locations[i]} and identified a massive gap. This project utilizes local vendors to ensure economic recycling within the community.`,
        categoryId: dbCats[i].id,
        location: locations[i],
        targetAmount: BigInt(2500000 + (i * 500000)),
        currency: Currency.NGN,
        status: ProposalStatus.SUBMITTED,
        coverImage: `https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=800`,
        budgetBreakdown: [
          { id: randomUUID(), item: 'Primary Equipment', cost: 1200000, vendor: 'Industrial Trust Ltd', type: 'GOODS' },
          { id: randomUUID(), item: 'Site Installation', cost: 400000, vendor: 'Local Engineering Co', type: 'SERVICE' },
          { id: randomUUID(), item: 'Community Training', cost: 200000, vendor: 'Impact Trainers', type: 'SERVICE' }
        ],
        executionTimeline: [
          { id: randomUUID(), phase: 'Logistics & Prep', estimatedDate: '2026-03-10', deliverables: 'Materials on site' },
          { id: randomUUID(), phase: 'Deployment', estimatedDate: '2026-04-15', deliverables: 'Full system operational' }
        ],
        riskAnalysis: "The primary risk involves currency fluctuation for imported components, which we have mitigated by locking in prices with vendors for 90 days.",
        contactPhone: "+234 812 345 6789",
        organizationName: "Global Impact Initiative",
        kycDocuments: ['seeds/id_proof.png'],
        submittedAt: new Date(),
      }
    });
  }

  // 5. SEED APPROVED PROPOSALS & CORRESPONDING LIVE PROJECTS
  console.log('✅ Seeding Success Stories (Approved + Live)...');
  for (let i = 0; i < 5; i++) {
    const slug = `successful-initiative-${i}`;
    const title = `Verified ${dbCats[i].name} Hub ${i + 1}`;
    
    // Create the "Historical" Proposal
    const proposal = await prisma.projectProposal.create({
      data: {
        userId: proposer.id,
        title,
        status: ProposalStatus.APPROVED,
        categoryId: dbCats[i].id,
        targetAmount: BigInt(1500000),
        approvedAt: new Date(),
        submittedAt: new Date(Date.now() - 172800000)
      }
    });

    // Create the actual Live Project result
    await prisma.project.create({
      data: {
        id: randomUUID(),
        slug,
        userId: proposer.id,
        title,
        description: `This project was successfully vetted and promoted from proposal ID ${proposal.id.split('-')[0]}.`,
        shortDesc: `Impactful ${dbCats[i].name} project.`,
        targetAmount: BigInt(1500000),
        raisedAmount: BigInt(Math.floor(Math.random() * 800000)), // Some partial funding
        currency: Currency.NGN,
        categoryId: dbCats[i].id,
        status: ProjectStatus.ACTIVE,
        imageUrl: `https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800`,
        location: 'Lagos, Nigeria',
        tags: ['Verified', 'Urgent'],
        isActive: true,
      }
    });
  }

  // 6. GENERAL LIVE PROJECTS
  console.log('🏗️ Seeding general platform projects...');
  for (let i = 0; i < 10; i++) {
    await prisma.project.create({
      data: {
        title: `Community Aid #${i + 1}`,
        slug: `community-aid-${i + 1}`,
        userId: admin.id,
        description: "A standard verified aid project to help with local community infrastructure.",
        targetAmount: BigInt(500000),
        currency: Currency.NGN,
        status: ProjectStatus.ACTIVE,
        categoryId: dbCats[i % dbCats.length].id,
        location: 'Abuja, Nigeria',
        tags: ['Verified'],
      }
    });
  }

  console.log('\n✨ SOTA Data Ecosystem Seeded Successfully.');
  console.log('🔑 Admin: admin@givar.com / Givartech1$');
  console.log('🔑 Proposer: test@givar.com / Givartech1$');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
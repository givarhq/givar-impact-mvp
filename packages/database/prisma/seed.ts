import 'dotenv/config'  // Loads .env locally (Render injects env vars directly)
import { PrismaClient, Currency, ProjectStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
})

async function main() {
  console.log('🌱 Seeding...')

  // 1. Categories
  const categories = [
    { name: 'Education', slug: 'education', icon: 'BookOpen' },
    { name: 'Environment', slug: 'environment', icon: 'Leaf' },
    { name: 'Health', slug: 'health', icon: 'HeartPulse' },
    { name: 'Emergency', slug: 'emergency', icon: 'AlertCircle' },
    { name: 'Community', slug: 'community', icon: 'Users' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  // 2. Ensure System Guest User & Wallets Exist
  const SYSTEM_GUEST_EMAIL = 'guest@givar.com'

  const guestUser = await prisma.user.upsert({
    where: { email: SYSTEM_GUEST_EMAIL },
    update: {},
    create: {
      email: SYSTEM_GUEST_EMAIL,
      firstName: 'System',
      lastName: 'Guest-Ledger',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fKb.U9H.microservice_locked_account', // Locked account
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  // Ensure Guest Wallets exist for all supported currencies
  const currencies: Currency[] = ['NGN', 'USD', 'GBP']
  for (const currency of currencies) {
    await prisma.wallet.upsert({
      where: {
        userId_currency: { userId: guestUser.id, currency },
      },
      update: {},
      create: {
        userId: guestUser.id,
        currency,
        balance: BigInt(0),
      },
    })
  }
  console.log('✅ System Guest Wallet Initialized')

  // 3. Dummy Projects (Create 20, idempotent via slug check)
  const categoryRecs = await prisma.category.findMany()

  for (let i = 1; i <= 20; i++) {
    const randomCat = categoryRecs[Math.floor(Math.random() * categoryRecs.length)]
    const target = BigInt(Math.floor(Math.random() * 5000000) + 100000) // 100k to ~5M NGN

    const slug = `impact-project-${i}`
    const exists = await prisma.project.findUnique({ where: { slug } })

    if (!exists) {
      await prisma.project.create({
        data: {
          title: `Impact Project ${i}: ${randomCat.name} Initiative`,
          slug,
          description: `This is a detailed description for project ${i}. It aims to solve critical issues in the ${randomCat.name} sector.`,
          shortDesc: `Solving ${randomCat.name} issues one step at a time.`,
          targetAmount: target,
          raisedAmount: BigInt(0), // Start empty
          currency: Currency.NGN,
          status: ProjectStatus.ACTIVE,
          categoryId: randomCat.id,
          location: 'Lagos, Nigeria',
          tags: ['Verified', 'Urgent'],
        },
      })
    }
  }

  console.log('✅ Seeding Complete')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
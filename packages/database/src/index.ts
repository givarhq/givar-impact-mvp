import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export * from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create the adapter (requires process.env.DATABASE_URL to be set)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
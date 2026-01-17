import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export * from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing in process.env')
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
})

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
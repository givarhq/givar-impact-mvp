import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

export * from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

const connectionString = `${process.env.DATABASE_URL}`

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is missing in process.env')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
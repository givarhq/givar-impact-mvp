import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export * from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

let prismaInstance: PrismaClient | undefined = globalForPrisma.prisma

if (!prismaInstance) {
  import('dotenv/config').then(() => {

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL missing after dotenv load')
    }

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })

    prismaInstance = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    })

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }
  }).catch(err => console.error('dotenv load failed in Prisma:', err))
}

export const prisma = prismaInstance!
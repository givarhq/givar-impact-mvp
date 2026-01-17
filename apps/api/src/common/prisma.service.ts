import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { prisma, PrismaClient } from '@givar/database'

@Injectable()
export class PrismaService
  implements OnModuleInit, OnModuleDestroy
{
  // 👇 This line makes PrismaService behave like PrismaClient
  constructor() {
    Object.assign(this, prisma)
  }

  async onModuleInit() {
    await prisma.$connect()
  }

  async onModuleDestroy() {
    await prisma.$disconnect()
  }
}

// 👇 CRITICAL: tell TypeScript this class IS a PrismaClient
export interface PrismaService extends PrismaClient {}

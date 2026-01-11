import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpsertGoalDto } from './dto/goal.dto';
import { GoalInterval, GoalStatus } from '@givar/database';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  // Upsert logic handles both creation and updates seamlessly.
  async upsertGoal(userId: string, dto: UpsertGoalDto) {
    const now = new Date();
    const startDate = dto.interval === 'MONTHLY' ? startOfMonth(now) : startOfYear(now);
    const endDate = dto.interval === 'MONTHLY' ? endOfMonth(now) : endOfYear(now);
    
    const data = {
        userId,
        targetAmount: BigInt(dto.targetAmount),
        currency: dto.currency,
        interval: dto.interval,
        status: GoalStatus.ACTIVE,
        startDate,
        endDate,
    };

    return this.prisma.givingGoal.upsert({
      where: {
        // Look for an existing ACTIVE goal for this user and interval
        userId_interval_status: {
          userId,
          interval: dto.interval,
          status: GoalStatus.ACTIVE,
        },
      },
      // If found, just update the target amount
      update: {
        targetAmount: BigInt(dto.targetAmount),
      },
      // If not found, create a new one
      create: data,
    });
  }

  // Calculates progress on the fly for real-time accuracy.
  async getActiveGoalProgress(userId: string, interval: GoalInterval) {
    const goal = await this.prisma.givingGoal.findFirst({
      where: { userId, interval, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!goal) return null;

    const donationsAggregate = await this.prisma.donation.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        createdAt: {
          gte: goal.startDate,
          lte: goal.endDate,
        },
      },
    });

    const currentAmount = donationsAggregate._sum.amount || 0n;
    const targetAmount = goal.targetAmount;
    const percentComplete = targetAmount > 0n 
      ? Math.min(100, Number((currentAmount * 10000n / targetAmount) / 100n))
      : 0;

    return {
      ...goal,
      currentAmount: currentAmount.toString(),
      percentComplete,
    };
  }
}
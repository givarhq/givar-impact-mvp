import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus } from '@givar/database';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 1. Dashboard Stats
  async getDashboardStats() {
    const [totalUsers, totalProjects, totalDonations, totalVolume] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.donation.count(),
      this.prisma.project.aggregate({ _sum: { raisedAmount: true } })
    ]);

    return {
      users: totalUsers,
      projects: totalProjects,
      donations: totalDonations,
      volume: totalVolume._sum.raisedAmount || 0n
    };
  }

  // 2. Project Moderation
  async approveProject(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ACTIVE, isActive: true }
    });
  }

  async suspendProject(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.SUSPENDED, isActive: false }
    });
  }

  // 3. User Management
  async getAllUsers(page = 1, limit = 20) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, emailVerified: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
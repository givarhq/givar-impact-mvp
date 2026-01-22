import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ProjectStatus } from '@givar/database';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard Stats
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

  async getAllProjects(query: any) {
    const { page = 1, limit = 20 } = query;
    return this.prisma.project.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { donations: true } } }
    });
  }

  // Project Moderation
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

  // User Management
  async getAllUsers(page = 1, limit = 20) {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, emailVerified: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectQueryDto, ProjectSort } from './dto/project-query.dto';
import { Prisma, ProjectStatus } from '@givar/database';

type ProjectMediaValue = {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
};

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const slug = this.generateSlug(dto.title);

    const galleryData: ProjectMediaValue[] = dto.gallery 
      ? dto.gallery.map(item => ({
          url: item.url,
          type: item.type as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
          caption: item.caption
        }))
      : [];
    
    return this.prisma.project.create({
      data: {
        title: dto.title,
        slug,
        userId: dto.userId,       
        description: dto.description,
        shortDesc: dto.shortDesc,
        imageUrl: dto.imageUrl,
        gallery: galleryData as Prisma.InputJsonValue, 
        targetAmount: BigInt(dto.targetAmount),
        currency: dto.currency,
        categoryId: dto.categoryId, 
        location: dto.location,
        tags: dto.tags || [],
        status: ProjectStatus.ACTIVE,
        isActive: true,
      },
    });
  }

  // Robust Search Engine
  async findAllAdvanced(query: ProjectQueryDto) {
    const { page = 1, limit = 9, search, category, status, sort } = query;
    const skip = (page - 1) * limit;

    // 1. Dynamic Filter Construction
    const where: Prisma.ProjectWhereInput = {
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.FUNDED, ProjectStatus.COMPLETED] },
      isActive: true, 
      ...(status && { status }),
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // 2. Dynamic Sorting
    let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
        case ProjectSort.OLDEST: orderBy = { createdAt: 'asc' }; break;
        case ProjectSort.MOST_FUNDED: orderBy = { raisedAmount: 'desc' }; break;
        case ProjectSort.ENDING_SOON: orderBy = { endDate: 'asc' }; break;
        default: orderBy = { createdAt: 'desc' };
    }

    // 3. Execution
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
            category: { select: { name: true, slug: true, icon: true } },
            _count: { select: { donations: true } },
            user: { 
              select: { 
                organization: { select: { status: true, legalName: true } } 
              } 
            }
        }
      }),
      this.prisma.project.count({ where }),
    ]);

    // 4. Data Transformation
    const data = projects.map((p) => {
      const raised = Number(p.raisedAmount || 0n);
      const target = Number(p.targetAmount || 0n);
      
      return {
        ...p,
        targetAmount: p.targetAmount.toString(),
        raisedAmount: p.raisedAmount.toString(),
        percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
        categoryName: p.category?.name,
        categorySlug: p.category?.slug,
        isVerifiedOrganizer: p.user?.organization?.status === 'VERIFIED',
        organizerName: p.user?.organization?.legalName || 'Individual'
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // Single Project Detail Fetcher
  async findOneWithUpdates(slug: string) {
      const project = await this.prisma.project.findUnique({
          where: { slug },
          include: {
              category: true,
              updates: { orderBy: { createdAt: 'desc' } },
              user: { 
                select: { 
                  organization: { select: { status: true, legalName: true, verifiedAt: true } } 
                } 
              }
          }
      });

      if (!project) throw new NotFoundException('Project not found');

      // 1. Count Unique Registered Users
      const userDonors = await this.prisma.donation.groupBy({
          by: ['userId'],
          where: { projectId: project.id },
      });

      // 2. Count Unique Guest Donors
      const guestDonors = await this.prisma.guestDonation.groupBy({
          by: ['guestDonorId'],
          where: { projectId: project.id },
      });

      // Unified Count (Users + Guests)
      const donorCount = userDonors.length + guestDonors.length;

      const raised = Number(project.raisedAmount);
      const target = Number(project.targetAmount);

      return {
          ...project,
          targetAmount: project.targetAmount.toString(),
          raisedAmount: project.raisedAmount.toString(),
          percentFunded: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
          donorCount: donorCount,
          isVerifiedOrganizer: project.user?.organization?.status === 'VERIFIED',
          organizerName: project.user?.organization?.legalName || 'Individual'
      };
  }

  async update(id: string, dto: UpdateProjectDto) {
    try {
      return await this.prisma.project.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      throw new NotFoundException('Project not found');
    }
  }

  async remove(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { isActive: false, status: ProjectStatus.SUSPENDED },
    });
  }

  async getPlatformStats() {
    const aggregate = await this.prisma.project.aggregate({
      _sum: { raisedAmount: true },
      where: { isActive: true },
    });
    
    const latestDonation = await this.prisma.donation.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { title: true } } }
    });

    return {
      totalVolume: aggregate._sum.raisedAmount || 0n,
      latestDonation: latestDonation ? {
          projectTitle: latestDonation.project.title,
          amount: latestDonation.amount,
          createdAt: latestDonation.createdAt
      } : null
    };
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  private generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
  }
}
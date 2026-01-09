import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const slug = dto.title
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    return this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        targetAmount: BigInt(dto.targetAmount),
        currency: dto.currency,
        imageUrl: dto.imageUrl,
        slug: `${slug}-${Date.now()}`, // Ensure uniqueness
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
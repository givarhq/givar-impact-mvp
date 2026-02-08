import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@givar/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { SubmitMilestoneProofDto } from './dto/evidence.dto';

@Controller('projects')
export class ProjectController {
  constructor(private service: ProjectService) { }

  // Public: Search & Pagination
  @Get()
  getAll(@Query() query: ProjectQueryDto) {
    return this.service.findAllAdvanced(query);
  }

  // Public: Single Project (SEO friendly) with full details
  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.service.findOneWithUpdates(slug);
  }

  @Public()
  @Get('stats/platform')
  getStats() {
    return this.service.getPlatformStats();
  }

  // Protected: Admin Only
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  // Protected: Admin Only
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  // Protected: Admin Only (Soft Delete)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @SkipThrottle()
  @Public()
  @Get('categories/list')
  getCategories() {
    return this.service.getAllCategories();
  }

  // Dedicated view for Project Owners to manage their live project
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/manage')
  async getOwnerView(@Req() req: any, @Param('id') id: string) {
    return this.service.getProjectForOwner(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/proof')
  async submitProof(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitMilestoneProofDto
  ) {
    return this.service.submitMilestoneProof(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('search/global')
  userSearch(@Req() req: any, @Query('q') query: string) {
    return this.service.userGlobalSearch(req.user.id, query);
  }
}
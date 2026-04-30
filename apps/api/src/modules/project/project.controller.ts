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
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';

@Controller('projects')
export class ProjectController {
  constructor(private service: ProjectService) { }

  // Public: Search & Pagination
  @Get()
  getAll(@Query() query: ProjectQueryDto) {
    return this.service.findAllAdvanced(query);
  }

  // Public: Single Project (SEO friendly) with full details
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug')
  getOne(@Req() req: any, @Param('slug') slug: string) {
    // Safely extract the user's email if they are authenticated to check their waitlist status
    return this.service.findOneWithUpdates(slug, req.user?.email);
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
  @Get('search/global')
  userSearch(@Req() req: any, @Query('q') query: string) {
    return this.service.userGlobalSearch(req.user.id, query);
  }

  // Global Ledger (All projects combined)
  @Public()
  @UseGuards(OptionalJwtAuthGuard) // Identify the user if logged in
  @Get('ledger/global')
  getGlobalLedger(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.service.getProjectLedger(null, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
      type,
      requestingUserId: req.user?.id
    });
  }

  // Project-Specific Ledger
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug/ledger')
  getProjectLedger(
    @Req() req: any,
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.service.getProjectLedger(slug, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
      type,
      requestingUserId: req.user?.id
    });
  }

  @Public()
  @Post(':id/waitlist')
  async joinWaitlist(@Param('id') id: string, @Body('email') email: string) {
    return this.service.joinWaitlist(id, email);
  }
}
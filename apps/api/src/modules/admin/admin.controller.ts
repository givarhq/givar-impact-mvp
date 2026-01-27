import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@givar/database';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('dashboard')
  getStats() {
    return this.service.getDashboardStats();
  }

  @Get('users')
  getUsers(@Query('page') page: number) {
    return this.service.getAllUsers(Number(page));
  }

  @Get('projects')
  async getProjects(@Query() query: any) {
    return this.service.getAllProjects(query);
  }

  @Patch('projects/:id/approve')
  approveProject(@Param('id') id: string) {
    return this.service.approveProject(id);
  }

  @Patch('projects/:id/suspend')
  suspendProject(@Param('id') id: string) {
    return this.service.suspendProject(id);
  }

  @Get('proposals')
  getProposals() {
    return this.service.getSubmittedProposals();
  }

  // Single Proposal Detail (Admins see everything including KYC)
  @Get('proposals/:id')
  async getProposalDetail(@Param('id') id: string) {
    return this.service.getProposalDetail(id);
  }

  @Patch('proposals/:id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.service.approveAndPromote(id, req.user.id);
  }

  @Patch('proposals/:id/reject')
  reject(@Param('id') id: string, @Req() req: any, @Body('feedback') feedback: string) {
    return this.service.rejectProposal(id, req.user.id, feedback);
  }
}
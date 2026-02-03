import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards, Delete, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountType, ProposalStatus, UserRole } from '@givar/database';
import { AdminService } from './admin.service';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateAdminProjectDto, UpdateAdminProjectDto } from './dto/admin-project.dto';
import { ResolveSuspenseDto } from './dto/admin-suspense.dto';
import { UpdateMilestoneDto } from './dto/admin-milestone.dto';
import { RecordDisbursementDto } from './dto/admin-disbursement.dto';
import { AdminProjectQueryDto } from './dto/admin-project-query.dto';

@SkipThrottle()
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private service: AdminService) { }

  @Get('dashboard')
  getStats() {
    return this.service.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('accountType') accountType?: AccountType,
    @Query('status') status?: 'LOCKED' | 'ACTIVE' | 'all',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.service.getAllUsers({
      page: Number(page) || 1,
      search,
      role,
      accountType,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Post('users/bulk')
  bulkUpdateUsers(
    @Req() req: any,
    @Body() dto: { userIds: string[], action: 'LOCK' | 'UNLOCK' | 'SET_USER' | 'SET_ADMIN' }
  ) {
    return this.service.bulkUpdateUsers(req.user.id, dto);
  }

  @Get('users/export')
  async exportUsers(
    @Query() query: any,
    @Res() res: Response
  ) {
    const csv = await this.service.exportUsersToCsv(query);
    const timestamp = new Date().toISOString().split('T')[0];

    res.header('Content-Type', 'text/csv');
    res.attachment(`givar-forensic-users-${timestamp}.csv`);
    return res.send(csv);
  }

  @Get('projects')
  async getProjects(@Query() query: AdminProjectQueryDto) {
    return this.service.getAllProjects(query);
  }

  @Get('proposals')
  getProposals(
    @Query('search') search?: string,
    @Query('status') status?: ProposalStatus,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getSubmittedProposals({
      search,
      status,
      category,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('projects')
  createProject(@Req() req: any, @Body() dto: CreateAdminProjectDto) {
    return this.service.createProject(req.user.id, dto);
  }

  @Post('reconcile')
  executeReconciliation(@Req() req: any, @Body('reference') ref: string) {
    return this.service.executeReconciliation(req.user.id, ref);
  }

  @Get('suspense')
  getSuspense() {
    return this.service.getSuspenseTransactions();
  }

  /**
   * Paginated Evidence Queue
   * Exposes the forensic evidence table to the admin frontend
   */
  @Get('evidence/pending')
  getPendingEvidence(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'all',
    @Query('search') search?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.service.getEvidenceQueue({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
      projectId,
      status: status || 'PENDING',
      search,
      sort,
    });
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.service.getUserDetail(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('action') action: 'LOCK' | 'UNLOCK'
  ) {
    return this.service.updateUserStatus(req.user.id, id, action);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body('role') role: UserRole
  ) {
    return this.service.updateUserRole(req.user.id, id, role);
  }

  @Patch('projects/:id/approve')
  approveProject(@Param('id') id: string) {
    return this.service.approveProject(id);
  }

  @Patch('projects/:id/suspend')
  suspendProject(@Param('id') id: string) {
    return this.service.suspendProject(id);
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

  @Patch('projects/:id') // Using Patch for partial updates
  updateProject(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAdminProjectDto) {
    return this.service.updateProject(req.user.id, id, dto);
  }

  @Delete('projects/:id')
  deleteProject(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteProject(req.user.id, id);
  }

  @Get('projects/:id')
  getProjectById(@Param('id') id: string) {
    return this.service.getProjectById(id);
  }

  @Get('reconcile/verify/:reference')
  verifyExternal(@Param('reference') ref: string) {
    return this.service.verifyExternalTransaction(ref);
  }

  @Patch('suspense/:id/resolve')
  resolveSuspense(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveSuspenseDto
  ) {
    return this.service.resolveSuspenseTransaction(req.user.id, id, dto);
  }

  @Patch('projects/:id/milestones/:milestoneId')
  updateMilestone(
    @Req() req: any,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.service.updateProjectMilestone(
      projectId,
      milestoneId,
      dto.status,
      dto,
      req.user.id
    );
  }

  /**
   * Review Evidence
   */
  @Patch('evidence/:id/review')
  async reviewEvidence(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; feedback?: string }
  ) {
    return this.service.reviewMilestoneProof(
      req.user.id,
      id,
      body.status,
      body.feedback
    );
  }

  @Post('projects/:id/disbursements')
  recordDisbursement(
    @Req() req: any,
    @Param('id') projectId: string,
    @Body() dto: RecordDisbursementDto
  ) {
    return this.service.recordDisbursement(req.user.id, projectId, dto);
  }

  @Patch('proposals/:id/request-changes')
  requestChanges(@Param('id') id: string, @Req() req: any, @Body('feedback') feedback: string) {
    return this.service.requestChanges(id, req.user.id, feedback);
  }
}
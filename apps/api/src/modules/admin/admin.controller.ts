import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards, Delete, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProposalStatus, UserRole } from '@givar/database';
import { AdminService } from './admin.service';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateAdminProjectDto, UpdateAdminProjectDto } from './dto/admin-project.dto';
import { ResolveSuspenseDto } from './dto/admin-suspense.dto';
import { UpdateMilestoneDto } from './dto/admin-milestone.dto';
import { RecordDisbursementDto } from './dto/admin-disbursement.dto';

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

  @Post('projects')
  createProject(@Req() req: any, @Body() dto: CreateAdminProjectDto) {
    return this.service.createProject(req.user.id, dto);
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

  @Post('reconcile')
  executeReconciliation(@Req() req: any, @Body('reference') ref: string) {
    return this.service.executeReconciliation(req.user.id, ref);
  }

  @Get('suspense')
  getSuspense() {
    return this.service.getSuspenseTransactions();
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

  @Get('evidence/pending')
  getPendingEvidence() {
    return this.service.getPendingProofs();
  }

  /**
   * Secure Evidence Audit Endpoint
   * Only accessible by Admins
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
}
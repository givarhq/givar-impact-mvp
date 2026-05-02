import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards, Delete, Post, Res, ForbiddenException } from '@nestjs/common';
import { type Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountType, ProposalStatus, UserRole } from '@givar/database';
import { AdminService } from './admin.service';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateAdminProjectDto, UpdateAdminProjectDto } from './dto/admin-project.dto';
import { UpdateMilestoneDto } from './dto/admin-milestone.dto';
import { RecordDisbursementDto } from './dto/admin-disbursement.dto';
import { AdminProjectQueryDto } from './dto/admin-project-query.dto';
import { AdminFinanceQueryDto } from './dto/admin-finance.dto';

@SkipThrottle()
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminController {
  constructor(private service: AdminService) { }

  @Get('analytics/full-report')
  async getFullAnalyticsReport() {
    return this.service.getDetailedAnalytics();
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

  @Post('projects/:id/finalize')
  finalizeProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { completionNote: string; imageUrl?: string }
  ) {
    return this.service.finalizeProject(req.user.id, id, dto);
  }

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

  @Patch('projects/:id')
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

  @Patch('proposals/:id/awareness')
  updateAwarenessStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body('status') status: string
  ) {
    return this.service.updateAwarenessStatus(id, req.user.id, status);
  }

  @Post('users/:id/impersonate')
  async impersonate(@Req() req: any, @Param('id') id: string) {
    return this.service.impersonateUser(req.user.id, id);
  }

  @Get('search')
  globalSearch(@Query('q') query: string) {
    return this.service.globalSearch(query);
  }

  @Post('ledger/sweep')
  async triggerDustSweep(@Req() req: any) {
    if (req.user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Root access required for ledger sweep.');
    }
    return this.service.sweepStaleSmallRemainderProjects(req.user.id);
  }

  @Post('projects/bulk')
  async bulkUpdateProjects(
    @Req() req: any,
    @Body() dto: { projectIds: string[], action: 'ACTIVATE' | 'SUSPEND' | 'DELETE' }
  ) {
    return this.service.bulkUpdateProjects(req.user.id, dto);
  }

  @Post('proposals/bulk')
  async bulkUpdateProposals(
    @Req() req: any,
    @Body() dto: { proposalIds: string[], action: 'APPROVE' | 'REJECT' }
  ) {
    return this.service.bulkUpdateProposals(req.user.id, dto);
  }

  @Get('finances/report')
  async getFinanceReport(@Query() query: AdminFinanceQueryDto) {
    return this.service.getFinancialReport(query);
  }

  @Get('finances/export')
  async exportFinanceCsv(
    @Query() query: AdminFinanceQueryDto,
    @Res() res: Response
  ) {
    const csv = await this.service.exportFinancialsToCsv(query);
    const filename = `givar-forensic-finance-${new Date().toISOString().split('T')[0]}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send(csv);
  }

  @Post('categories')
  createCategory(
    @Req() req: any,
    @Body() dto: { name: string; description?: string; icon?: string }
  ) {
    return this.service.createCategory(req.user.id, dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; icon?: string }
  ) {
    return this.service.updateCategory(req.user.id, id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteCategory(req.user.id, id);
  }

  @Post('categories/:id/subcategories')
  createSubcategory(
    @Req() req: any,
    @Param('id') categoryId: string,
    @Body() dto: { name: string }
  ) {
    return this.service.createSubcategory(req.user.id, categoryId, dto);
  }

  @Patch('subcategories/:id')
  updateSubcategory(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { name: string }
  ) {
    return this.service.updateSubcategory(req.user.id, id, dto);
  }

  @Delete('subcategories/:id')
  deleteSubcategory(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteSubcategory(req.user.id, id);
  }

  @Get('paystack/banks')
  getPaystackBanks() {
    return this.service.getPaystackBanks();
  }

  @Post('paystack/subaccount')
  createPaystackSubaccount(
    @Req() req: any,
    @Body() dto: { businessName: string; bankCode: string; accountNumber: string; vendorEmail?: string }
  ) {
    return this.service.createPaystackSubaccount(req.user.id, dto);
  }

  @Patch('proposals/:id/budget/:budgetItemId/bind-vendor')
  bindProposalVendor(
    @Req() req: any,
    @Param('id') id: string,
    @Param('budgetItemId') budgetItemId: string,
    @Body() dto: { vendorId?: string; vendorName?: string; vendorEmail?: string; vendorPhone?: string; subaccountCode: string }
  ) {
    return this.service.bindProposalVendor(req.user.id, id, budgetItemId, dto);
  }
}
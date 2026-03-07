import { Controller, Get, Patch, Body, UseGuards, Req, Post, Delete, Param, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@givar/database';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('recommendations')
export class RecommendationsController {
    constructor(private readonly service: RecommendationsService) { }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('featured')
    async getFeatured(@Req() req: any) {
        return this.service.getFeatured(req.user?.id);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('feed')
    async getFeed(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        const pageNum = page ? Number(page) : 1;
        const limitNum = limit ? Number(limit) : 24;

        return this.service.getDiscoveryFeed(req.user?.id, pageNum, limitNum);
    }

    // --- Admin Configuration (Audited) ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Get('admin/config')
    async getConfig() {
        return this.service.getRecommendationConfig();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('admin/config')
    async updateConfig(@Req() req: any, @Body() dto: any) {
        return this.service.updateConfig(dto, req.user.id);
    }

    // --- Featured Slot Management (Audited) ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Get('admin/slots')
    async getSlots() {
        return this.service.getSlots();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Post('admin/slots')
    async createSlot(@Req() req: any, @Body() dto: { projectId: string; position: number; expiresAt?: string }) {
        return this.service.createSlot(dto, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Delete('admin/slots/:id')
    async deleteSlot(@Req() req: any, @Param('id') id: string) {
        return this.service.deleteSlot(id, req.user.id);
    }

    // --- Sector Prioritization (Audited) ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('admin/category/:id/weight')
    async updateCategoryWeight(
        @Req() req: any,
        @Param('id') id: string,
        @Body('weight') weight: number
    ) {
        return this.service.updateCategoryWeight(id, weight, req.user.id);
    }

    // --- Individual Project Overrides (Audited) ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('admin/project/:id/weights')
    async updateProjectWeights(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: { featureWeight?: number; visibilityScore?: number; moderationStatus?: any }
    ) {
        return this.service.updateProjectWeights(id, dto, req.user.id);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('grouped')
    async getGroupedFeed(
        @Req() req: any,
        @Query('limit') limit?: number
    ) {
        const limitNum = limit ? Number(limit) : 3;
        return this.service.getGroupedFeed(req.user?.id, limitNum);
    }
}
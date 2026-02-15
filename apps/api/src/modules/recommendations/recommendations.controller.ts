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

    /**
     * Public/Guest: Get the "Featured" carousel items (Top 5).
     * Personalization applied if Authorization header is present.
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('featured')
    async getFeatured(@Req() req: any) {
        return this.service.getFeatured(req.user?.id);
    }

    /**
     * Public/Guest: Get the main "Discovery" feed.
     * Supports pagination for infinite scrolling.
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('feed')
    async getFeed(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        const pageNum = page ? Number(page) : 1;
        const limitNum = limit ? Number(limit) : 24;

        return this.service.getDiscoveryFeed(
            req.user?.id,
            pageNum,
            limitNum
        );
    }

    // --- Admin Configuration Endpoints ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Get('admin/config')
    async getConfig() {
        return this.service.getRecommendationConfig();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('admin/config')
    async updateConfig(@Body() dto: any) {
        return this.service.updateConfig(dto);
    }

    // --- Featured Slot Management ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Get('admin/slots')
    async getSlots() {
        return this.service.getSlots();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Post('admin/slots')
    async createSlot(@Body() dto: { projectId: string; position: number; expiresAt?: string }) {
        return this.service.createSlot(dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Delete('admin/slots/:id')
    async deleteSlot(@Param('id') id: string) {
        return this.service.deleteSlot(id);
    }

    // --- Sector Prioritization ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('admin/category/:id/weight')
    async updateCategoryWeight(
        @Param('id') id: string,
        @Body('weight') weight: number
    ) {
        return this.service.updateCategoryWeight(id, weight);
    }

    // --- Individual Project Overrides ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('admin/project/:id/weights')
    async updateProjectWeights(
        @Param('id') id: string,
        @Body() dto: { featureWeight?: number; visibilityScore?: number; moderationStatus?: any }
    ) {
        return this.service.updateProjectWeights(id, dto);
    }
}
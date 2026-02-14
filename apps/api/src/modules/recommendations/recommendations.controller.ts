import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
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
    async getFeed(@Req() req: any) {
        return this.service.getDiscoveryFeed(req.user?.id);
    }

    // --- Admin Endpoints ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Get('config')
    async getConfig() {
        return this.service.getRecommendationConfig();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Patch('config')
    async updateConfig(@Body() dto: any) {
        return this.service.updateConfig(dto);
    }
}
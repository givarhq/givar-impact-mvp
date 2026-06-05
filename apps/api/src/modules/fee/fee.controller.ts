import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@givar/database';
import { FeeService } from './fee.service';
import { Public } from '../../common/decorators/public.decorator';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateFeeRuleDto {
    @IsNumber()
    @Min(0)
    @Max(20)
    percentage!: number;

    @IsBoolean()
    optionalTipEnabled!: boolean;

    @IsEnum(['GLOBAL', 'CATEGORY', 'SUBCATEGORY', 'PROJECT'])
    targetType!: 'GLOBAL' | 'CATEGORY' | 'SUBCATEGORY' | 'PROJECT';

    @IsOptional()
    @IsString()
    targetId?: string;

    @IsString()
    totpCode!: string;
}

@Controller('fees')
export class FeePublicController {
    constructor(private readonly feeService: FeeService) { }

    /**
     * Public endpoint for the frontend to calculate dynamic UI totals
     */
    @Public()
    @Get('current')
    async getPublicFee() {
        const rule = await this.feeService.getActiveRule();
        return {
            percentage: rule.percentage,
            optionalTipEnabled: rule.optionalTipEnabled
        };
    }
}

@Controller('admin/fees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeeAdminController {
    constructor(private readonly feeService: FeeService) { }

    @Get('current')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    async getCurrentFee() {
        return this.feeService.getActiveRule();
    }

    @Get('history')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    async getFeeHistory() {
        return this.feeService.getFeeHistory();
    }

    @Post('update')
    @Roles(UserRole.SUPERADMIN)
    async updateGlobalRule(@Req() req: any, @Body() dto: UpdateFeeRuleDto) {
        return this.feeService.createRule(
            req.user.id,
            dto.percentage,
            dto.optionalTipEnabled,
            dto.totpCode,
            dto.targetType,
            dto.targetId
        );
    }
}
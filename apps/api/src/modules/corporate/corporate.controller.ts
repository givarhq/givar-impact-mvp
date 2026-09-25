import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CreateCorporateEnquiryDto } from './dto/corporate.dto';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import type { Request } from 'express';

@Controller('corporate')
export class CorporateController {
    constructor(private readonly corporateService: CorporateService) { }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('enquiry')
    @HttpCode(HttpStatus.OK)
    async createEnquiry(
        @Body() dto: CreateCorporateEnquiryDto,
        @Req() req: Request,
    ) {
        return this.corporateService.createEnquiry(dto, req);
    }
}
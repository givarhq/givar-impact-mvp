import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DonationService } from './donation.service';
import { CreateDonationDto, InitiateDirectDonationDto } from './dto/donation.dto';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dto/subscription.dto';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';

@Controller('donations')
export class DonationController {
  constructor(private service: DonationService) { }

  // 1. Standard User Donation (Strict Auth)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  donate(@Req() req: any, @Body() dto: CreateDonationDto) {
    return this.service.donate(req.user.id, dto);
  }

  // 2. History (Strict Auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('my-history')
  getHistory(@Req() req: any) {
    return this.service.getUserDonations(req.user.id);
  }

  // 3. Direct Donation (OPTIONAL Auth)
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('direct')
  async initiateDirect(@Req() req: any, @Body() dto: InitiateDirectDonationDto) {
    const user = req.user;
    return this.service.initiateDirectDonation(user, dto);
  }

  // 4. Subscriptions (Strict Auth)
  @UseGuards(AuthGuard('jwt'))
  @Post('subscribe')
  createSubscription(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    // COMPLIANCE LOCK: Recurring subscriptions are disabled because they rely on 
    // custodial wallet balances which are turned off for regulatory compliance.
    throw new ForbiddenException('Recurring donations are temporarily paused. Please use one-time direct payments.');
  }

  // 5. Subscription List (Strict Auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('subscriptions')
  getMySubscriptions(@Req() req: any) {
    return this.service.getMySubscriptions(req.user.id);
  }

  // 6. Update Subscription Status (Strict Auth)
  @UseGuards(AuthGuard('jwt'))
  @Patch('subscriptions/:id')
  updateSubscription(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionStatusDto,
  ) {
    return this.service.updateSubscriptionStatus(req.user.id, id, dto);
  }
}
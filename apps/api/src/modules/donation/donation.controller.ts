import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DonationService } from './donation.service';
import { CreateDonationDto, InitiateDirectDonationDto } from './dto/donation.dto';
import { CreateSubscriptionDto } from './dto/subscription.dto';

@Controller('donations')
@UseGuards(AuthGuard('jwt'))
export class DonationController {
  constructor(private service: DonationService) {}

  @Post()
  donate(@Req() req: any, @Body() dto: CreateDonationDto) {
    return this.service.donate(req.user.id, dto);
  }

  @Get('my-history')
  getHistory(@Req() req: any) {
    return this.service.getUserDonations(req.user.id);
  }

  @Post('direct')
  initiateDirect(@Req() req: any, @Body() dto: InitiateDirectDonationDto) {
    return this.service.initiateDirectDonation(req.user.id, req.user.email, dto);
  }

  @Post('subscribe')
  createSubscription(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.service.createSubscription(req.user.id, dto);
  }

  @Get('subscriptions')
  getMySubscriptions(@Req() req: any) {
    return this.service.getMySubscriptions(req.user.id);
  }
}
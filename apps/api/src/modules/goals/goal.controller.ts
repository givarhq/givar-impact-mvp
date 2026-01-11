import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoalService } from './goal.service';
import { UpsertGoalDto } from './dto/goal.dto';
import { GoalInterval } from '@givar/database';

@Controller('goals')
@UseGuards(AuthGuard('jwt'))
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  upsertGoal(@Req() req: any, @Body() dto: UpsertGoalDto) {
    return this.goalService.upsertGoal(req.user.id, dto);
  }

  @Get('active')
  getActiveGoalProgress(
    @Req() req: any,
    @Query('interval') interval: GoalInterval,
  ) {
    // Validate that a valid interval is passed, default to MONTHLY
    const validInterval = interval || GoalInterval.MONTHLY;
    return this.goalService.getActiveGoalProgress(req.user.id, validInterval);
  }
}
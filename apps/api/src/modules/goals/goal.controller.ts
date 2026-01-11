import { Body, Controller, Get, NotFoundException, Post, Query, Req, UseGuards } from '@nestjs/common'; // SOTA: Add NotFoundException
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
  async getActiveGoalProgress(
    @Req() req: any,
    @Query('interval') interval: GoalInterval,
  ) {
    const validInterval = interval || GoalInterval.MONTHLY;
    const goal = await this.goalService.getActiveGoalProgress(req.user.id, validInterval);
    
    if (!goal) {
        throw new NotFoundException('No active goal found for the specified interval.');
    }
    
    return goal;
  }
}
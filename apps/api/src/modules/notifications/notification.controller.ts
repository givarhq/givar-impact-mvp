import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(private readonly service: NotificationService) { }

    /**
     * Fetch current user's alert stream.
     */
    @Get()
    async getMyNotifications(@Req() req: any) {
        return this.service.getForUser(req.user.id);
    }

    /**
     * Fetch the count of pending alerts for UI badges.
     */
    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        const count = await this.service.getUnreadCount(req.user.id);
        return { count };
    }

    /**
     * Mark a single alert as viewed.
     */
    @Patch(':id/read')
    async markRead(@Req() req: any, @Param('id') id: string) {
        return this.service.markAsRead(req.user.id, id);
    }

    /**
     * Synchronize all alerts to read state.
     */
    @Patch('read-all')
    async markAllRead(@Req() req: any) {
        return this.service.markAllAsRead(req.user.id);
    }
}
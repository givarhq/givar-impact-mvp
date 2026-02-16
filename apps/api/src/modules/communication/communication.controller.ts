import { Body, Controller, Get, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunicationService } from './communication.service';

@Controller('communication')
@UseGuards(AuthGuard('jwt'))
export class CommunicationController {
    constructor(private service: CommunicationService) { }

    @Post()
    async send(@Req() req: any, @Body() dto: { content: string; proposalId?: string; projectId?: string }) {
        if (!dto.content?.trim()) throw new BadRequestException('Message content cannot be empty');
        return this.service.sendMessage(req.user.id, req.user.role, dto);
    }

    @Get('thread')
    async getThread(
        @Req() req: any,
        @Query('proposalId') proposalId?: string,
        @Query('projectId') projectId?: string
    ) {
        if (!proposalId && !projectId) throw new BadRequestException('Missing context ID');
        return this.service.getMessages(req.user.id, req.user.role, { proposalId, projectId });
    }
}
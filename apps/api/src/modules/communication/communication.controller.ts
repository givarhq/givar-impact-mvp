import { Body, Controller, Get, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunicationService } from './communication.service';

@Controller('communication')
@UseGuards(AuthGuard('jwt'))
export class CommunicationController {
    constructor(private readonly service: CommunicationService) { }

    /**
     * Post a message to a proposal or project thread.
     */
    @Post()
    async send(@Req() req: any, @Body() dto: { content: string; proposalId?: string; projectId?: string }) {
        if (!dto.content?.trim()) {
            throw new BadRequestException('Message content cannot be empty');
        }
        return this.service.sendMessage(req.user.id, req.user.role, dto);
    }

    /**
     * Retrieve the conversation history for a specific context.
     */
    @Get('thread')
    async getThread(
        @Req() req: any,
        @Query('proposalId') proposalId?: string,
        @Query('projectId') projectId?: string
    ) {
        if (!proposalId && !projectId) {
            throw new BadRequestException('Missing context id for thread retrieval');
        }
        return this.service.getMessages(req.user.id, req.user.role, { proposalId, projectId });
    }
}
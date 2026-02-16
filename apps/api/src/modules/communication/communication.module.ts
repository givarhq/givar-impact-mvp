import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [AuditModule, EmailModule],
    controllers: [CommunicationController],
    providers: [CommunicationService],
    exports: [CommunicationService],
})
export class CommunicationModule { }
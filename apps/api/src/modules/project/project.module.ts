import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuditModule, EmailModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule { }
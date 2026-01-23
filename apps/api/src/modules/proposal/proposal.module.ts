import { Module } from '@nestjs/common';
import { ProposalController } from './proposal.controller';
// import { ProposalService } from './proposal.service'; // We will build this in Phase 4

@Module({
  controllers: [ProposalController],
  providers: [/* ProposalService will go here */],
})
export class ProposalModule {}
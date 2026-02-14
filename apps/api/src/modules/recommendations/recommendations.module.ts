import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { RankingEngine } from './ranking.engine';
import { DiversityEngine } from './diversity.engine';
import { PersonalizationEngine } from './personalization.engine';
import { AdminOverrideEngine } from './admin-override.engine';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [RecommendationsController],
    providers: [
        RecommendationsService,
        RankingEngine,
        DiversityEngine,
        PersonalizationEngine,
        AdminOverrideEngine,
    ],
    exports: [RecommendationsService],
})
export class RecommendationsModule { }
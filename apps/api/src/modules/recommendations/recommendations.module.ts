import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsRepository } from './recommendations.repository';
import { RankingEngine } from './ranking.engine';
import { DiversityEngine } from './diversity.engine';
import { PersonalizationEngine } from './personalization.engine';
import { AdminOverrideEngine } from './admin-override.engine';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [
        AuthModule,
        StorageModule
    ],
    controllers: [RecommendationsController],
    providers: [
        RecommendationsService,
        RecommendationsRepository,
        RankingEngine,
        DiversityEngine,
        PersonalizationEngine,
        AdminOverrideEngine,
    ],
    exports: [RecommendationsService],
})
export class RecommendationsModule { }
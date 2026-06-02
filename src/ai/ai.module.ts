import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AiBuilderController } from './ai.controller';
import { AiBuilderService } from './ai.service';
import { Project, ProjectSchema } from './schema/project.schema';

/**
 * AiModule — AI Builder v2 integration for Thalorix.
 *
 * Supports two deployment modes (controlled via AI_BUILDER_MODE in .env):
 *   - "direct" : Direct HTTP to the AI Builder at AI_BUILDER_API_URL (port 8000).
 *   - "runpod"  : RunPod Serverless via RUNPOD_BASE_URL + RUNPOD_API_KEY.
 *
 * Keys are injected server-side only; they are never forwarded to the frontend.
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
    ]),
    // Store uploaded files in memory (buffer) so we can forward them to the AI Builder
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB hard cap
    }),
  ],
  controllers: [AiBuilderController],
  providers:   [AiBuilderService],
  exports:     [AiBuilderService],
})
export class AiModule {}

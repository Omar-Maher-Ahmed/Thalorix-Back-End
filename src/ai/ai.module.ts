import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { AiBuilderController } from './ai.controller';
import { AiBuilderService } from './ai.service';
import { Project, ProjectSchema } from './schema/project.schema';

/**
 * AiModule — AI Builder integration for Thalorix.
 *
 * Uses raw axios (already a project dependency) inside AiBuilderService
 * rather than @nestjs/axios, keeping the dependency footprint minimal.
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [AiBuilderController],
  providers:   [AiBuilderService],
  exports:     [AiBuilderService],
})
export class AiModule {}

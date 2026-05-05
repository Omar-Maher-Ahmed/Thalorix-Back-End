import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { AiBuilderService } from './ai.service';
import { CreateProjectDto } from './dto/create-ai.dto';
import { EditProjectDto } from './dto/edit-project.dto';
import {
  OutputAdapter,
  successResponse,
  errorResponse,
} from './output-adapter';

@ApiTags('AI Builder')
@Controller('ai')
export class AiBuilderController {
  private readonly logger = new Logger(AiBuilderController.name);

  constructor(private readonly aiBuilderService: AiBuilderService) {}

  // ── POST /ai/chat ───────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Generate a new project',
    description:
      'Sends a prompt to the external AI Builder API (async mode). ' +
      'Returns immediately with a projectId and "building" status. ' +
      'Poll GET /ai/projects/:id to check completion.',
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 202,
    description: 'Build job queued successfully',
    schema: {
      example: {
        ok: true,
        data: {
          projectId:  '665f9c3b1e4b2a001f000001',
          sessionId:  'sess_abc123',
          jobId:      'job_xyz456',
          status:     'building',
        },
        message: 'Project build queued',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'AI Builder API unreachable or rejected' })
  @Post('chat')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateProject(
    @Body() dto: CreateProjectDto,
  ): Promise<OutputAdapter> {
    try {
      const project = await this.aiBuilderService.generateProject(dto);

      return successResponse(
        {
          projectId: (project as any)._id,
          sessionId: project.sessionId,
          jobId:     project.jobId,
          status:    project.status,
        },
        'Project build queued',
      );
    } catch (err) {
      this.logger.error(`generateProject error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── GET /ai/projects/:id ────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Get a project by ID',
    description:
      'Returns the current state of an AI-generated project. ' +
      'If status is "building", the build is still in progress. ' +
      'If "completed", previewUrl and files[] are populated.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB project ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    schema: {
      example: {
        ok: true,
        data: {
          _id:        '665f9c3b1e4b2a001f000001',
          sessionId:  'sess_abc123',
          jobId:      'job_xyz456',
          status:     'completed',
          stack:      'React 18+ Vite',
          previewUrl: 'https://preview.aibuilder.io/proj/abc123',
          files: [
            { path: 'src/App.tsx', content: '...', language: 'tsx' },
          ],
          buildErrors: [],
          createdAt:  '2026-04-28T13:00:00.000Z',
          updatedAt:  '2026-04-28T13:01:30.000Z',
        },
        message: 'Success',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get('projects/:id')
  async getProject(@Param('id') id: string): Promise<OutputAdapter> {
    try {
      const project = await this.aiBuilderService.findProject(id);
      return successResponse(project);
    } catch (err) {
      this.logger.error(`getProject error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── PATCH /ai/projects/:id/edit ─────────────────────────────────────────────

  @ApiOperation({
    summary: 'Edit an existing project',
    description:
      'Sends an edit instruction to the AI Builder using the project\'s ' +
      'stored session_id, preserving full conversation context. ' +
      'Resets status to "building" and starts a new polling chain.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB project ID', type: String })
  @ApiBody({ type: EditProjectDto })
  @ApiResponse({
    status: 202,
    description: 'Edit job queued successfully',
    schema: {
      example: {
        ok: true,
        data: {
          projectId: '665f9c3b1e4b2a001f000001',
          jobId:     'job_newjob789',
          status:    'building',
        },
        message: 'Project edit queued',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Patch('projects/:id/edit')
  @HttpCode(HttpStatus.ACCEPTED)
  async editProject(
    @Param('id') id: string,
    @Body() dto: EditProjectDto,
  ): Promise<OutputAdapter> {
    try {
      const project = await this.aiBuilderService.editProject(id, dto);

      return successResponse(
        {
          projectId: (project as any)._id,
          jobId:     project.jobId,
          status:    project.status,
        },
        'Project edit queued',
      );
    } catch (err) {
      this.logger.error(`editProject error: ${err.message}`);
      return errorResponse(err.message);
    }
  }
}

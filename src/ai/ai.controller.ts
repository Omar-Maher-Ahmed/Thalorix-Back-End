import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { AiBuilderService } from './ai.service';
import { CreateProjectDto } from './dto/create-ai.dto';
import { EditProjectDto } from './dto/edit-project.dto';
import { DeployedProjectResponseDto } from './dto/deployed-project-response.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
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

  // ── Health ───────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Health check for the AI Builder service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @Get('health')
  async health(): Promise<OutputAdapter> {
    try {
      const data = await this.aiBuilderService.health();
      return successResponse(data, 'AI Builder is healthy');
    } catch (err) {
      this.logger.error(`health check error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── Ready ────────────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Readiness check',
    description: 'Returns 503 while models load (1-3 min cold start), 200 when ready.',
  })
  @ApiResponse({ status: 200, description: 'AI Builder is ready' })
  @ApiResponse({ status: 503, description: 'AI Builder is still loading' })
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async ready(@Res({ passthrough: true }) res: Response): Promise<OutputAdapter> {
    try {
      const { ready, raw } = await this.aiBuilderService.ready();
      if (!ready) {
        res.status(503);
        return errorResponse('AI Builder is not ready yet');
      }
      return successResponse(raw, 'AI Builder is ready');
    } catch (err) {
      this.logger.error(`ready check error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── POST /ai/chat ────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Generate a new project',
    description:
      'Sends a prompt to the AI Builder API (async mode). ' +
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
          projectId: '665f9c3b1e4b2a001f000001',
          sessionId: 'sess_abc123',
          jobId:     'job_xyz456',
          status:    'building',
        },
        message: 'Project build queued',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'AI Builder API unreachable or rejected' })
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async generateProject(@Body() dto: CreateProjectDto, @Req() req: any): Promise<OutputAdapter> {
    try {
      const userId = req.user?.userId || req.user?._id;
      if (userId) dto.userId = userId.toString();
      
      const result = await this.aiBuilderService.generateProject(dto);

      if ((result as any).reply_type === 'chat') {
        return successResponse(result, 'AI returned a direct chat response');
      }

      const project = result as any;
      return successResponse(
        {
          projectId: project._id,
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

  // ── POST /ai/upload ──────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Upload a file to the AI Builder',
    description: 'Accepts images and PDFs up to 20 MB. Optionally attach to a session.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file:       { type: 'string', format: 'binary' },
        session_id: { type: 'string', description: 'Optional AI session ID to attach the file to' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'File too large or unsupported type' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('session_id') sessionId?: string,
  ): Promise<OutputAdapter> {
    try {
      if (!file) throw new Error('No file provided');
      const result = await this.aiBuilderService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        sessionId,
      );
      return successResponse(result, 'File uploaded successfully');
    } catch (err) {
      this.logger.error(`uploadFile error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── GET /ai/projects/deployed ────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Get all successfully deployed AI projects',
    description: 'Returns a list of all AI projects that have been successfully deployed/generated, including user information.',
  })
  @ApiResponse({ status: 200, description: 'Deployed projects retrieved successfully', type: [DeployedProjectResponseDto] })
  @Get('projects/deployed')
  @UseGuards(JwtAuthGuard)
  async getDeployedProjects(@Req() req: any): Promise<OutputAdapter> {
    try {
      const userId = req.user.userId || req.user._id;
      const projects = await this.aiBuilderService.getDeployedProjects(userId.toString());
      return successResponse(projects, 'Deployed projects retrieved successfully');
    } catch (err) {
      this.logger.error(`getDeployedProjects error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── GET /ai/projects/:id ─────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Get a project by ID',
    description:
      'Returns the current state of an AI-generated project. ' +
      'If status is "building", poll until "completed" or "failed".',
  })
  @ApiParam({ name: 'id', description: 'MongoDB project ID', type: String })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get('projects/:id')
  @UseGuards(JwtAuthGuard)
  async getProject(@Param('id') id: string, @Req() req: any): Promise<OutputAdapter> {
    try {
      const userId = req.user?.userId || req.user?._id;
      const project = await this.aiBuilderService.findProject(id, userId?.toString());
      return successResponse(project);
    } catch (err) {
      this.logger.error(`getProject error: ${err.message}`);
      return errorResponse(err.message);
    }
  }

  // ── PATCH /ai/projects/:id/edit ──────────────────────────────────────────────

  @ApiOperation({
    summary: 'Edit an existing project',
    description:
      'Sends an edit instruction using the project\'s stored session_id, ' +
      'preserving full conversation context. Resets status to "building".',
  })
  @ApiParam({ name: 'id', description: 'MongoDB project ID', type: String })
  @ApiBody({ type: EditProjectDto })
  @ApiResponse({ status: 202, description: 'Edit job queued successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Patch('projects/:id/edit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async editProject(
    @Param('id') id: string,
    @Body() dto: EditProjectDto,
    @Req() req: any
  ): Promise<OutputAdapter> {
    try {
      const userId = req.user?.userId || req.user?._id;
      const result = await this.aiBuilderService.editProject(id, dto, userId?.toString());

      if ((result as any).reply_type === 'chat') {
        return successResponse(result, 'AI returned a direct chat response');
      }

      const project = result as any;
      return successResponse(
        {
          projectId: project._id,
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

  // ── Project Retrieval Endpoints ──────────────────────────────────────────────
  // Proxy: /api/project/:sessionId/:projectName/...

  @ApiOperation({ summary: 'Get project manifest (metadata)' })
  @ApiParam({ name: 'sessionId',   type: String })
  @ApiParam({ name: 'projectName', type: String })
  @Get('project/:sessionId/:projectName/manifest')
  async getManifest(
    @Param('sessionId')   sessionId:   string,
    @Param('projectName') projectName: string,
  ): Promise<OutputAdapter> {
    try {
      const data = await this.aiBuilderService.getProjectManifest(sessionId, projectName);
      return successResponse(data);
    } catch (err) {
      return errorResponse(err.message);
    }
  }

  @ApiOperation({ summary: 'Get project build status' })
  @ApiParam({ name: 'sessionId',   type: String })
  @ApiParam({ name: 'projectName', type: String })
  @Get('project/:sessionId/:projectName/status')
  async getProjectStatus(
    @Param('sessionId')   sessionId:   string,
    @Param('projectName') projectName: string,
  ): Promise<OutputAdapter> {
    try {
      const data = await this.aiBuilderService.getProjectStatus(sessionId, projectName);
      return successResponse(data);
    } catch (err) {
      return errorResponse(err.message);
    }
  }

  @ApiOperation({ summary: 'Get a single file from the project' })
  @ApiParam({ name: 'sessionId',   type: String })
  @ApiParam({ name: 'projectName', type: String })
  @ApiQuery({ name: 'path', description: 'Relative path to the file (e.g. src/App.tsx)', type: String })
  @Get('project/:sessionId/:projectName/file')
  async getProjectFile(
    @Param('sessionId')   sessionId:   string,
    @Param('projectName') projectName: string,
    @Query('path')        filePath:    string,
  ): Promise<OutputAdapter> {
    try {
      const data = await this.aiBuilderService.getProjectFile(sessionId, projectName, filePath);
      return successResponse(data);
    } catch (err) {
      return errorResponse(err.message);
    }
  }

  @ApiOperation({ summary: 'Download the built frontend as dist.zip' })
  @ApiParam({ name: 'sessionId',   type: String })
  @ApiParam({ name: 'projectName', type: String })
  @Get('project/:sessionId/:projectName/dist.zip')
  async getDistZip(
    @Param('sessionId')   sessionId:   string,
    @Param('projectName') projectName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const buffer = await this.aiBuilderService.getDistZip(sessionId, projectName);
      res.set({
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}-dist.zip"`,
      });
      res.send(buffer);
    } catch (err) {
      this.logger.error(`getDistZip error: ${err.message}`);
      res.status(500).json(errorResponse(err.message));
    }
  }

  @ApiOperation({ summary: 'Download the full project source as source.zip' })
  @ApiParam({ name: 'sessionId',   type: String })
  @ApiParam({ name: 'projectName', type: String })
  @Get('project/:sessionId/:projectName/source.zip')
  async getSourceZip(
    @Param('sessionId')   sessionId:   string,
    @Param('projectName') projectName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const buffer = await this.aiBuilderService.getSourceZip(sessionId, projectName);
      res.set({
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}-source.zip"`,
      });
      res.send(buffer);
    } catch (err) {
      this.logger.error(`getSourceZip error: ${err.message}`);
      res.status(500).json(errorResponse(err.message));
    }
  }

  @ApiOperation({ summary: 'Get project preview URL / HTML' })
  @ApiParam({ name: 'sessionId',   type: String })
  @ApiParam({ name: 'projectName', type: String })
  @Get('project/:sessionId/:projectName/preview')
  async getPreview(
    @Param('sessionId')   sessionId:   string,
    @Param('projectName') projectName: string,
  ): Promise<OutputAdapter> {
    try {
      const data = await this.aiBuilderService.getProjectPreview(sessionId, projectName);
      return successResponse(data);
    } catch (err) {
      return errorResponse(err.message);
    }
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateService } from './templates.service';
import { Types } from 'mongoose';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  // ── POST /templates ────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Create a template',
    description: 'Creates a new template. Seller role required.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateTemplateDto })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – seller role required' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    return this.templateService.create(dto, req.user);
  }

  // ── GET /templates ─────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Get all templates',
    description: 'Retrieves all active templates.',
  })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  @Get()
  findAll() {
    return this.templateService.findAll();
  }

  // ── GET /templates/:id ─────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Get a template by ID',
    description: 'Retrieves a single template by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.findOne(id);
  }

  // ── PATCH /templates/:id ───────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Update a template',
    description: 'Updates an existing template. Only the owning seller can update.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiBody({ type: UpdateTemplateDto })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – not the template owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.update(id, dto, req.user);
  }

  // ── DELETE /templates/:id ──────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Delete a template',
    description: 'Soft-deletes a template. Only the owning seller can delete.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – not the template owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.remove(id, req.user);
  }
}
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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateStatsResponseDto } from './dto/template-stats-response.dto';
import { TemplateService } from './templates.service';
import { CloudinaryService } from '../services/cloudinary/cloudinary.service';
import { Types } from 'mongoose';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── POST /templates ────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Create a template',
    description:
      'Creates a new template with optional image and file upload directly to Cloudinary. Seller role required.',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'price', 'categoryId'],
      properties: {
        title: { type: 'string', example: 'E-commerce Theme' },
        description: { type: 'string', example: 'A modern e-commerce template' },
        price: { type: 'number', example: 29.99 },
        categoryId: { type: 'string', example: '60d5ecb8b392d7001f8e8e31' },
        fileUrl: { type: 'string', format: 'binary', description: 'Upload template file directly' },
        image: { type: 'string', format: 'binary', description: 'Upload thumbnail image directly' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – seller role required' })
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'fileUrl', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreateTemplateDto,
    @Req() req: any,
    @UploadedFiles()
    files?: {
      fileUrl?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    if (!dto.fileUrl && !files?.fileUrl?.[0]) {
      throw new BadRequestException(
        'You must provide a template file (fileUrl).',
      );
    }

    // Upload template file to Cloudinary if provided
    if (files?.fileUrl?.[0]) {
      const uploaded = await this.cloudinaryService.uploadFile(
        files.fileUrl[0],
        'templates',
      );
      dto.fileUrl = uploaded.url;
    }

    // Upload thumbnail image to Cloudinary if provided
    if (files?.image?.[0]) {
      const uploaded = await this.cloudinaryService.uploadFile(
        files.image[0],
        'template-images',
      );
      dto.image = uploaded.url;
    }

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

  // ── GET /templates/:id/stats ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Get template stats by ID',
    description: 'Retrieves statistics for a single template including send/deployment count.',
  })
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiResponse({ status: 200, description: 'Template stats retrieved successfully', type: TemplateStatsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.getTemplateStats(id);
  }

  // ── PATCH /templates/:id ───────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Update a template',
    description: 'Updates an existing template. Only the owning seller can update.',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        categoryId: { type: 'string' },
        fileUrl: { type: 'string', format: 'binary', description: 'Replace template file' },
        image: { type: 'string', format: 'binary', description: 'Replace thumbnail image' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – not the template owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'fileUrl', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: any,
    @UploadedFiles()
    files?: {
      fileUrl?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    if (files?.fileUrl?.[0]) {
      const uploaded = await this.cloudinaryService.uploadFile(
        files.fileUrl[0],
        'templates',
      );
      dto.fileUrl = uploaded.url;
    }

    if (files?.image?.[0]) {
      const uploaded = await this.cloudinaryService.uploadFile(
        files.image[0],
        'template-images',
      );
      dto.image = uploaded.url;
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
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
  NotFoundException,
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
import { Role } from '../auth/decorators/roles.decorator';
import { Roles as RoleEnum } from '../auth/enums/roles.enum';
import { UpdateTemplateStatusDto } from './dto/update-template-status.dto';
import { UpdateTemplateStatusResponseDto } from './dto/update-template-status-response.dto';
import { TemplateService } from './templates.service';
import { CloudinaryService } from '../services/cloudinary/cloudinary.service';
import { SellersService } from '../sellers/sellers.service';
import { Types } from 'mongoose';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly sellersService: SellersService,
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
    FileFieldsInterceptor(
      [
        { name: 'fileUrl', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ],
      {
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'image') {
            if (!file.mimetype.startsWith('image/')) {
              return cb(new BadRequestException('Only image files are allowed for thumbnail'), false);
            }
            cb(null, true);
          } else if (file.fieldname === 'fileUrl') {
            const allowedMimeTypes = [
              'application/pdf',
              'application/zip',
              'application/x-zip-compressed',
              'application/x-rar-compressed',
              'application/vnd.rar',
              'application/octet-stream', // Some browsers send zip/rar as octet-stream
            ];
            if (!file.mimetype.startsWith('image/') && !allowedMimeTypes.includes(file.mimetype)) {
              return cb(
                new BadRequestException('Only PDF, ZIP, RAR, or Image files are allowed for template file'),
                false,
              );
            }
            cb(null, true);
          } else {
            cb(null, true);
          }
        },
      }
    ),
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
      const file = files.fileUrl[0];
      const uploaded = await this.cloudinaryService.uploadFile(
        file,
        'templates',
      );
      dto.fileUrl = uploaded.url;
      if (!dto.fileSize && file.size) {
        const sizeInMb = file.size / (1024 * 1024);
        dto.fileSize = `${sizeInMb.toFixed(1)} MB`;
      }
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
    FileFieldsInterceptor(
      [
        { name: 'fileUrl', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ],
      {
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'image') {
            if (!file.mimetype.startsWith('image/')) {
              return cb(new BadRequestException('Only image files are allowed for thumbnail'), false);
            }
            cb(null, true);
          } else if (file.fieldname === 'fileUrl') {
            const allowedMimeTypes = [
              'application/pdf',
              'application/zip',
              'application/x-zip-compressed',
              'application/x-rar-compressed',
              'application/vnd.rar',
              'application/octet-stream',
            ];
            if (!file.mimetype.startsWith('image/') && !allowedMimeTypes.includes(file.mimetype)) {
              return cb(
                new BadRequestException('Only PDF, ZIP, RAR, or Image files are allowed for template file'),
                false,
              );
            }
            cb(null, true);
          } else {
            cb(null, true);
          }
        },
      }
    ),
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

  // ── PATCH /templates/:id/status ────────────────────────────────────────────
  @ApiOperation({
    summary: 'Update a template status',
    description: 'Activates or suspends a template. Admin or owning Seller role required.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiBody({ type: UpdateTemplateStatusDto })
  @ApiResponse({ status: 200, description: 'Template status updated successfully', type: UpdateTemplateStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid template ID or status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin or owning seller role required' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateStatusDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    return this.templateService.updateStatus(id, dto.status, req.user);
  }

  // ── GET /templates/:id/reviews ──────────────────────────────────────────────
  @ApiOperation({
    summary: 'Get template reviews by ID',
    description: 'Retrieves reviews left for the seller/developer of this template.',
  })
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiResponse({ status: 200, description: 'Template reviews retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 404, description: 'Template or Seller not found' })
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    const template = await this.templateService.findOne(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    const sellerId = (template as any).developerId?._id || (template as any).developerId;
    if (!sellerId) {
      throw new NotFoundException('Seller not found for this template');
    }
    return this.sellersService.getSellerReviews(sellerId.toString());
  }

  // ── POST /templates/:id/reviews ─────────────────────────────────────────────
  @ApiOperation({
    summary: 'Submit a template review',
    description: 'Submits a review for the seller/developer of this template. Authenticated user role required.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Template ID', type: String })
  @ApiBody({ schema: { type: 'object', required: ['rating', 'comment'], properties: { rating: { type: 'number', example: 5 }, comment: { type: 'string', example: 'Great template!' } } } })
  @ApiResponse({ status: 201, description: 'Review posted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format or payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template or Seller not found' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async addReview(
    @Param('id') id: string,
    @Body() dto: { rating: number; comment: string },
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }
    const template = await this.templateService.findOne(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    const sellerId = (template as any).developerId?._id || (template as any).developerId;
    if (!sellerId) {
      throw new NotFoundException('Seller not found for this template');
    }
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.sellersService.addSellerReview(userId.toString(), sellerId.toString(), dto);
  }
}
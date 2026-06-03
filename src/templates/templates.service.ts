import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template, TemplateDocument } from './schema/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import {
  Category,
  CategoryDocument,
} from 'src/categories/schema/category.schema';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,

    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(createDto: CreateTemplateDto, user: any) {
    try {
      if (user.role !== 'seller') {
        throw new ForbiddenException('Only sellers can create templates');
      }

      // 1. ObjectId Validation
      if (!Types.ObjectId.isValid(createDto.categoryId)) {
        throw new BadRequestException('Invalid categoryId');
      }

      // 2. Existence Check
      const category = await this.categoryModel.findById(createDto.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const template = await this.templateModel.create({
        title: createDto.title,
        description: createDto.description,
        price: createDto.price,
        fileUrl: createDto.fileUrl,
        image: createDto.image,
        developerId: new Types.ObjectId(user.userId),
        categoryId: new Types.ObjectId(createDto.categoryId),
      });

      return template.populate([
        { path: 'developerId', select: '-password' },
        { path: 'categoryId' },
      ]);
    } catch (error) {
      this.logger.error(`Template Create Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async findAll() {
    try {
      return await this.templateModel.find({ isActive: true }).populate([
        { path: 'developerId', select: '-password' },
        { path: 'categoryId' },
      ]);
    } catch (error) {
      this.logger.error(`Template FindAll Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid template ID');
      }
      const template = await this.templateModel.findById(id).populate([
        { path: 'developerId', select: '-password' },
        { path: 'categoryId' },
      ]);

      if (!template) {
        throw new NotFoundException('Template not found');
      }
      return template;
    } catch (error) {
      this.logger.error(`Template FindOne Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTemplateStats(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid template ID');
      }

      const result = await this.templateModel.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'developerId',
            foreignField: '_id',
            as: 'developer',
          },
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'template',
            as: 'orders',
          },
        },
        {
          $project: {
            _id: 0,
            templateId: '$_id',
            templateName: '$title',
            userEmail: { $arrayElemAt: ['$developer.email', 0] },
            sendCount: { $size: '$orders' },
            createdAt: 1,
          },
        },
      ]);

      if (!result || result.length === 0) {
        throw new NotFoundException('Template not found');
      }

      return result[0];
    } catch (error) {
      this.logger.error(`Template Stats Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTemplateDto, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid template ID');
      }

      const template = await this.templateModel.findById(id);

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      if (template.developerId.toString() !== user.userId.toString()) {
        throw new ForbiddenException(
          'You are not allowed to update this template',
        );
      }

      if (dto.categoryId) {
        if (!Types.ObjectId.isValid(dto.categoryId)) {
          throw new BadRequestException('Invalid categoryId');
        }

        const category = await this.categoryModel.findById(dto.categoryId);

        if (!category) {
          throw new NotFoundException('Category not found');
        }

        template.categoryId = new Types.ObjectId(dto.categoryId);
      }

      template.title = dto.title ?? template.title;
      template.description = dto.description ?? template.description;
      template.price = dto.price ?? template.price;
      if (dto.fileUrl) template.fileUrl = dto.fileUrl;
      if (dto.image) template.image = dto.image;

      await template.save();

      return template.populate([
        { path: 'developerId', select: '-password' },
        { path: 'categoryId' },
      ]);
    } catch (error) {
      this.logger.error(`Template Update Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ── Remove (Soft Delete) ────────────────────────────────────────────────────

  async remove(id: string, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid template ID');
      }

      const template = await this.templateModel.findById(id);

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      if (template.developerId.toString() !== user.userId.toString()) {
        throw new ForbiddenException(
          'You are not allowed to delete this template',
        );
      }

      template.isActive = false;
      await template.save();

      return { message: 'Template deleted successfully' };
    } catch (error) {
      this.logger.error(`Template Remove Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
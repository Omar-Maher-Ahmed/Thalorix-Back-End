import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Types } from 'mongoose';

import { Category } from './schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  // ✅ CREATE
  async create(dto: CreateCategoryDto) {
    try {
      const slug = slugify(dto.name, { lower: true, strict: true });
      const normalizedName = dto.name.trim().toLowerCase();

      // 1. ObjectId Validation
      if (dto.parentId && !Types.ObjectId.isValid(dto.parentId)) {
        throw new BadRequestException('Invalid parentId');
      }

      // 2. Duplicate Check
      const exists = await this.categoryModel.findOne({
        normalizedName,
      });

      if (exists) {
        throw new ConflictException('Category already exists');
      }

      return await this.categoryModel.create({
        ...dto,
        parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
        slug,
        normalizedName,
      });
    } catch (err) {
      this.logger.error(`Category Create Error: ${err.message}`, err.stack);
      if (err instanceof ConflictException || err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new BadRequestException('Name already exists');
      }
      throw err;
    }
  }

  // ✅ GET ALL (pagination + search)
  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.keyword) {
      filter.name = { $regex: query.keyword, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort('-createdAt')
        .populate('parentId', 'name'),

      this.categoryModel.countDocuments(filter),
    ]);

    return {
      data,
      page,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // ✅ GET ONE
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel
      .findById(id)
      .populate('parentId', 'name');

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // ✅ UPDATE
  async update(id: string, dto: UpdateCategoryDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid category ID');
      }

      const updateData: any = { ...dto };

      if (dto.name) {
        updateData.slug = slugify(dto.name, {
          lower: true,
          strict: true,
        });
        updateData.normalizedName = dto.name.trim().toLowerCase();
      }

      if (dto.parentId) {
        if (!Types.ObjectId.isValid(dto.parentId)) {
          throw new BadRequestException('Invalid parentId');
        }
        updateData.parentId = new Types.ObjectId(dto.parentId);
      }

      const category = await this.categoryModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    } catch (err) {
      this.logger.error(`Category Update Error: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new BadRequestException('Name already exists');
      }
      throw err;
    }
  }

  // ✅ DELETE
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { message: 'Category deleted successfully' };
  }
}

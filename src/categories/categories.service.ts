import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';

import { Category } from './schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  // ✅ CREATE
  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const normalizedName = dto.name.trim().toLowerCase();

    const exists = await this.categoryModel.findOne({
      normalizedName,
      marketplaceId: dto.marketplaceId,
    });

    if (exists) {
      throw new ConflictException('Category already exists');
    }

    try {
      return await this.categoryModel.create({
        ...dto,
        slug,
        normalizedName,
      });
    } catch (err) {
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

    if (query.marketplaceId) {
      filter.marketplaceId = query.marketplaceId;
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
    const updateData: any = { ...dto };

    if (dto.name) {
      updateData.slug = slugify(dto.name, {
        lower: true,
        strict: true,
      });
      updateData.normalizedName = dto.name.trim().toLowerCase();
    }

    try {
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
      if (err?.code === 11000) {
        throw new BadRequestException('Name already exists');
      }
      throw err;
    }
  }

  // ✅ DELETE
  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { message: 'Category deleted successfully' };
  }
}

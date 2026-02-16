// import { Injectable } from '@nestjs/common';
// import { CreateCategoryDto } from './dto/create-category.dto';
// import { UpdateCategoryDto } from './dto/update-category.dto';

// @Injectable()
// export class CategoriesService {
//   create(createCategoryDto: CreateCategoryDto) {
//     return 'This action adds a new category';
//   }

//   findAll() {
//     return `This action returns all categories`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} category`;
//   }

//   update(id: number, updateCategoryDto: UpdateCategoryDto) {
//     return `This action updates a #${id} category`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} category`;
//   }
// }
import {
  Injectable,
  ConflictException,
  NotFoundException,
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

    const exists = await this.categoryModel.findOne({
      slug,
      marketplaceId: dto.marketplaceId,
    });

    if (exists) {
      throw new ConflictException('Category already exists');
    }

    return this.categoryModel.create({
      ...dto,
      slug,
    });
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

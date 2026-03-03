import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template, TemplateDocument } from './schema/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { Category, CategoryDocument } from 'src/categories/schema/category.schema';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,

    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createDto: CreateTemplateDto, user: any) {
    if (user.role !== 'seller') {
      throw new ForbiddenException('Only sellers can create templates');
    }

    const category = await this.categoryModel.findById(
      createDto.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.marketplaceId.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You cannot use a category that does not belong to you',
      );
    }

    const template = await this.templateModel.create({
      title: createDto.name,
      description: createDto.description,
      price: createDto.price,
      seller: user._id,
      category: createDto.categoryId,
    });

    return template.populate([
      { path: 'seller', select: '-password' },
      { path: 'category', populate: { path: 'marketplace' } },
    ]);
  }

  async findAllByMarketplace(marketplaceId: string) {
    const categories = await this.categoryModel.find({
      marketplace: marketplaceId,
    });

    const categoryIds = categories.map((c) => c._id);

    return this.templateModel
      .find({
        category: { $in: categoryIds },
        isActive: true,
      })
      .populate('seller', '-password')
      .populate({
        path: 'category',
        populate: { path: 'marketplace' },
      });
  }

  async update(id: string, dto: CreateTemplateDto, user: any) {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.seller.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You are not allowed to update this template',
      );
    }

    if (dto.categoryId) {
      const category = await this.categoryModel.findById(dto.categoryId);

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.marketplaceId.toString() !== user._id.toString()) {
        throw new ForbiddenException(
          'You cannot move template to another marketplace category',
        );
      }

      template.category = new Types.ObjectId(dto.categoryId);
    }

    template.title = dto.name ?? template.title;
    template.description = dto.description ?? template.description;
    template.price = dto.price ?? template.price;

    await template.save();

    return template.populate([
      { path: 'seller', select: '-password' },
      { path: 'category', populate: { path: 'marketplace' } },
    ]);
  }

  async remove(id: string, user: any) {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.seller.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You are not allowed to delete this template',
      );
    }

    template.isActive = false;
    await template.save();

    return { message: 'Template deleted successfully' };
  }
}
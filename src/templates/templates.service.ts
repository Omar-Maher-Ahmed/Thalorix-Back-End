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
import {
  Category,
  CategoryDocument,
} from 'src/categories/schema/category.schema';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,

    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(createDto: CreateTemplateDto, user: any) {
    if (user.role !== 'seller') {
      throw new ForbiddenException('Only sellers can create templates');
    }

    const category = await this.categoryModel.findById(createDto.categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // ✅ FIX: verify the category belongs to the marketplace the seller specified,
    //         NOT compared against user._id (which is the user's own ID, not marketplace ID).
    if (category.marketplaceId.toString() !== createDto.marketplaceId) {
      throw new ForbiddenException(
        'The selected category does not belong to the specified marketplace',
      );
    }

    const template = await this.templateModel.create({
      title: createDto.name,
      description: createDto.description,
      price: createDto.price,
      seller: user._id,
      category: createDto.categoryId,
    });

    // ✅ FIX: populate 'marketplaceId' (the actual ref field on Category schema),
    //         not the non-existent 'marketplace' alias.
    return template.populate([
      { path: 'seller', select: '-password' },
      {
        path: 'category',
        populate: { path: 'marketplaceId' },
      },
    ]);
  }

  // ── Find All By Marketplace ─────────────────────────────────────────────────

  async findAllByMarketplace(marketplaceId: string) {
    // Guard: validate the ID before querying
    if (!Types.ObjectId.isValid(marketplaceId)) {
      throw new BadRequestException('Invalid marketplace ID');
    }

    const categories = await this.categoryModel.find({
      marketplaceId: new Types.ObjectId(marketplaceId),
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
        // ✅ FIX: correct ref field name is 'marketplaceId', not 'marketplace'
        populate: { path: 'marketplaceId' },
      });
  }

  // ── Update ─────────────────────────────────────────────────────────────────

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

      // ✅ FIX: compare against dto.marketplaceId (the marketplace the seller owns),
      //         not against user._id.
      if (
        dto.marketplaceId &&
        category.marketplaceId.toString() !== dto.marketplaceId
      ) {
        throw new ForbiddenException(
          'You cannot move a template to a category from a different marketplace',
        );
      }

      template.category = new Types.ObjectId(dto.categoryId);
    }

    template.title = dto.name ?? template.title;
    template.description = dto.description ?? template.description;
    template.price = dto.price ?? template.price;

    await template.save();

    // ✅ FIX: correct populate field name
    return template.populate([
      { path: 'seller', select: '-password' },
      {
        path: 'category',
        populate: { path: 'marketplaceId' },
      },
    ]);
  }

  // ── Remove (Soft Delete) ────────────────────────────────────────────────────

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
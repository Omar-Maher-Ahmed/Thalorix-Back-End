import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MarketPlace,
  MarketPlaceDocument,
} from './schema/market_place.schema';
import { CreateMarketPlaceDto } from './dto/create-market_place.dto';
import { UpdateMarketPlaceDto } from './dto/update-market_place.dto';
import { Category, CategoryDocument } from '../categories/schema/category.schema';
import { Template, TemplateDocument } from '../templates/schema/template.schema';

@Injectable()
export class MarketPlaceService {
  private readonly logger = new Logger(MarketPlaceService.name);

  constructor(
    @InjectModel(MarketPlace.name)
    private marketPlaceModel: Model<MarketPlaceDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
  ) {}

  // ✅ Create
  async create(
    createMarketPlaceDto: CreateMarketPlaceDto,
    ownerId: string,
  ) {
    try {
      const { templateId, categoryId: dtoCategoryId, category: dtoCategory } = createMarketPlaceDto;

      // 1. Validate ObjectIds (Task 4)
      if (!Types.ObjectId.isValid(templateId)) {
        throw new BadRequestException('Invalid templateId');
      }

      const inputCategoryId = dtoCategoryId || dtoCategory;
      if (inputCategoryId && !Types.ObjectId.isValid(inputCategoryId)) {
        throw new BadRequestException('Invalid categoryId');
      }

      // 2. Fetch Template and populate Category (Task 1)
      const template = await this.templateModel.findById(templateId).populate('categoryId');
      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // 3. Extract category from template (Task 1)
      // Since it's populated, template.categoryId is the Category document
      const templateCategoryId = (template.categoryId as any)._id.toString();

      // 4. Validate match if user passed categoryId (Task 1)
      if (inputCategoryId) {
        if (inputCategoryId.toString() !== templateCategoryId) {
          throw new BadRequestException('Template does not belong to this category');
        }
      }

      // 5. Fetch category to ensure existence (Task 1)
      const category = await this.categoryModel.findById(templateCategoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // 6. Consistency Logging (Task 7)
      console.log('[Marketplace Create]', {
        templateId: createMarketPlaceDto.templateId,
        categoryId: templateCategoryId,
      });

      // 7. Defensive Create (Task 5)
      const created = await this.marketPlaceModel.create({
        name: createMarketPlaceDto.name,
        description: createMarketPlaceDto.description,
        price: createMarketPlaceDto.price,
        templateId: new Types.ObjectId(createMarketPlaceDto.templateId),
        categoryId: new Types.ObjectId(templateCategoryId),
        currency: createMarketPlaceDto.currency || 'USD',
        images: createMarketPlaceDto.images || [],
        owner: new Types.ObjectId(ownerId),
      });

      return created;
    } catch (error) {
      this.logger.error(`Marketplace Create Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ✅ Find All with pagination + filtering
  async findAll(query: any) {
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      category,
      search,
    } = query;

    const filter: any = {
      isActive: true,
    };

    // 🔎 Price filtering
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // 📂 Category filtering (Task 6)
    const categoryId = query.categoryId || query.category;
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('Invalid category');
      }
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    // 🔎 Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.marketPlaceModel
        .find(filter)
        .populate('owner', 'name email')
        .populate('categoryId', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      this.marketPlaceModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit),
    };
  }

  // ✅ Find One
  async findOne(id: string) {
    const item = await this.marketPlaceModel
      .findOne({ _id: id, isActive: true })
      .populate('owner', 'name email')
      .populate('categoryId', 'name');

    if (!item) {
      throw new NotFoundException('Market item not found');
    }

    return item;
  }

  // ✅ Update (owner only)
  async update(
    id: string,
    updateMarketPlaceDto: UpdateMarketPlaceDto,
    userId: string,
  ) {
    try {
      const item = await this.marketPlaceModel.findById(id);

      if (!item || !item.isActive) {
        throw new NotFoundException('Market item not found');
      }

      if (item.owner.toString() !== userId) {
        throw new ForbiddenException('You are not allowed to update this item');
      }

      const { category, categoryId: dtoCategoryId, templateId, ...rest } = updateMarketPlaceDto;

      // 1. Normalize Category ID
      const categoryId = dtoCategoryId || category;

      if (categoryId) {
        if (!Types.ObjectId.isValid(categoryId)) {
          throw new BadRequestException('Invalid categoryId');
        }
        const categoryExists = await this.categoryModel.findById(categoryId);
        if (!categoryExists) {
          throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }
        item.categoryId = new Types.ObjectId(categoryId);
      }

      if (templateId) {
        if (!Types.ObjectId.isValid(templateId)) {
          throw new BadRequestException('Invalid templateId');
        }
        const templateExists = await this.templateModel.findById(templateId);
        if (!templateExists) {
          throw new NotFoundException(`Template with ID ${templateId} not found`);
        }
        item.templateId = new Types.ObjectId(templateId);
      }

      Object.assign(item, rest);

      await item.save();

      return item;
    } catch (error) {
      this.logger.error(`Marketplace Update Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ✅ Soft Delete
  async remove(id: string, userId: string) {
    const item = await this.marketPlaceModel.findById(id);

    if (!item || !item.isActive) {
      throw new NotFoundException('Market item not found');
    }

    if (item.owner.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to delete this item');
    }

    item.isActive = false;
    await item.save();

    return { message: 'Item deleted successfully' };
  }
}


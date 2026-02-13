import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MarketPlace,
  MarketPlaceDocument,
} from './schema/market_place.schema';
import { CreateMarketPlaceDto } from './dto/create-market_place.dto';
import { UpdateMarketPlaceDto } from './dto/update-market_place.dto';

@Injectable()
export class MarketPlaceService {
  constructor(
    @InjectModel(MarketPlace.name)
    private marketPlaceModel: Model<MarketPlaceDocument>,
  ) {}

  // ✅ Create
  async create(
    createMarketPlaceDto: CreateMarketPlaceDto,
    ownerId: string,
  ) {
    const created = await this.marketPlaceModel.create({
      ...createMarketPlaceDto,
      owner: new Types.ObjectId(ownerId),
    });

    return created;
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

    // 📂 Category filtering
    if (category) {
      filter.category = new Types.ObjectId(category);
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
        .populate('category', 'name')
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
      .populate('category', 'name');

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
    const item = await this.marketPlaceModel.findById(id);

    if (!item || !item.isActive) {
      throw new NotFoundException('Market item not found');
    }

    if (item.owner.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to update this item');
    }

    Object.assign(item, updateMarketPlaceDto);

    await item.save();

    return item;
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


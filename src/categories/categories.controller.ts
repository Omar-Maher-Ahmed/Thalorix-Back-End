import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Types } from 'mongoose';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a category', description: 'Creates a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @ApiOperation({ summary: 'Get all categories', description: 'Retrieves a list of all categories with optional filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-indexed)', type: String, example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: String, example: '10' })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword to filter categories by name', type: String, example: 'electronics' })
  @ApiQuery({ name: 'marketplaceId', required: false, description: 'Filter categories by marketplace MongoDB ObjectId', type: String, example: '60d5ecb8b392d7001f8e8e30' })
  @ApiResponse({ status: 200, description: 'List of categories retrieved successfully' })
  @Get()
  findAll(@Query() query: QueryCategoryDto) {
    if (query.marketplaceId && !Types.ObjectId.isValid(query.marketplaceId)) {
      throw new BadRequestException('Invalid marketplace ID');
    }
    return this.categoriesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a category by ID', description: 'Retrieves details of a specific category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID', type: String })
  @ApiResponse({ status: 200, description: 'Category details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }
    return this.categoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a category', description: 'Updates details of an existing category' })
  @ApiParam({ name: 'id', description: 'Category ID', type: String })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }
    return this.categoriesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a category', description: 'Removes a category from the system' })
  @ApiParam({ name: 'id', description: 'Category ID', type: String })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }
    return this.categoriesService.remove(id);
  }
}

// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { ProductService } from './product.service';
// import { CreateProductDto } from './dto/create-product.dto';
// import { UpdateProductDto } from './dto/update-product.dto';

// @Controller('product')
// export class ProductController {
//     constructor(private readonly productService: ProductService) { }

//     @Post()
//     create(@Body() createProductDto: CreateProductDto) {
//         return this.productService.create(createProductDto);
//     }

//     @Get('')
//     findAll() {
//         return this.productService.findAll();
//     }

//     @Get(':id')
//     findOne(@Param('id') id: string) {
//         return this.productService.findOne(id);
//     }

//     @Patch(':id')
//     update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
//         return this.productService.update(id, updateProductDto);
//     }

//     @Delete(':id')
//     remove(@Param('id') id: string) {
//         return this.productService.remove(id);
//     }
// }

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    HttpStatus,
    ParseIntPipe,
    DefaultValuePipe,
    ValidationPipe,
    UsePipes
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
    ApiBody
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { Roles as UserRole } from '../auth/enums/roles.enum';
import { ParseObjectIdPipe } from './pipe/parse-object-id.pipe';

/**
 * ============================================
 * Product Controller - واجهة برمجة التطبيقات
 * ============================================
 * 
 * ده الـ Controller اللي بيستقبل كل الـ HTTP Requests
 * 
 * المميزات:
 * 1. Swagger Documentation - توثيق كامل للـ API
 * 2. Authentication & Authorization - حماية بالـ JWT
 * 3. Validation Pipes - التحقق من البيانات
 * 4. Pagination & Filtering - ترقيم وفلترة
 * 5. Role-based Access - Admin و Seller بس اللي يضيفوا
 */

@ApiTags('📦 Products - المنتجات') // Tag للـ Swagger
@Controller('products') // الـ Base Route: /products
export class ProductController {

    constructor(private readonly productService: ProductService) { }

    // ============================================
    // CREATE - إضافة منتج جديد
    // ============================================

    /**
     * إضافة منتج جديد
     * 
     * الصلاحيات: Admin أو Seller فقط
     * 
     * @param createProductDto - بيانات المنتج
     * @param req - الـ Request عشان نجيب الـ User ID
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard) // لازم يكون مسجل دخول + صلاحيات
    @Role(UserRole.Admin, UserRole.Seller) // Admin أو Seller بس
    @ApiBearerAuth() // Swagger: محتاج Token
    @ApiOperation({
        summary: 'إضافة منتج جديد',
        description: 'يضيف منتج جديد للنظام. يتطلب صلاحيات Admin أو Seller.'
    })
    @ApiBody({ type: CreateProductDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'تم إضافة المنتج بنجاح'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'بيانات غير صالحة'
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'كود المنتج (SKU) مستخدم بالفعل'
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'غير مصرح - لازم تسجل دخول'
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'ممنوع - ماعندكش صلاحية'
    })
    async create(
        @Body(ValidationPipe) createProductDto: CreateProductDto,
        @Request() req
    ) {
        // req.user.id بيجي من الـ JWT Token
        return this.productService.create(createProductDto, req.user.id);
    }

    // ============================================
    // READ - جلب المنتجات
    // ============================================

    /**
     * جلب كل المنتجات (مع Pagination & Filtering)
     * 
     * الصلاحيات: Public (مش محتاج تسجيل دخول)
     * 
     * الـ Query Parameters المتاحة:
     * - page: رقم الصفحة (default: 1)
     * - limit: عدد العناصر في الصفحة (default: 10, max: 50)
     * - category: فلترة حسب الفئة
     * - marketplace: فلترة حسب السوق
     * - minPrice: الحد الأدنى للسعر
     * - maxPrice: الحد الأقصى للسعر
     * - isAvailable: فلترة حسب التوفر (true/false)
     * - inStock: في المخزن (true/false)
     * - sortBy: ترتيب حسب (price, name, createdAt, stock, soldCount)
     * - sortOrder: اتجاه الترتيب (asc, desc)
     */
    @Get()
    @ApiOperation({
        summary: 'جلب كل المنتجات',
        description: 'يجيب قائمة المنتجات مع إمكانية Pagination و Filtering. متاح للجميع.'
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'رقم الصفحة (افتراضي: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'العدد في الصفحة (افتراضي: 10)' })
    @ApiQuery({ name: 'category', required: false, type: String, description: 'معرف الفئة' })
    @ApiQuery({ name: 'marketplace', required: false, type: String, description: 'معرف السوق' })
    @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'الحد الأدنى للسعر' })
    @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'الحد الأقصى للسعر' })
    @ApiQuery({ name: 'isAvailable', required: false, type: Boolean, description: 'هل المنتج متاح؟' })
    @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'في المخزن؟' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'ترتيب حسب (price, name, createdAt)' })
    @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'اتجاه الترتيب (asc, desc)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم جلب المنتجات بنجاح'
    })
    async findAll(@Query() query) {
        return this.productService.findAll(query);
    }

    /**
     * جلب منتج واحد بالـ ID
     * 
     * @param id - معرف المنتج (MongoDB ObjectId)
     */
    @Get(':id')
    @ApiOperation({
        summary: 'جلب منتج بالـ ID',
        description: 'يجيب تفاصيل منتج واحد باستخدام الـ ID'
    })
    @ApiParam({
        name: 'id',
        description: 'معرف المنتج (MongoDB ObjectId)',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم جلب المنتج بنجاح'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'المنتج غير موجود'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'معرف غير صالح'
    })
    async findOne(@Param('id', ParseObjectIdPipe) id: string) {
        return this.productService.findOne(id);
    }

    /**
     * جلب منتج بالـ Slug (للـ Frontend URLs)
     * 
     * مثال: /products/slug/iphone-15-pro
     * 
     * @param slug - الـ Slug بتاع المنتج
     */
    @Get('slug/:slug')
    @ApiOperation({
        summary: 'جلب منتج بالـ Slug',
        description: 'يجيب منتج باستخدام الـ Slug (مناسب للـ SEO URLs)'
    })
    @ApiParam({
        name: 'slug',
        description: 'الـ Slug الفريد للمنتج',
        example: 'iphone-15-pro'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم جلب المنتج بنجاح'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'المنتج غير موجود'
    })
    async findBySlug(@Param('slug') slug: string) {
        return this.productService.findBySlug(slug);
    }

    /**
     * البحث في المنتجات
     * 
     * بيدور في الاسم والوصف
     * 
     * @param q - كلمة البحث
     */
    @Get('search/query')
    @ApiOperation({
        summary: 'البحث في المنتجات',
        description: 'يبحث في اسماء وأوصاف المنتجات'
    })
    @ApiQuery({
        name: 'q',
        required: true,
        type: String,
        description: 'كلمة البحث (حرفين على الأقل)',
        example: 'iphone'
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم البحث بنجاح'
    })
    async search(
        @Query('q') searchQuery: string,
        @Query() query
    ) {
        return this.productService.search(searchQuery, query);
    }

    // ============================================
    // UPDATE - تعديل منتج
    // ============================================

    /**
     * تعديل منتج موجود
     * 
     * الصلاحيات: Admin أو Seller (اللي أنشأ المنتج) أو Admin
     * 
     * @param id - معرف المنتج
     * @param updateProductDto - البيانات الجديدة
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Role(UserRole.Admin, UserRole.Seller)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'تعديل منتج',
        description: 'يعدل بيانات منتج موجود. يتطلب صلاحيات Admin أو Seller.'
    })
    @ApiParam({
        name: 'id',
        description: 'معرف المنتج',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiBody({ type: UpdateProductDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم تعديل المنتج بنجاح'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'المنتج غير موجود'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'بيانات غير صالحة'
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'كود المنتج (SKU) مستخدم بالفعل'
    })
    async update(
        @Param('id', ParseObjectIdPipe) id: string,
        @Body(ValidationPipe) updateProductDto: UpdateProductDto,
        @Request() req
    ) {
        return this.productService.update(id, updateProductDto, req.user.id);
    }

    // ============================================
    // DELETE - الحذف
    // ============================================

    /**
     * حذف منتج (Soft Delete)
     * 
     * الصلاحيات: Admin أو Seller (اللي أنشأ المنتج)
     * 
     * ملاحظة: المنتج مش بيتمسح نهائياً، بس بيتعلم إنه محذوف
     * 
     * @param id - معرف المنتج
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Role(UserRole.Admin, UserRole.Seller)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'حذف منتج',
        description: 'يحذف منتج (Soft Delete). يتطلب صلاحيات Admin أو Seller.'
    })
    @ApiParam({
        name: 'id',
        description: 'معرف المنتج',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم حذف المنتج بنجاح'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'المنتج غير موجود'
    })
    async remove(
        @Param('id', ParseObjectIdPipe) id: string,
        @Request() req
    ) {
        return this.productService.remove(id, req.user.id);
    }

    // ============================================
    // RESTORE - استرجاع منتج محذوف
    // ============================================

    /**
     * استرجاع منتج محذوف
     * 
     * الصلاحيات: Admin فقط
     * 
     * @param id - معرف المنتج المحذوف
     */
    @Patch(':id/restore')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Role(UserRole.Admin) // Admin بس
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'استرجاع منتج محذوف',
        description: 'يسترجع منتج كان محذوف (Soft Delete). يتطلب صلاحيات Admin فقط.'
    })
    @ApiParam({
        name: 'id',
        description: 'معرف المنتج المحذوف',
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'تم استرجاع المنتج بنجاح'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'المنتج غير موجود'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'المنتج غير محذوف'
    })
    async restore(
        @Param('id', ParseObjectIdPipe) id: string,
        @Request() req
    ) {
        return this.productService.restore(id, req.user.id);
    }
}
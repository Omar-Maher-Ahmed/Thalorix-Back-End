import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * ============================================
 * Product Service - النسخة المُحسَّنة والكاملة
 * ============================================
 * 
 * ده الـ Service اللي بيحتوي على كل الـ Business Logic
 * 
 * المميزات:
 * 1. Pagination - ترقيم الصفحات
 * 2. Filtering & Searching - فلترة وبحث
 * 3. Soft Delete - الحذف المنطقي
 * 4. SKU Validation - التحقق من عدم تكرار الكود
 * 5. Population - جلب البيانات المرتبطة
 * 6. Error Handling - معالجة الأخطاء
 */

// ============================================
// Interfaces للـ Response الموحد
// ============================================

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    message: string;
}

export interface SingleResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable()
export class ProductService {

    // Logger عشان نسجل الأحداث المهمة
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>
    ) { }

    // ============================================
    // CREATE - إضافة منتج جديد
    // ============================================

    /**
     * إضافة منتج جديد
     * 
     * الخطوات:
     * 1. التحقق من عدم تكرار الـ SKU
     * 2. إنشاء المنتج
     * 3. الـ Slug بيتولد أوتوماتيك من الـ Schema
     * 
     * @param createProductDto - بيانات المنتج
     * @param userId - معرف المستخدم اللي بيضيف (Admin أو Seller)
     * @returns المنتج اللي اتضاف
     */
    async create(
        createProductDto: CreateProductDto,
        userId: string
    ): Promise<SingleResponse<Product>> {

        this.logger.log(`محاولة إضافة منتج جديد: ${createProductDto.name} بواسطة المستخدم: ${userId}`);

        // التحقق من عدم تكرار الـ SKU
        await this.validateUniqueSku(createProductDto.sku);

        try {
            // create product with add منشئ المنتج
            const productData = {
                ...createProductDto,
                createdBy: new Types.ObjectId(userId),
                // التأكد إن الـ images Array موجودة (حتى لو فاضية)
                images: createProductDto.images || []
            };

            const createdProduct = new this.productModel(productData);
            const savedProduct = await createdProduct.save();

            // Populate البيانات المرتبطة عشان نرجعها كاملة
            const populatedProduct = await this.findByIdWithPopulate(savedProduct._id.toString());

            if (!populatedProduct) {
                throw new BadRequestException('فشل في استرجاع المنتج بعد الإنشاء');
            }

            this.logger.log(`تم إضافة المنتج بنجاح: ${savedProduct.name} (ID: ${savedProduct._id})`);

            return {
                success: true,
                data: populatedProduct,
                message: 'تم إضافة المنتج بنجاح'
            };

        } catch (error) {
            this.logger.error(`فشل في إضافة المنتج: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل في إضافة المنتج: ${error.message}`);
        }
    }

    // ============================================
    // READ - جلب المنتجات (مع Pagination & Filtering)
    // ============================================

    /**
     * جلب كل المنتجات مع Pagination و Filtering
     * 
     * المميزات:
     * - Pagination: page, limit
     * - Filtering: category, marketplace, minPrice, maxPrice, isAvailable
     * - Searching: search (بحث في الاسم والوصف)
     * - Sorting: sortBy, sortOrder
     * 
     * @param query - الـ Query Parameters
     * @returns المنتجات مع معلومات الـ Pagination
     */
    async findAll(query: any = {}): Promise<PaginatedResponse<Product>> {

        // استخراج الـ Pagination Parameters (مع قيم افتراضية)
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
        const skip = (page - 1) * limit;

        this.logger.log(`جلب المنتجات - الصفحة: ${page}, العدد: ${limit}`);

        // بناء الـ Filter Query
        const filter: any = this.buildFilterQuery(query);

        // بناء الـ Sort Query
        const sort = this.buildSortQuery(query.sortBy, query.sortOrder);

        try {
            // تنفيذ الـ Query مع Pagination
            const [products, totalItems] = await Promise.all([
                this.productModel
                    .find(filter)
                    .populate('category', 'name slug') // جلب بيانات الفئة
                    .populate('marketplace', 'name logo') // جلب بيانات السوق
                    .populate('createdBy', 'name email') // جلب بيانات المنشئ
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean() // لأداء أفضل
                    .exec(),

                this.productModel.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(totalItems / limit);

            this.logger.log(`تم جلب ${products.length} منتج من أصل ${totalItems}`);

            return {
                success: true,
                data: products as Product[],
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                message: 'تم جلب المنتجات بنجاح'
            };

        } catch (error) {
            this.logger.error(`فشل في جلب المنتجات: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل في جلب المنتجات: ${error.message}`);
        }
    }

    /**
     * جلب منتج واحد بالـ ID
     * 
     * @param id - معرف المنتج
     * @returns المنتج مع البيانات المرتبطة
     */
    async findOne(id: string): Promise<SingleResponse<Product>> {

        this.logger.log(`جلب منتج بالـ ID: ${id}`);

        // التحقق من صحة الـ ID
        this.validateObjectId(id);

        const product = await this.findByIdWithPopulate(id);

        if (!product) {
            this.logger.warn(`المنتج غير موجود: ${id}`);
            throw new NotFoundException(`المنتج بالـ ID: ${id} غير موجود`);
        }

        // التحقق إن المنتج مش محذوف (Soft Delete)
        if (product.isDeleted) {
            this.logger.warn(`محاولة الوصول لمنتج محذوف: ${id}`);
            throw new NotFoundException(`المنتج بالـ ID: ${id} غير متاح`);
        }

        return {
            success: true,
            data: product,
            message: 'تم جلب المنتج بنجاح'
        };
    }

    /**
     * جلب منتج بالـ Slug (للـ Frontend URLs)
     * 
     * @param slug - الـ Slug بتاع المنتج
     * @returns المنتج
     */
    async findBySlug(slug: string): Promise<SingleResponse<Product>> {

        this.logger.log(`جلب منتج بالـ Slug: ${slug}`);

        const product = await this.productModel
            .findOne({ slug, isDeleted: false })
            .populate('category', 'name slug')
            .populate('marketplace', 'name logo')
            .populate('createdBy', 'name email')
            .exec();

        if (!product) {
            throw new NotFoundException(`المنتج بالـ Slug: ${slug} غير موجود`);
        }

        return {
            success: true,
            data: product,
            message: 'تم جلب المنتج بنجاح'
        };
    }

    // ============================================
    // UPDATE - تعديل منتج
    // ============================================

    /**
     * تعديل منتج موجود
     * 
     * @param id - معرف المنتج
     * @param updateProductDto - البيانات الجديدة
     * @param userId - معرف المستخدم اللي بيعدل
     * @returns المنتج بعد التعديل
     */
    async update(
        id: string,
        updateProductDto: UpdateProductDto,
        userId: string
    ): Promise<SingleResponse<Product>> {

        this.logger.log(`محاولة تعديل المنتج: ${id} بواسطة: ${userId}`);

        // التحقق من صحة الـ ID
        this.validateObjectId(id);

        // جلب المنتج عشان نتأكد إنه موجود ومش محذوف
        const existingProduct = await this.productModel.findById(id);

        if (!existingProduct) {
            throw new NotFoundException(`المنتج بالـ ID: ${id} غير موجود`);
        }

        if (existingProduct.isDeleted) {
            throw new BadRequestException('لا يمكن تعديل منتج محذوف');
        }

        // لو الـ SKU اتغير، نتحقق من عدم التكرار
        if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
            await this.validateUniqueSku(updateProductDto.sku);
        }

        try {
            // إضافة معلومات التعديل
            const updateData = {
                ...updateProductDto,
                updatedBy: new Types.ObjectId(userId)
            };

            const updatedProduct = await this.productModel
                .findByIdAndUpdate(id, updateData, { new: true })
                .populate('category', 'name slug')
                .populate('marketplace', 'name logo')
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .exec();

            this.logger.log(`تم تعديل المنتج بنجاح: ${id}`);

            return {
                success: true,
                data: updatedProduct!,
                message: 'تم تعديل المنتج بنجاح'
            };

        } catch (error) {
            this.logger.error(`فشل في تعديل المنتج: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل في تعديل المنتج: ${error.message}`);
        }
    }

    // ============================================
    // DELETE - الحذف المنطقي (Soft Delete)
    // ============================================

    /**
     * حذف منتج (Soft Delete)
     * المنتج مش بيتمسح نهائياً، بس بيتعلم إنه محذوف
     * 
     * @param id - معرف المنتج
     * @param userId - معرف المستخدم اللي بيحذف
     * @returns رسالة النجاح
     */
    async remove(id: string, userId: string): Promise<{ success: boolean; message: string }> {

        this.logger.log(`محاولة حذف المنتج: ${id} بواسطة: ${userId}`);

        // التحقق من صحة الـ ID
        this.validateObjectId(id);

        const product = await this.productModel.findById(id);

        if (!product) {
            throw new NotFoundException(`المنتج بالـ ID: ${id} غير موجود`);
        }

        if (product.isDeleted) {
            throw new BadRequestException('المنتج محذوف بالفعل');
        }

        try {
            // Soft Delete - مش بنمسح، بنعلم بس
            await this.productModel.findByIdAndUpdate(id, {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: new Types.ObjectId(userId),
                isAvailable: false // المنتج المحذوف مش متاح للبيع
            });

            this.logger.log(`تم حذف المنتج (Soft Delete): ${id}`);

            return {
                success: true,
                message: 'تم حذف المنتج بنجاح'
            };

        } catch (error) {
            this.logger.error(`فشل في حذف المنتج: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل في حذف المنتج: ${error.message}`);
        }
    }

    /**
     * استرجاع منتج محذوف (Restore)
     * 
     * @param id - معرف المنتج
     * @param userId - معرف المستخدم اللي بيسترجع
     * @returns المنتج بعد الاسترجاع
     */
    async restore(id: string, userId: string): Promise<SingleResponse<Product>> {

        this.logger.log(`محاولة استرجاع المنتج: ${id} بواسطة: ${userId}`);

        this.validateObjectId(id);

        const product = await this.productModel.findById(id);

        if (!product) {
            throw new NotFoundException(`المنتج بالـ ID: ${id} غير موجود`);
        }

        if (!product.isDeleted) {
            throw new BadRequestException('المنتج غير محذوف');
        }

        try {
            const restoredProduct = await this.productModel
                .findByIdAndUpdate(id, {
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null,
                    isAvailable: product.stock > 0, // نرجع التوفر حسب المخزون
                    updatedBy: new Types.ObjectId(userId)
                }, { new: true })
                .populate('category', 'name slug')
                .populate('marketplace', 'name logo')
                .exec();

            this.logger.log(`تم استرجاع المنتج: ${id}`);

            return {
                success: true,
                data: restoredProduct!,
                message: 'تم استرجاع المنتج بنجاح'
            };

        } catch (error) {
            this.logger.error(`فشل في استرجاع المنتج: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل في استرجاع المنتج: ${error.message}`);
        }
    }

    // ============================================
    // SEARCH - البحث المتقدم
    // ============================================

    /**
     * البحث في المنتجات
     * بيدور في الاسم والوصف باستخدام MongoDB Text Search
     * 
     * @param searchQuery - كلمة البحث
     * @param query - باقي الـ Filters
     * @returns نتائج البحث
     */
    async search(
        searchQuery: string,
        query: any = {}
    ): Promise<PaginatedResponse<Product>> {

        this.logger.log(`البحث عن: ${searchQuery}`);

        if (!searchQuery || searchQuery.trim().length < 2) {
            throw new BadRequestException('كلمة البحث لازم تكون حرفين على الأقل');
        }

        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
        const skip = (page - 1) * limit;

        try {
            // استخدام MongoDB Text Search (عشان عاملنا Index على name و description)
            const filter: any = {
                $text: { $search: searchQuery },
                isDeleted: false
            };

            // إضافة فلاتر إضافية لو موجودة
            if (query.category) filter.category = query.category;
            if (query.marketplace) filter.marketplace = query.marketplace;
            if (query.isAvailable !== undefined) filter.isAvailable = query.isAvailable === 'true';

            const [products, totalItems] = await Promise.all([
                this.productModel
                    .find(filter, { score: { $meta: 'textScore' } }) // إضافة score للترتيب
                    .sort({ score: { $meta: 'textScore' } }) // ترتيب حسب الصلة
                    .populate('category', 'name slug')
                    .populate('marketplace', 'name logo')
                    .skip(skip)
                    .limit(limit)
                    .exec(),

                this.productModel.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(totalItems / limit);

            return {
                success: true,
                data: products as Product[],
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                message: `تم العثور على ${totalItems} نتيجة للبحث`
            };

        } catch (error) {
            this.logger.error(`فشل في البحث: ${error.message}`, error.stack);
            throw new BadRequestException(`فشل في البحث: ${error.message}`);
        }
    }

    // ============================================
    // Helper Methods - دوال مساعدة
    // ============================================

    /**
     * التحقق من صحة MongoDB ObjectId
     * عشان نمنع NoSQL Injection
     */
    private validateObjectId(id: string): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(`معرف غير صالح: ${id}`);
        }
    }

    /**
     * التحقق من عدم تكرار الـ SKU
     */
    private async validateUniqueSku(sku: string): Promise<void> {
        const existingProduct = await this.productModel.findOne({
            sku: sku.toUpperCase(),
            isDeleted: false
        });

        if (existingProduct) {
            throw new ConflictException(`كود المنتج (SKU) "${sku}" مستخدم بالفعل`);
        }
    }

    /**
     * جلب منتج بالـ ID مع Populate للبيانات المرتبطة
     */
    private async findByIdWithPopulate(id: string): Promise<Product | null> {
        return this.productModel
            .findById(id)
            .populate('category', 'name slug icon')
            .populate('marketplace', 'name logo description')
            .populate('createdBy', 'name email role')
            .populate('updatedBy', 'name email')
            .populate('deletedBy', 'name email')
            .exec();
    }

    /**
     * بناء الـ Filter Query من الـ Query Parameters
     */
    private buildFilterQuery(query: any): any {
        const filter: any = { isDeleted: false };

        // فلترة حسب الفئة
        if (query.category && Types.ObjectId.isValid(query.category)) {
            filter.category = query.category;
        }

        // فلترة حسب السوق
        if (query.marketplace && Types.ObjectId.isValid(query.marketplace)) {
            filter.marketplace = query.marketplace;
        }

        // فلترة حسب التوفر
        if (query.isAvailable !== undefined) {
            filter.isAvailable = query.isAvailable === 'true';
        }

        // فلترة حسب نطاق السعر
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter.price = {};
            if (query.minPrice !== undefined) {
                filter.price.$gte = parseFloat(query.minPrice);
            }
            if (query.maxPrice !== undefined) {
                filter.price.$lte = parseFloat(query.maxPrice);
            }
        }

        // فلترة حسب المخزون (في المخزن vs نفذت الكمية)
        if (query.inStock === 'true') {
            filter.stock = { $gt: 0 };
        } else if (query.inStock === 'false') {
            filter.stock = { $lte: 0 };
        }

        return filter;
    }

    /**
     * بناء الـ Sort Query
     */
    private buildSortQuery(sortBy?: string, sortOrder?: string): any {
        const order = sortOrder === 'asc' ? 1 : -1;

        switch (sortBy) {
            case 'price':
                return { price: order };
            case 'name':
                return { name: order };
            case 'stock':
                return { stock: order };
            case 'createdAt':
                return { createdAt: order };
            case 'soldCount':
                return { soldCount: order };
            default:
                // Default: الأحدث أولاً
                return { createdAt: -1 };
        }
    }
}
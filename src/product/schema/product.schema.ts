// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
// import { Document } from "mongoose";

// export type ProductDocument = Product & Document;

// @Schema()
// export class Product {
//     @Prop({ required: true })
//     name: string;

//     @Prop({ required: true })
//     description: string;

//     @Prop({ required: true })
//     price: number;

//     @Prop({ required: true })
//     image: string;

//     @Prop({ required: true })
//     category: string;

//     @Prop({ required: true })
//     marketplace: string;
// }

// export const ProductSchema = SchemaFactory.createForClass(Product);



// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
// import { Document, Types } from "mongoose";

// // تعريف نوع الـ Document عشان نستخدمه في الـ Service
// export type ProductDocument = Product & Document;

// /**
//  * ============================================
//  * الـ Product Schema - النسخة المُحسَّنة والكاملة
//  * ============================================
//  * 
//  * المميزات:
//  * 1. Soft Delete (الحذف المنطقي) - مينفعش نحذف المنتج نهائياً
//  * 2. Timestamps - تتبع وقت الإضافة والتعديل
//  * 3. Indexes - للبحث السريع
//  * 4. Relations - الربط مع Category و Marketplace
//  * 5. Stock Management - إدارة المخزون (max 100)
//  * 6. Slug - للـ SEO و URLs الـ Friendly
//  * 7. SKU - كود المنتج الفريد (يدخله المستخدم)
//  */

// @Schema({
//     timestamps: true, // بيضيف createdAt و updatedAt أوتوماتيك
//     toJSON: { virtuals: true }, // عشان الـ Virtuals تظهر في الـ JSON
//     toObject: { virtuals: true }
// })
// export class Product {

//     // ============================================
//     // البيانات الأساسية للمنتج
//     // ============================================

//     /**
//      * اسم المنتج
//      * - لازم يكون فريد عشان نولد منه الـ Slug
//      * - طوله بين 3 و 100 حرف
//      */
//     @Prop({
//         required: [true, 'اسم المنتج مطلوب'],
//         minlength: [3, 'اسم المنتج لازم يكون 3 حروف على الأقل'],
//         maxlength: [100, 'اسم المنتج مينفعش يزيد عن 100 حرف'],
//         trim: true // بيشيل المسافات من الأول والآخر
//     })
//     name: string;

//     /**
//      * الـ Slug - للـ SEO و الـ URLs
//      * - بيتولد أوتوماتيك من الاسم
//      * - لازم يكون فريد (مثلاً: iphone-15-pro)
//      */
//     @Prop({
//         required: true,
//         unique: true,
//         lowercase: true,
//         trim: true
//     })
//     slug: string;

//     /**
//      * SKU - كود المنتج الفريد (Stock Keeping Unit)
//      * - المستخدم هو اللي بيدخله
//      * - لازم يكون فريد في الداتابيز
//      */
//     @Prop({
//         required: [true, 'كود المنتج (SKU) مطلوب'],
//         unique: true,
//         uppercase: true,
//         trim: true
//     })
//     sku: string;

//     /**
//      * وصف المنتج
//      * - اختياري
//      * - أقصى حاجة 2000 حرف
//      */
//     @Prop({
//         maxlength: [2000, 'الوصف مينفعش يزيد عن 2000 حرف'],
//         trim: true,
//         default: ''
//     })
//     description: string;

//     // ============================================
//     // السعر والمخزون
//     // ============================================

//     /**
//      * سعر المنتج
//      * - لازم يكون رقم موجب
//      * - مينفعش يكون سالب أو صفر
//      */
//     @Prop({
//         required: [true, 'سعر المنتج مطلوب'],
//         min: [0.01, 'السعر لازم يكون أكبر من صفر'],
//         type: Number
//     })
//     price: number;

//     /**
//      * الكمية المتاحة في المخزون
//      * - أقصى حاجة 100 (حسب طلب العميل)
//      * - مينفعش تكون سالبة
//      */
//     @Prop({
//         required: [true, 'الكمية المتاحة مطلوبة'],
//         min: [0, 'الكمية مينفعش تكون سالبة'],
//         max: [100, 'الكمية الأقصى هي 100'],
//         default: 0,
//         type: Number
//     })
//     stock: number;

//     /**
//      * عدد القطع المباعة
//      * - بنزوده كل مرة يتباع منتج
//      * - للإحصائيات
//      */
//     @Prop({
//         default: 0,
//         min: 0,
//         type: Number
//     })
//     soldCount: number;

//     /**
//      * هل المنتج متاح للبيع؟
//      * - بيتغير أوتوماتيك لو الـ stock بقى 0
//      * - ممكن نتحكم فيه يدوي كمان
//      */
//     @Prop({
//         default: true,
//         type: Boolean
//     })
//     isAvailable: boolean;

//     // ============================================
//     // الصور
//     // ============================================

//     /**
//      * صور المنتج (من Cloudinary)
//      * - Array من URLs
//      * - الصورة الأولى هي الـ Main Image
//      */
//     @Prop({
//         type: [String],
//         default: [],
//         validate: {
//             validator: function (images: string[]) {
//                 // التحقق إن كل صورة URL صحيح
//                 return images.every(img =>
//                     typeof img === 'string' && img.startsWith('http')
//                 );
//             },
//             message: 'كل الصور لازم تكون URLs صحيحة'
//         }
//     })
//     images: string[];

//     // ============================================
//     // العلاقات (Relations) مع Collections التانية
//     // ============================================

//     /**
//      * الفئة (Category)
//      * - Reference للـ Category Collection
//      * - لازم نعمل populate عشان نجيب بيانات الفئة
//      */
//     @Prop({
//         type: Types.ObjectId,
//         ref: 'Category',
//         required: [true, 'فئة المنتج مطلوبة']
//     })
//     category: Types.ObjectId;

//     /**
//      * السوق (Marketplace)
//      * - Reference للـ Marketplace Collection
//      * - عشان نعرف المنتج تبع أنهي سوق
//      */
//     @Prop({
//         type: Types.ObjectId,
//         ref: 'Marketplace',
//         required: [true, 'السوق مطلوب']
//     })
//     marketplace: Types.ObjectId;

//     // ============================================
//     // تتبع التغييرات (Audit Trail)
//     // ============================================

//     /**
//      * مين اللي أنشأ المنتج؟
//      * - Reference للـ User Collection
//      * - عشان نعرف مين الـ Admin أو Seller اللي ضاف المنتج
//      */
//     @Prop({
//         type: Types.ObjectId,
//         ref: 'User',
//         required: [true, 'منشئ المنتج مطلوب']
//     })
//     createdBy: Types.ObjectId;

//     /**
//      * مين اللي عدل المنتج آخر مرة؟
//      * - بيتحدث أوتوماتيك مع كل تعديل
//      */
//     @Prop({
//         type: Types.ObjectId,
//         ref: 'User',
//         default: null
//     })
//     updatedBy: Types.ObjectId | null;

//     // ============================================
//     // Soft Delete (الحذف المنطقي)
//     // ============================================

//     /**
//      * هل المنتج محذوف؟
//      * - true = محذوف (مش هيظهر في البحث)
//      * - false = متاح (default)
//      */
//     @Prop({
//         default: false,
//         type: Boolean,
//         index: true // Index عشان البحث السريع
//     })
//     isDeleted: boolean;

//     /**
//      * امتى تم الحذف؟
//      * - بنسجل الوقت عشان نقدر نرجعه بعدين
//      */
//     @Prop({
//         type: Date,
//         default: null
//     })
//     deletedAt: Date | null;

//     /**
//      * مين اللي حذف المنتج؟
//      * - للتتبع والمراجعة
//      */
//     @Prop({
//         type: Types.ObjectId,
//         ref: 'User',
//         default: null
//     })
//     deletedBy: Types.ObjectId | null;

//     // ============================================
//     // Virtuals (خصائص افتراضية مش بتتخزن)
//     // ============================================

//     /**
//      * الصورة الرئيسية (أول صورة في الـ Array)
//      * - Virtual Property مش بتتخزن في الداتابيز
//      * - بتتولد وقت الـ Query
//      */
//     get mainImage(): string {
//         return this.images && this.images.length > 0
//             ? this.images[0]
//             : 'https://via.placeholder.com/400x400?text=No+Image';
//     }

//     /**
//      * نسبة الخصم (لو فيه خصم)
//      * - Virtual Property
//      */
//     get discountPercentage(): number {
//         // لو عايز تضيف خصم بعدين
//         return 0;
//     }
// }

// // ============================================
// // إنشاء الـ Schema
// // ============================================
// export const ProductSchema = SchemaFactory.createForClass(Product);

// // ============================================
// // Indexes للأداء (مهمة جداً!)
// // ============================================

// /**
//  * Index على الـ slug - للبحث السريع بالـ URL
//  * مثال: /products/iphone-15-pro
//  */
// ProductSchema.index({ slug: 1 }, { unique: true });

// /**
//  * Index على الـ sku - للبحث السريع بالكود
//  */
// ProductSchema.index({ sku: 1 }, { unique: true });

// /**
//  * Index على الـ name - للبحث النصي
//  * "text" عشان نقدر نستخدم $search
//  */
// ProductSchema.index({ name: 'text', description: 'text' });

// /**
//  * Index مركب على category + isAvailable + isDeleted
//  * عشان الـ Query اللي بتجيب المنتجات المتاحة في فئة معينة
//  */
// ProductSchema.index({ category: 1, isAvailable: 1, isDeleted: 1 });

// /**
//  * Index مركب على marketplace + isDeleted
//  * عشان نجيب كل منتجات سوق معين
//  */
// ProductSchema.index({ marketplace: 1, isDeleted: 1 });

// /**
//  * Index على isDeleted + createdAt
//  * عشان نجيب المنتجات المضافة حديثاً (New Arrivals)
//  */
// ProductSchema.index({ isDeleted: 1, createdAt: -1 });

// /**
//  * Index على الـ price - للترتيب حسب السعر
//  */
// ProductSchema.index({ price: 1 });

// // ============================================
// // Middleware (Hooks) - قبل وبعد العمليات
// // ============================================

// /**
//  * Pre-save Hook: قبل ما نحفظ المنتج
//  * - بنولد الـ Slug أوتوماتيك من الاسم
//  * - بنتحقق من الـ stock ونحدث isAvailable
//  */
// ProductSchema.pre('save', function (next: Function) {
//     // لو الاسم اتغير أو المنتج جديد، نولد الـ Slug
//     if (this.isModified('name') || this.isNew) {
//         this.slug = this.name
//             .toLowerCase()
//             .trim()
//             .replace(/[^\w\s-]/g, '') // نشيل الحروف الخاصة
//             .replace(/[\s_-]+/g, '-') // نبدل المسافات بـ -
//             .replace(/^-+|-+$/g, ''); // نشيل الـ - من الأول والآخر
//     }

//     // التحقق من المخزون وتحديث isAvailable
//     if (this.stock <= 0) {
//         this.isAvailable = false;
//     } else {
//         this.isAvailable = true;
//     }

//     // التأكد إن الكمية مش أكتر من 100
//     if (this.stock > 100) {
//         this.stock = 100;
//     }

//     next();
// });

// /**
//  * Pre-update Hook: قبل التحديث
//  * - نفس المنطق بس للـ update operations
//  */
// ProductSchema.pre('findOneAndUpdate', function (next: Function) {
//     const update = this.getUpdate() as any;

//     // لو الاسم اتغير، نولد Slug جديد
//     if (update.name) {
//         update.slug = update.name
//             .toLowerCase()
//             .trim()
//             .replace(/[^\w\s-]/g, '')
//             .replace(/[\s_-]+/g, '-')
//             .replace(/^-+|-+$/g, '');
//     }

//     // لو الـ stock اتغير، نحدث isAvailable
//     if (update.stock !== undefined) {
//         update.isAvailable = update.stock > 0;
//         // نتأكد من الـ max
//         if (update.stock > 100) {
//             update.stock = 100;
//         }
//     }

//     next();
// });

// /**
//  * Virtual Populate: عشان نجيب الـ Reviews بتاعت المنتج
//  * (لو عايز تضيف Reviews بعدين)
//  */
// ProductSchema.virtual('reviews', {
//     ref: 'Review',
//     localField: '_id',
//     foreignField: 'product'
// });



import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types, CallbackError, SaveOptions, Query, HydratedDocument } from "mongoose";
import * as mongoose from 'mongoose';

// تعريف نوع الـ Document عشان نستخدمه في الـ Service
export type ProductDocument = HydratedDocument<Product>;

// تعريف واجهة للـ Methods
export interface IProductMethods {
    decrementStock(quantity?: number): Promise<boolean>;
    incrementStock(quantity?: number): Promise<void>;
    softDelete(deletedBy: Types.ObjectId): Promise<void>;
    restore(): Promise<void>;
}

// تعريف واجهة للـ Query Helpers
export interface IProductQueryHelpers {
    available(): this;
    byCategory(categoryId: Types.ObjectId): this;
    priceRange(min: number, max: number): this;
}

// تعريف واجهة للـ Static Methods
export interface IProductStaticMethods {
    findAvailable(): Promise<ProductDocument[]>;
    findBestSelling(limit?: number): Promise<ProductDocument[]>;
    findSimilar(productId: Types.ObjectId, categoryId: Types.ObjectId, limit?: number): Promise<ProductDocument[]>;
}

// تعريف النوع النهائي للمنتج مع الـ Methods
export type ProductModel = mongoose.Model<ProductDocument, IProductQueryHelpers, IProductMethods> & IProductStaticMethods;

// ============================================
// Enums للحالات المختلفة
// ============================================
export enum ProductStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    ACTIVE = 'active',
    OUT_OF_STOCK = 'out_of_stock',
    DISCONTINUED = 'discontinued',
    ARCHIVED = 'archived'
}

export enum ProductCondition {
    NEW = 'new',
    LIKE_NEW = 'like_new',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor'
}

@Schema({
    timestamps: true, // بيضيف createdAt و updatedAt أوتوماتيك
    toJSON: { virtuals: true }, // عشان الـ Virtuals تظهر في الـ JSON
    toObject: { virtuals: true },
    optimisticConcurrency: true, // لمنع الـ race conditions
    autoIndex: process.env.NODE_ENV !== 'production', // auto index فقط في التطوير
})
export class Product {

    // ============================================
    // البيانات الأساسية للمنتج
    // ============================================

    /**
     * اسم المنتج
     * - لازم يكون فريد عشان نولد منه الـ Slug
     * - طوله بين 3 و 100 حرف
     */
    @Prop({
        required: [true, 'اسم المنتج مطلوب'],
        minlength: [3, 'اسم المنتج لازم يكون 3 حروف على الأقل'],
        maxlength: [100, 'اسم المنتج مينفعش يزيد عن 100 حرف'],
        trim: true, // بيشيل المسافات من الأول والآخر
        index: true
    })
    name: string;

    /**
     * الـ Slug - للـ SEO و الـ URLs
     * - بيتولد أوتوماتيك من الاسم
     * - لازم يكون فريد (مثلاً: iphone-15-pro)
     */
    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    })
    slug: string;

    /**
     * SKU - كود المنتج الفريد (Stock Keeping Unit)
     * - المستخدم هو اللي بيدخله
     * - لازم يكون فريد في الداتابيز
     */
    @Prop({
        required: [true, 'كود المنتج (SKU) مطلوب'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9-]+$/, 'SKU يجب أن يحتوي على أحرف كبيرة وأرقام وشرطات فقط']
    })
    sku: string;

    /**
     * وصف المنتج
     * - اختياري
     * - أقصى حاجة 2000 حرف
     */
    @Prop({
        maxlength: [2000, 'الوصف مينفعش يزيد عن 2000 حرف'],
        trim: true,
        default: ''
    })
    description: string;

    /**
     * وصف قصير (للـ SEO)
     */
    @Prop({
        maxlength: [300, 'الوصف القصير مينفعش يزيد عن 300 حرف'],
        trim: true
    })
    shortDescription: string;

    // ============================================
    // التصنيف والحالة
    // ============================================

    @Prop({
        type: String,
        enum: ProductStatus,
        default: ProductStatus.DRAFT
    })
    status: ProductStatus;

    @Prop({
        type: String,
        enum: ProductCondition,
        default: ProductCondition.NEW
    })
    condition: ProductCondition;

    @Prop({
        type: [String],
        default: []
    })
    tags: string[];

    // ============================================
    // السعر والمخزون
    // ============================================

    /**
     * سعر المنتج
     * - لازم يكون رقم موجب
     * - مينفعش يكون سالب أو صفر
     */
    @Prop({
        required: [true, 'سعر المنتج مطلوب'],
        min: [0.01, 'السعر لازم يكون أكبر من صفر'],
        type: Number,
        set: (price: number) => Math.round(price * 100) / 100 // تقريب لـ منزلتين
    })
    price: number;

    /**
     * سعر المقارنة (السعر الأصلي قبل الخصم)
     */
    @Prop({
        min: 0,
        type: Number
    })
    compareAtPrice: number;

    /**
     * الكمية المتاحة في المخزون
     * - أقصى حاجة 100 (حسب طلب العميل)
     * - مينفعش تكون سالبة
     */
    @Prop({
        required: [true, 'الكمية المتاحة مطلوبة'],
        min: [0, 'الكمية مينفعش تكون سالبة'],
        max: [100, 'الكمية الأقصى هي 100'],
        default: 0,
        type: Number
    })
    stock: number;

    /**
     * أقل كمية للتنبيه
     */
    @Prop({
        default: 5,
        min: 0,
        type: Number
    })
    lowStockThreshold: number;

    /**
     * عدد القطع المباعة
     * - بنزوده كل مرة يتباع منتج
     * - للإحصائيات
     */
    @Prop({
        default: 0,
        min: 0,
        type: Number
    })
    soldCount: number;

    /**
     * هل المنتج متاح للبيع؟
     * - بيتغير أوتوماتيك لو الـ stock بقى 0
     * - ممكن نتحكم فيه يدوي كمان
     */
    @Prop({
        default: true,
        type: Boolean
    })
    isAvailable: boolean;

    // ============================================
    // الصور والوسائط
    // ============================================

    /**
     * صور المنتج (من Cloudinary)
     * - Array من URLs
     * - الصورة الأولى هي الـ Main Image
     */
    @Prop({
        type: [String],
        default: [],
        validate: {
            validator: function (images: string[]) {
                return images.every(img =>
                    typeof img === 'string' &&
                    (img.startsWith('http') || img.startsWith('/uploads'))
                );
            },
            message: 'كل الصور لازم تكون URLs صحيحة'
        }
    })
    images: string[];

    @Prop({
        type: Map,
        of: String,
        default: {}
    })
    videos: Map<string, string>;

    // ============================================
    // العلاقات (Relations) مع Collections التانية
    // ============================================

    /**
     * الفئة (Category)
     * - Reference للـ Category Collection
     * - لازم نعمل populate عشان نجيب بيانات الفئة
     */
    @Prop({
        type: Types.ObjectId,
        ref: 'Category',
        required: [true, 'فئة المنتج مطلوبة'],
        index: true
    })
    category: Types.ObjectId;

    /**
     * السوق (Marketplace)
     * - Reference للـ Marketplace Collection
     * - عشان نعرف المنتج تبع أنهي سوق
     */
    @Prop({
        type: Types.ObjectId,
        ref: 'Marketplace',
        required: [true, 'السوق مطلوب'],
        index: true
    })
    marketplace: Types.ObjectId;

    // ============================================
    // المواصفات والمتغيرات
    // ============================================

    @Prop({
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    })
    attributes: Map<string, any>;

    @Prop({
        type: [{
            name: String,
            value: String,
            price: Number,
            stock: Number,
            sku: String
        }],
        default: []
    })
    variants: {
        name: string;
        value: string;
        price?: number;
        stock?: number;
        sku?: string;
    }[];

    // ============================================
    // SEO
    // ============================================

    @Prop({
        type: {
            title: String,
            description: String,
            keywords: [String],
            canonicalUrl: String
        },
        default: {}
    })
    seo: {
        title?: string;
        description?: string;
        keywords?: string[];
        canonicalUrl?: string;
    };

    // ============================================
    // تتبع التغييرات (Audit Trail)
    // ============================================

    /**
     * مين اللي أنشأ المنتج؟
     * - Reference للـ User Collection
     * - عشان نعرف مين الـ Admin أو Seller اللي ضاف المنتج
     */
    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: [true, 'منشئ المنتج مطلوب'],
        index: true
    })
    createdBy: Types.ObjectId;

    /**
     * مين اللي عدل المنتج آخر مرة؟
     * - بيتحدث أوتوماتيك مع كل تعديل
     */
    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        default: null
    })
    updatedBy: Types.ObjectId | null;

    // ============================================
    // Soft Delete (الحذف المنطقي)
    // ============================================

    /**
     * هل المنتج محذوف؟
     * - true = محذوف (مش هيظهر في البحث)
     * - false = متاح (default)
     */
    @Prop({
        default: false,
        type: Boolean,
        index: true
    })
    isDeleted: boolean;

    /**
     * امتى تم الحذف؟
     * - بنسجل الوقت عشان نقدر نرجعه بعدين
     */
    @Prop({
        type: Date,
        default: null
    })
    deletedAt: Date | null;

    /**
     * مين اللي حذف المنتج؟
     * - للتتبع والمراجعة
     */
    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        default: null
    })
    deletedBy: Types.ObjectId | null;

    // ============================================
    // إحصائيات ومعلومات إضافية
    // ============================================

    @Prop({
        type: Number,
        default: 0,
        min: 0,
        max: 5
    })
    averageRating: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0
    })
    reviewCount: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0
    })
    viewCount: number;

    @Prop({
        type: Number,
        default: 0,
        min: 0
    })
    wishlistCount: number;

    // ============================================
    // Timestamps (الموجودة من الـ Schema)
    // ============================================
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// إنشاء الـ Schema
// ============================================
export const ProductSchema = SchemaFactory.createForClass(Product);

// ============================================
// Indexes محسّنة للأداء
// ============================================

// Indexes فريدة
ProductSchema.index({ slug: 1 }, {
    unique: true,
    background: true,
    name: 'idx_slug_unique'
});

ProductSchema.index({ sku: 1 }, {
    unique: true,
    background: true,
    name: 'idx_sku_unique'
});

// Text search indexes
ProductSchema.index(
    {
        name: 'text',
        description: 'text',
        shortDescription: 'text',
        tags: 'text'
    },
    {
        weights: {
            name: 10,
            shortDescription: 5,
            tags: 3,
            description: 1
        },
        name: 'idx_search_text',
        background: true
    }
);

// Compound indexes للتصفية الشائعة
ProductSchema.index(
    { category: 1, status: 1, isDeleted: 1 },
    {
        name: 'idx_category_status',
        background: true
    }
);

ProductSchema.index(
    { marketplace: 1, status: 1, isDeleted: 1 },
    {
        name: 'idx_marketplace_status',
        background: true
    }
);

ProductSchema.index(
    { isDeleted: 1, createdAt: -1 },
    {
        name: 'idx_recent_products',
        background: true
    }
);

ProductSchema.index(
    { price: 1, status: 1 },
    {
        name: 'idx_price_filter',
        background: true
    }
);

ProductSchema.index(
    { averageRating: -1, reviewCount: -1 },
    {
        name: 'idx_best_rated',
        background: true,
        partialFilterExpression: { averageRating: { $gt: 0 } }
    }
);

ProductSchema.index(
    { soldCount: -1 },
    {
        name: 'idx_best_selling',
        background: true
    }
);

// ============================================
// Virtuals (خصائص افتراضية مش بتتخزن)
// ============================================

/**
 * الصورة الرئيسية (أول صورة في الـ Array)
 */
ProductSchema.virtual('mainImage').get(function (this: ProductDocument) {
    return this.images && this.images.length > 0
        ? this.images[0]
        : process.env.DEFAULT_PRODUCT_IMAGE || 'https://via.placeholder.com/400x400?text=No+Image';
});

/**
 * هل المنتج في المخزون؟
 */
ProductSchema.virtual('inStock').get(function (this: ProductDocument) {
    return this.stock > 0 && this.isAvailable;
});

/**
 * هل المخزون منخفض؟
 */
ProductSchema.virtual('isLowStock').get(function (this: ProductDocument) {
    return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

/**
 * سعر الخصم (لو موجود)
 */
ProductSchema.virtual('discountedPrice').get(function (this: ProductDocument) {
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
        return this.price;
    }
    return null;
});

/**
 * نسبة الخصم
 */
ProductSchema.virtual('discountPercentage').get(function (this: ProductDocument) {
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
        return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
    }
    return 0;
});

/**
 * هل المنتج جديد؟ (خلال 30 يوم)
 */
ProductSchema.virtual('isNew').get(function (this: ProductDocument) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt > thirtyDaysAgo;
});

// ============================================
// Middleware (Hooks) محسّنة
// ============================================

/**
 * Pre-save Hook: قبل ما نحفظ المنتج
 */
ProductSchema.pre<ProductDocument>('save', async function (next: any) {
    try {
        // توليد الـ Slug أوتوماتيك من الاسم
        if (this.isModified('name') || !this.slug) {
            this.slug = this.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        // التحقق من المخزون وتحديث الحالة
        if (this.stock <= 0) {
            this.isAvailable = false;
            if (this.status === ProductStatus.ACTIVE) {
                this.status = ProductStatus.OUT_OF_STOCK;
            }
        } else {
            this.isAvailable = true;
        }

        // تحديث الحالة بناءً على المخزون
        if (this.stock > 0 && this.status === ProductStatus.OUT_OF_STOCK) {
            this.status = ProductStatus.ACTIVE;
        }

        // التأكد إن الكمية مش أكتر من 100
        if (this.stock > 100) {
            this.stock = 100;
        }

        // توليد وصف قصير إذا مش موجود
        if (!this.shortDescription && this.description) {
            this.shortDescription = this.description.substring(0, 150) + '...';
        }

        next();
    } catch (error) {
        next(error as CallbackError);
    }
});

/**
 * Pre-update Hook: قبل التحديث
 */
ProductSchema.pre('findOneAndUpdate', async function (this: Query<any, ProductDocument>, next: any) {
    try {
        const update = this.getUpdate() as any;

        if (update.name) {
            update.slug = update.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        if (update.stock !== undefined) {
            update.isAvailable = update.stock > 0;
            if (update.stock > 100) {
                update.stock = 100;
            }

            // تحديث الحالة بناءً على المخزون
            if (update.stock <= 0) {
                update.status = ProductStatus.OUT_OF_STOCK;
            } else if (update.status === ProductStatus.OUT_OF_STOCK) {
                update.status = ProductStatus.ACTIVE;
            }
        }

        // تحديث الـ updatedBy لو موجود
        if (update.updatedBy) {
            this.set({ updatedAt: new Date() });
        }

        next();
    } catch (error) {
        next(error as CallbackError);
    }
});

/**
 * Pre-delete Hook: للحذف المنطقي
 */
ProductSchema.pre('deleteOne', { document: true, query: false }, async function (this: ProductDocument, next: any) {
    // منع الحذف الفعلي - استخدم soft delete بدلاً منه
    next(new Error('الحذف الفعلي غير مسموح. استخدم soft delete بدلاً منه'));
});

// ============================================
// Instance Methods (طرق خاصة بكل Document)
// ============================================

/**
 * تقليل المخزون عند البيع
 */
ProductSchema.methods.decrementStock = async function (quantity: number = 1): Promise<boolean> {
    if (this.stock < quantity) {
        throw new Error('الكمية المطلوبة غير متوفرة');
    }

    this.stock -= quantity;
    this.soldCount += quantity;

    if (this.stock <= 0) {
        this.isAvailable = false;
        this.status = ProductStatus.OUT_OF_STOCK;
    }

    await this.save();
    return true;
};

/**
 * زيادة المخزون (عند الإرجاع)
 */
ProductSchema.methods.incrementStock = async function (quantity: number = 1): Promise<void> {
    this.stock = Math.min(this.stock + quantity, 100);
    this.isAvailable = true;

    if (this.status === ProductStatus.OUT_OF_STOCK) {
        this.status = ProductStatus.ACTIVE;
    }

    await this.save();
};

/**
 * Soft delete
 */
ProductSchema.methods.softDelete = async function (deletedBy: Types.ObjectId): Promise<void> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.status = ProductStatus.ARCHIVED;
    await this.save();
};

/**
 * Restore from soft delete
 */
ProductSchema.methods.restore = async function (): Promise<void> {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    this.status = this.stock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;
    await this.save();
};

// ============================================
// Static Methods (طرق على مستوى الـ Model)
// ============================================

/**
 * البحث عن المنتجات المتاحة
 */
ProductSchema.statics.findAvailable = function () {
    return this.find({
        isDeleted: false,
        status: ProductStatus.ACTIVE,
        stock: { $gt: 0 }
    });
};

/**
 * البحث عن المنتجات الأكثر مبيعاً
 */
ProductSchema.statics.findBestSelling = function (limit: number = 10) {
    return this.find({
        isDeleted: false,
        status: ProductStatus.ACTIVE
    })
        .sort({ soldCount: -1 })
        .limit(limit);
};

/**
 * البحث عن منتجات مشابهة
 */
ProductSchema.statics.findSimilar = function (productId: Types.ObjectId, categoryId: Types.ObjectId, limit: number = 5) {
    return this.find({
        _id: { $ne: productId },
        category: categoryId,
        isDeleted: false,
        status: ProductStatus.ACTIVE,
        stock: { $gt: 0 }
    })
        .sort({ averageRating: -1, soldCount: -1 })
        .limit(limit);
};

// ============================================
// Query Helpers
// ============================================

/**
 * Query Helper للمنتجات غير المحذوفة
 */
// @ts-ignore
ProductSchema.query.available = function (this: Query<any, ProductDocument>) {
    return this.where({ isDeleted: false, status: ProductStatus.ACTIVE });
};

/**
 * Query Helper للمنتجات حسب الفئة
 */
// @ts-ignore
ProductSchema.query.byCategory = function (this: Query<any, ProductDocument>, categoryId: Types.ObjectId) {
    return this.where({ category: categoryId });
};

/**
 * Query Helper للمنتجات في نطاق سعري
 */
// @ts-ignore
ProductSchema.query.priceRange = function (this: Query<any, ProductDocument>, min: number, max: number) {
    return this.where('price').gte(min).lte(max);
};

// ============================================
// Virtual Populate
// ============================================

// المراجعات
ProductSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product',
    options: { sort: { createdAt: -1 }, limit: 10 }
});

// التقييمات
ProductSchema.virtual('ratings', {
    ref: 'Rating',
    localField: '_id',
    foreignField: 'product'
});

// الاستفسارات
ProductSchema.virtual('inquiries', {
    ref: 'Inquiry',
    localField: '_id',
    foreignField: 'product'
});

// ============================================
// تصدير الـ Schema مع الأنواع
// ============================================
export { ProductSchema as ProductSchemaFinal };
// import { IsString, IsNumber, IsOptional } from 'class-validator';

// export class CreateProductDto {
//     @IsString()
//     name: string;

//     @IsNumber()
//     price: number;

//     @IsString()
//     @IsOptional()
//     description?: string;

//     @IsString()
//     @IsOptional()
//     category?: string;
// }


import { 
    IsString, 
    IsNumber, 
    IsOptional, 
    IsArray, 
    IsMongoId, 
    MinLength, 
    MaxLength, 
    Min, 
    Max, 
    IsBoolean,
    ArrayMaxSize,
    IsUrl,
    ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ============================================
 * Create Product DTO
 * ============================================
 * 
 * ده الـ DTO اللي بيستخدم لما نضيف منتج جديد
 * فيه كل الـ Validation Rules عشان نضمن البيانات صحيحة
 * 
 * المميزات:
 * 1. Validation قوي على كل حقل
 * 2. Swagger Documentation
 * 3. Transform للأنواع (string → number)
 * 4. رسائل خطأ واضحة بالعربي
 */

export class CreateProductDto {
    
    // ============================================
    // البيانات الأساسية
    // ============================================

    /**
     * اسم المنتج
     * - مطلوب
     * - بين 3 و 100 حرف
     */
    @ApiProperty({
        description: 'اسم المنتج',
        example: 'iPhone 15 Pro',
        minLength: 3,
        maxLength: 100,
        required: true
    })
    @IsString({ message: 'اسم المنتج لازم يكون نص' })
    @MinLength(3, { message: 'اسم المنتج لازم يكون 3 حروف على الأقل' })
    @MaxLength(100, { message: 'اسم المنتج مينفعش يزيد عن 100 حرف' })
    name: string;

    /**
     * SKU - كود المنتج الفريد
     * - المستخدم بيدخله يدوي
     * - لازم يكون فريد (هنتحقق في الـ Service)
     */
    @ApiProperty({
        description: 'كود المنتج الفريد (SKU) - يدخله المستخدم',
        example: 'IP15-PRO-256',
        required: true
    })
    @IsString({ message: 'كود المنتج لازم يكون نص' })
    @MinLength(3, { message: 'كود المنتج لازم يكون 3 حروف على الأقل' })
    @MaxLength(50, { message: 'كود المنتج مينفعش يزيد عن 50 حرف' })
    sku: string;

    /**
     * وصف المنتج
     * - اختياري
     * - أقصى 2000 حرف
     */
    @ApiPropertyOptional({
        description: 'وصف المنتج (اختياري)',
        example: 'أحدث إصدار من iPhone مع معالج A17 Pro',
        maxLength: 2000
    })
    @IsOptional()
    @IsString({ message: 'الوصف لازم يكون نص' })
    @MaxLength(2000, { message: 'الوصف مينفعش يزيد عن 2000 حرف' })
    description?: string;

    // ============================================
    // السعر والمخزون
    // ============================================

    /**
     * سعر المنتج
     * - مطلوب
     * - لازم يكون رقم أكبر من صفر
     */
    @ApiProperty({
        description: 'سعر المنتج',
        example: 999.99,
        minimum: 0.01,
        required: true
    })
    @IsNumber({}, { message: 'السعر لازم يكون رقم' })
    @Min(0.01, { message: 'السعر لازم يكون أكبر من صفر' })
    @Type(() => Number) // Transform string to number
    price: number;

    /**
     * الكمية المتاحة في المخزون
     * - مطلوب
     * - بين 0 و 100 (حسب طلب العميل)
     */
    @ApiProperty({
        description: 'الكمية المتاحة في المخزون (0-100)',
        example: 50,
        minimum: 0,
        maximum: 100,
        required: true
    })
    @IsNumber({}, { message: 'الكمية لازم تكون رقم' })
    @Min(0, { message: 'الكمية مينفعش تكون سالبة' })
    @Max(100, { message: 'الكمية الأقصى هي 100' })
    @Type(() => Number)
    stock: number;

    // ============================================
    // الصور
    // ============================================

    /**
     * صور المنتج (URLs من Cloudinary)
     * - اختياري
     * - Array من URLs
     * - أقصى 10 صور
     */
    @ApiPropertyOptional({
        description: 'روابط صور المنتج من Cloudinary',
        example: [
            'https://res.cloudinary.com/demo/image/upload/v123456/product1.jpg',
            'https://res.cloudinary.com/demo/image/upload/v123456/product2.jpg'
        ],
        type: [String]
    })
    @IsOptional()
    @IsArray({ message: 'الصور لازم تكون مصفوفة' })
    @ArrayMaxSize(10, { message: 'مينفعش أكتر من 10 صور' })
    @IsUrl({}, { 
        each: true, 
        message: 'كل صورة لازم تكون URL صحيح' 
    })
    images?: string[];

    // ============================================
    // العلاقات (References)
    // ============================================

    /**
     * ID الفئة (Category)
     * - مطلوب
     * - لازم يكون MongoDB ObjectId صحيح
     */
    @ApiProperty({
        description: 'معرف الفئة (Category ID)',
        example: '507f1f77bcf86cd799439011',
        required: true
    })
    @IsMongoId({ message: 'معرف الفئة لازم يكون MongoDB ObjectId صحيح' })
    category: string;

    /**
     * ID السوق (Marketplace)
     * - مطلوب
     * - لازم يكون MongoDB ObjectId صحيح
     */
    @ApiProperty({
        description: 'معرف السوق (Marketplace ID)',
        example: '507f1f77bcf86cd799439012',
        required: true
    })
    @IsMongoId({ message: 'معرف السوق لازم يكون MongoDB ObjectId صحيح' })
    marketplace: string;

    // ============================================
    // حقول اختيارية إضافية
    // ============================================

    /**
     * هل المنتج متاح للبيع؟
     * - اختياري (default: true)
     * - بيتحدد أوتوماتيك حسب الـ stock
     */
    @ApiPropertyOptional({
        description: 'هل المنتج متاح للبيع؟ (يتم تحديده تلقائياً حسب المخزون)',
        example: true,
        default: true
    })
    @IsOptional()
    @IsBoolean({ message: 'isAvailable لازم تكون true أو false' })
    isAvailable?: boolean;
}
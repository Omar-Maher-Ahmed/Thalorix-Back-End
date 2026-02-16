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
    IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * ============================================
 * Update Product DTO
 * ============================================
 * 
 * ده الـ DTO اللي بيستخدم لما نعدل منتج موجود
 * كل الحقول اختيارية (Optional) عشان ممكن نعدل حاجة واحدة بس
 * 
 * المميزات:
 * 1. كل الحقول اختيارية
 * 2. نفس الـ Validation بتاع CreateProductDto
 * 3. Swagger Documentation
 */

export class UpdateProductDto {
    
    // ============================================
    // البيانات الأساسية (كلها اختيارية)
    // ============================================

    /**
     * اسم المنتج
     * - اختياري
     * - لو اتبعت، هنولد Slug جديد أوتوماتيك
     */
    @ApiPropertyOptional({
        description: 'اسم المنتج الجديد (اختياري)',
        example: 'iPhone 15 Pro Max',
        minLength: 3,
        maxLength: 100
    })
    @IsOptional()
    @IsString({ message: 'اسم المنتج لازم يكون نص' })
    @MinLength(3, { message: 'اسم المنتج لازم يكون 3 حروف على الأقل' })
    @MaxLength(100, { message: 'اسم المنتج مينفعش يزيد عن 100 حرف' })
    name?: string;

    /**
     * SKU - كود المنتج الفريد
     * - اختياري
     * - لو اتغير، هنتحقق إنه فريد
     */
    @ApiPropertyOptional({
        description: 'كود المنتج الجديد (SKU) - اختياري',
        example: 'IP15-PROMAX-256'
    })
    @IsOptional()
    @IsString({ message: 'كود المنتج لازم يكون نص' })
    @MinLength(3, { message: 'كود المنتج لازم يكون 3 حروف على الأقل' })
    @MaxLength(50, { message: 'كود المنتج مينفعش يزيد عن 50 حرف' })
    sku?: string;

    /**
     * وصف المنتج
     * - اختياري
     */
    @ApiPropertyOptional({
        description: 'وصف المنتج الجديد (اختياري)',
        example: 'أحدث إصدار مع شاشة أكبر'
    })
    @IsOptional()
    @IsString({ message: 'الوصف لازم يكون نص' })
    @MaxLength(2000, { message: 'الوصف مينفعش يزيد عن 2000 حرف' })
    description?: string;

    // ============================================
    // السعر والمخزون (اختياري)
    // ============================================

    /**
     * سعر المنتج
     * - اختياري
     */
    @ApiPropertyOptional({
        description: 'السعر الجديد (اختياري)',
        example: 1099.99,
        minimum: 0.01
    })
    @IsOptional()
    @IsNumber({}, { message: 'السعر لازم يكون رقم' })
    @Min(0.01, { message: 'السعر لازم يكون أكبر من صفر' })
    @Type(() => Number)
    price?: number;

    /**
     * الكمية المتاحة
     * - اختياري
     * - لو اتغيرت، isAvailable هيتحدث أوتوماتيك
     */
    @ApiPropertyOptional({
        description: 'الكمية الجديدة (0-100) - اختياري',
        example: 75,
        minimum: 0,
        maximum: 100
    })
    @IsOptional()
    @IsNumber({}, { message: 'الكمية لازم تكون رقم' })
    @Min(0, { message: 'الكمية مينفعش تكون سالبة' })
    @Max(100, { message: 'الكمية الأقصى هي 100' })
    @Type(() => Number)
    stock?: number;

    // ============================================
    // الصور (اختياري)
    // ============================================

    /**
     * صور المنتج
     * - اختياري
     * - لو اتبعت Array جديدة، هتستبدل القديمة
     */
    @ApiPropertyOptional({
        description: 'روابط الصور الجديدة (اختياري)',
        example: [
            'https://res.cloudinary.com/demo/image/upload/v123456/new-product.jpg'
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
    // العلاقات (اختياري)
    // ============================================

    /**
     * ID الفئة الجديدة
     * - اختياري
     */
    @ApiPropertyOptional({
        description: 'معرف الفئة الجديدة (اختياري)',
        example: '507f1f77bcf86cd799439011'
    })
    @IsOptional()
    @IsMongoId({ message: 'معرف الفئة لازم يكون MongoDB ObjectId صحيح' })
    category?: string;

    /**
     * ID السوق الجديد
     * - اختياري
     */
    @ApiPropertyOptional({
        description: 'معرف السوق الجديد (اختياري)',
        example: '507f1f77bcf86cd799439012'
    })
    @IsOptional()
    @IsMongoId({ message: 'معرف السوق لازم يكون MongoDB ObjectId صحيح' })
    marketplace?: string;

    // ============================================
    // حقول إضافية (اختياري)
    // ============================================

    /**
     * هل المنتج متاح؟
     * - اختياري
     * - ممكن نتحكم فيه يدوي (override الـ automatic)
     */
    @ApiPropertyOptional({
        description: 'هل المنتج متاح؟ (اختياري - يمكن التحكم يدوياً)',
        example: false
    })
    @IsOptional()
    @IsBoolean({ message: 'isAvailable لازم تكون true أو false' })
    isAvailable?: boolean;
}
// import { Module } from '@nestjs/common';
// import { ProductController } from './product.controller';
// import { ProductService } from './product.service';
// import { MongooseModule } from '@nestjs/mongoose';
// import { MarketPlaceModule } from 'src/market_place/market_place.module';
// import { Product, ProductSchema } from './schema/product.schema';
// import { CategoriesModule } from 'src/categories/categories.module';


// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: Product.name, schema: ProductSchema },
//     ]),
//     // MarketPlaceModule,
//     // CategoriesModule,
//   ],
//   controllers: [ProductController],
//   providers: [ProductService],
//   exports: [ProductService]
// })
// export class ProductModule { }

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schema/product.schema';

/**
 * ============================================
 * Product Module - النسخة المُحسَّنة
 * ============================================
 * 
 * الـ Module ده بيجمع كل حاجة متعلقة بالـ Products:
 * - Controller: واجهة الـ API
 * - Service: الـ Business Logic
 * - Schema: تعريف الـ Database
 * 
 * المميزات:
 * 1. Mongoose Integration
 * 2. Indexes Configuration
 * 3. Exports للـ Service (عشان Modules تانية تستخدمه)
 */

@Module({
    imports: [
        // ربط الـ Schema مع MongoDB
        MongooseModule.forFeature([
            { 
                name: Product.name, 
                schema: ProductSchema 
            }
        ])
        // ملاحظة: لو عايز تضيف Modules تانية (زي Categories, Marketplaces)
        // هنا ممكن تضيفهم
    ],
    
    controllers: [
        ProductController // واجهة الـ API
    ],
    
    providers: [
        ProductService // الـ Business Logic
    ],
    
    exports: [
        ProductService // عشان Modules تانية تقدر تستخدم الـ Service
    ]
})
export class ProductModule {}
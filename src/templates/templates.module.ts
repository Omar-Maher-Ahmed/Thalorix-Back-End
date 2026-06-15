import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './schema/template.schema';
import { Category, CategorySchema } from 'src/categories/schema/category.schema';
import { TemplateService } from './templates.service';
import { TemplateController } from './templates.controller';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../services/cloudinary/cloudinary.module';
import { SellersModule } from '../sellers/sellers.module';


@Module({
  imports: [
    AuthModule,
    CloudinaryModule,
    SellersModule,

    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplatesModule {}
//             import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";  

// import { Types } from "mongoose";

// @Schema({ timestamps: true })
// export class Category {
//     @Prop({ required: true })
//     name: string;

//     @Prop({ type: Types.ObjectId, ref: 'Marketplace', required: true })
//     marketplaceId: Types.ObjectId;

//     @Prop({ type: Types.ObjectId })
//     categoryId: Types.ObjectId;
// }

// export const CategorySchema = SchemaFactory.createForClass(Category);                                                    import { IsString, IsMongoId } from 'class-validator';
// export class CreateCategoryDto {

//     @IsString()
//     name: string;

//     @IsMongoId()
//     marketplaceId: string;
// }            
import { IsString, IsMongoId, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsMongoId()
  marketplaceId: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;
}

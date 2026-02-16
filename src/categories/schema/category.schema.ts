import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class Category {
    @Prop({ required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'Marketplace', required: true })
    marketplaceId: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    categoryId: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class ProductEntity extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    image: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    marketplace: string;
}

export const ProductSchema = SchemaFactory.createForClass(ProductEntity);

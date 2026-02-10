import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
    timestamps: true,
    collection: 'users',
})
export class User extends Document {
    // @Prop({ required: true, unique: true, trim: true })
    // user_id: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true, unique: true })
    phone: string;

    @Prop({ required: false })
    password: string;

    @Prop({ default: 'user' })
    role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Roles } from 'src/auth/enums/roles.enum';

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

    @Prop({ type: String, enum: [Roles.Admin, Roles.User, Roles.Seller], default: Roles.User, })
    role: Roles;

    @Prop({ required: false })
    refreshToken: string;

    @Prop({ required: false })
    resetPasswordToken: string;

    @Prop({ required: false })
    resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

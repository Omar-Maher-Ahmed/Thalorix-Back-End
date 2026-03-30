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

    @Prop({
        required: true,
        trim: true,
        validate: {
            validator: function (v: string) {
                return /^[\u0600-\u06FFa-zA-Z\s]+$/.test(v);
            },
            message: 'Name must contain only letters and spaces'
        }
    })
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



    @Prop({ default: false })
    isVerified: boolean;

    @Prop({ default: 0 })
    loginAttempts: number;

    @Prop()
    lastLoginAt: Date;

    @Prop({ default: false })
    isBlocked: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ select: false, default: null }) // مخفي وممكن يكون null
    currentAccessToken?: string; // هنخزن الـ accessToken الحالي

    @Prop({ type: Number, default: 0 })
    tokenVersion: number; // لو عاوز تلغي كل التوكنز دفعة واحدة
}

export const UserSchema = SchemaFactory.createForClass(User);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
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
        return /^[\u0600-\u06FFa-zA-Z0-9\s._-]+$/.test(v);
      },
      message: 'Name must contain only letters, numbers, spaces, dots, underscores, and hyphens',
    },
  })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ unique: true, sparse: true })
  username?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: false })
  password: string;

  @Prop({
    type: String,
    enum: [Roles.Admin, Roles.User, Roles.Seller],
    default: Roles.User,
  })
  role: Roles;

  @Prop({ required: false })
  bio: string;

  @Prop({ required: false, select: false })
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

  @Prop({
    type: [{
      name: String,
      percent: Number
    }],
    default: []
  })
  expertise?: { name: string; percent: number }[];

  @Prop({
    type: {
      facebook: String,
      instagram: String
    },
    default: { facebook: '', instagram: '' }
  })
  socialLinks?: { facebook: string; instagram: string };

  // --- Social Connections ---
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friends: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  blockedUsers: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  followersCount: number;

  @Prop({ type: Number, default: 0 })
  followingCount: number;

  @Prop({ type: Number, default: 0 })
  friendsCount: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

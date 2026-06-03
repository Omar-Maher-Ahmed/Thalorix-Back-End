import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'audit_logs',
})
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  adminId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String })
  entityType?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  targetId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ targetId: 1 });
AuditLogSchema.index({ action: 1 });

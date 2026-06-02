import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schema/audit-log.schema';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async logAction(
    adminId: string | null,
    targetId: string | null,
    action: string,
    entityType: string,
    metadata?: Record<string, any>,
    actorId?: string | null,
  ): Promise<AuditLog> {
    console.log(`[AUDIT LOG] Admin: ${adminId} | Actor: ${actorId} | Action: ${action} | Target: ${targetId}`);
    return await this.auditLogModel.create({
      ...(adminId ? { adminId } : {}),
      ...(actorId ? { actorId } : {}),
      ...(targetId ? { targetId } : {}),
      action,
      entityType,
      metadata: metadata || {},
    });
  }

  async findAllLogs() {
    return await this.auditLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }
}

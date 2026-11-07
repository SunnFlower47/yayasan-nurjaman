/**
 * src/modules/audit/services/audit.service.ts
 * Layanan penulisan dan pembacaan jejak audit append-only terpusat.
 */

import { auditLogRepository } from "../repositories/audit-log.repository";
import type {
  AuditLogInput,
  AuditLogQueryOptions,
  AuditLogRecord,
  PaginatedAuditLogs,
} from "../types";

export class AuditService {
  async writeAudit(data: AuditLogInput): Promise<AuditLogRecord> {
    const record = await auditLogRepository.create({
      actorUserId: data.actorUserId,
      action: data.action.trim(),
      entityType: data.entityType.trim(),
      entityId: data.entityId,
      before: data.before,
      after: data.after,
    });

    return {
      id: record.id,
      actorUserId: record.actorUserId,
      actor: record.actor,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId ?? "",
      before: record.before,
      after: record.after,
      createdAt: record.occurredAt,
    };
  }

  async getAuditLogs(options: AuditLogQueryOptions = {}): Promise<PaginatedAuditLogs> {
    const { items, total, page, pageSize } = await auditLogRepository.findMany(options);

    const data: AuditLogRecord[] = items.map((item) => ({
      id: item.id,
      actorUserId: item.actorUserId,
      actor: item.actor,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId ?? "",
      before: item.before,
      after: item.after,
      createdAt: item.occurredAt,
    }));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}

export const auditService = new AuditService();

/**
 * Helper langsung untuk mempermudah penulisan audit log di seluruh modul.
 */
export async function writeAudit(data: AuditLogInput): Promise<AuditLogRecord> {
  return auditService.writeAudit(data);
}

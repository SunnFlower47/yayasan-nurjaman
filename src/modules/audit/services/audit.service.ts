/**
 * src/modules/audit/services/audit.service.ts
 * Layanan penulisan dan pembacaan jejak audit append-only terpusat.
 */

import { auditLogRepository } from "../repositories/audit-log.repository";
import { redactSensitiveData } from "../helpers/redact";
import type {
  AuditLogInput,
  AuditLogQueryOptions,
  AuditLogRecord,
  PaginatedAuditLogs,
} from "../types";

export class AuditService {
  async writeAudit(data: AuditLogInput): Promise<AuditLogRecord> {
    const redactedBefore = data.before
      ? (redactSensitiveData(data.before) as Record<string, unknown>)
      : null;
    const redactedAfter = data.after
      ? (redactSensitiveData(data.after) as Record<string, unknown>)
      : null;

    const record = await auditLogRepository.create({
      actorUserId: data.actorUserId,
      action: data.action.trim(),
      entityType: data.entityType.trim(),
      entityId: data.entityId,
      before: redactedBefore,
      after: redactedAfter,
      ip: data.ip,
      userAgent: data.userAgent,
      requestId: data.requestId,
      dbClient: data.dbClient,
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
      ip: record.ip,
      userAgent: record.userAgent,
      requestId: record.requestId,
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
      ip: item.ip,
      userAgent: item.userAgent,
      requestId: item.requestId,
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
export const writeAudit = (data: AuditLogInput) => auditService.writeAudit(data);
export const getAuditLogs = (options?: AuditLogQueryOptions) =>
  auditService.getAuditLogs(options);

/**
 * src/modules/audit/repositories/audit-log.repository.ts
 * Akses basis data untuk jejak audit append-only (audit_logs).
 */

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { AuditLogInput, AuditLogQueryOptions } from "../types";

function buildWhereClause(options: AuditLogQueryOptions): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (options.actorUserId) where.actorUserId = options.actorUserId;
  if (options.action) where.action = options.action;
  if (options.entityType) where.entityType = options.entityType;
  if (options.entityId) where.entityId = options.entityId;

  if (options.startDate || options.endDate) {
    where.occurredAt = {
      ...(options.startDate ? { gte: options.startDate } : {}),
      ...(options.endDate ? { lte: options.endDate } : {}),
    };
  }
  return where;
}

export class AuditLogRepository {
  async create(data: AuditLogInput) {
    return db.auditLog.create({
      data: {
        actorUserId: data.actorUserId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        before: (data.before as Prisma.InputJsonValue) ?? undefined,
        after: (data.after as Prisma.InputJsonValue) ?? undefined,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });
  }

  async findMany(options: AuditLogQueryOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where = buildWhereClause(options);

    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: pageSize,
        include: {
          actor: {
            select: { id: true, username: true, name: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}

export const auditLogRepository = new AuditLogRepository();

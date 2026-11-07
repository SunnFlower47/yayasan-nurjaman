/**
 * src/modules/audit/types.ts
 * Definisi tipe data untuk jejak audit append-only yayasan.
 */

import type { PrismaClient } from "@prisma/client";

export type DbTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface AuditLogInput {
  actorUserId?: string | null | undefined;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null | undefined;
  after?: Record<string, unknown> | null | undefined;
  ip?: string | null | undefined;
  userAgent?: string | null | undefined;
  requestId?: string | null | undefined;
  dbClient?: DbTransactionClient | undefined;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  actor?: { id: string; username: string; name: string } | null | undefined;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip?: string | null | undefined;
  userAgent?: string | null | undefined;
  requestId?: string | null | undefined;
  createdAt: Date;
}

export interface AuditLogQueryOptions {
  page?: number | undefined;
  pageSize?: number | undefined;
  actorUserId?: string | undefined;
  action?: string | undefined;
  entityType?: string | undefined;
  entityId?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

export interface PaginatedAuditLogs {
  data: AuditLogRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * src/modules/audit/index.ts
 * Public API modul Jejak Audit Terpusat.
 * Titik masuk tunggal untuk impor lintas-modul.
 */

export type {
  AuditLogInput,
  AuditLogRecord,
  AuditLogQueryOptions,
  PaginatedAuditLogs,
} from "./types";

export { auditService, AuditService, writeAudit } from "./services/audit.service";

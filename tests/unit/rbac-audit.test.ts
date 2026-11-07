import { describe, it, expect, vi } from "vitest";
import { rbacService } from "@/modules/auth";
import { auditService } from "@/modules/audit";
import { rbacRepository } from "@/modules/auth/repositories/rbac.repository";
import { auditLogRepository } from "@/modules/audit/repositories/audit-log.repository";

describe("Unit Tests: Layanan Otorisasi RBAC dan Audit Log", () => {
  describe("Evaluasi Peran dan Izin (RbacService)", () => {
    it("Super Admin memiliki akses mutlak ke seluruh izin sistem", async () => {
      vi.spyOn(rbacRepository, "getUserRoles").mockResolvedValueOnce([
        { id: "r1", code: "SUPER_ADMIN", name: "Super Admin", isSystem: true },
      ]);

      const allowed = await rbacService.hasPermission("user-1", "any.permission");
      expect(allowed).toBe(true);
    });

    it("pengguna dengan izin eksplisit disetujui", async () => {
      vi.spyOn(rbacRepository, "getUserRoles").mockResolvedValueOnce([
        { id: "r2", code: "BENDAHARA", name: "Bendahara", isSystem: true },
      ]);
      vi.spyOn(rbacRepository, "getUserPermissionCodes").mockResolvedValueOnce([
        "audit.view",
        "finance.view",
      ]);

      const allowed = await rbacService.hasPermission("user-2", "audit.view");
      expect(allowed).toBe(true);
    });

    it("pengguna tanpa izin ditolak", async () => {
      vi.spyOn(rbacRepository, "getUserRoles").mockResolvedValueOnce([
        { id: "r3", code: "EDITOR_KONTEN", name: "Editor Konten", isSystem: true },
      ]);
      vi.spyOn(rbacRepository, "getUserPermissionCodes").mockResolvedValueOnce([
        "settings.view",
      ]);

      const allowed = await rbacService.hasPermission("user-3", "audit.view");
      expect(allowed).toBe(false);
    });
  });

  describe("Jejak Audit (AuditService)", () => {
    it("menulis log audit dengan normalisasi data yang tepat", async () => {
      const mockCreated = {
        id: "log-123",
        occurredAt: new Date("2026-11-07T12:00:00Z"),
        actorUserId: "user-1",
        action: "auth.login",
        entityType: "user",
        entityId: "user-1",
        before: null,
        after: { status: "ACTIVE" },
        ip: null,
        userAgent: null,
        requestId: null,
        metadata: null,
        actor: { id: "user-1", username: "admin", name: "Super Admin" },
      };

      vi.spyOn(auditLogRepository, "create").mockResolvedValueOnce(mockCreated);

      const result = await auditService.writeAudit({
        actorUserId: "user-1",
        action: "  auth.login  ",
        entityType: " user ",
        entityId: "user-1",
        after: { status: "ACTIVE" },
      });

      expect(result.id).toBe("log-123");
      expect(result.action).toBe("auth.login");
      expect(result.entityType).toBe("user");
      expect(result.actor?.username).toBe("admin");
    });
  });
});

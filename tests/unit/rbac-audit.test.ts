import { describe, it, expect, vi } from "vitest";
import { rbacService, can } from "@/modules/auth";
import { auditService, redactSensitiveData } from "@/modules/audit";
import { rbacRepository } from "@/modules/auth/repositories/rbac.repository";
import { auditLogRepository } from "@/modules/audit/repositories/audit-log.repository";

describe("Unit Tests: Layanan Otorisasi RBAC dan Jejak Audit", () => {
  describe("Evaluasi Peran dan Izin (RbacService & can helper)", () => {
    it("Super Admin dievaluasi dari basis data izin resmi tanpa bypass kode hardcoded", async () => {
      // Jika Super Admin memiliki relasi di DB
      vi.spyOn(rbacRepository, "getUserPermissionCodes").mockResolvedValueOnce([
        "users.view",
        "roles.view",
        "audit.view",
      ]);

      const allowed = await rbacService.hasPermission("user-super", "audit.view");
      expect(allowed).toBe(true);

      // Jika Super Admin diuji dengan izin yang tidak ada di daftar izin DB
      vi.spyOn(rbacRepository, "getUserPermissionCodes").mockResolvedValueOnce([
        "users.view",
        "roles.view",
      ]);
      const notAllowed = await rbacService.hasPermission("user-super", "secret.action");
      expect(notAllowed).toBe(false);
    });

    it("pengguna dengan izin eksplisit disetujui", async () => {
      vi.spyOn(rbacRepository, "getUserPermissionCodes").mockResolvedValueOnce([
        "audit.view",
        "settings.view",
      ]);

      const allowed = await rbacService.hasPermission("user-2", "audit.view");
      expect(allowed).toBe(true);
    });

    it("pengguna tanpa izin ditolak (deny by default)", async () => {
      vi.spyOn(rbacRepository, "getUserPermissionCodes").mockResolvedValueOnce([
        "settings.view",
      ]);

      const allowed = await rbacService.hasPermission("user-3", "audit.view");
      expect(allowed).toBe(false);
    });

    it("helper can() menyaring izin UI dengan tepat", () => {
      const userPermissions = ["audit.view", "settings.view"];
      expect(can(userPermissions, "audit.view")).toBe(true);
      expect(can(userPermissions, "users.manage")).toBe(false);
      expect(can({ permissions: userPermissions }, "settings.view")).toBe(true);
      expect(can(null, "audit.view")).toBe(false);
    });
  });

  describe("Redaksi Data Sensitif Jejak Audit (redactSensitiveData)", () => {
    it("menghapus dan menyamarkan kata sandi, token, rahasia, NIK, dan nomor rekening", () => {
      const rawPayload = {
        username: "admin",
        password_hash: "$argon2id$v=19$m=65536,t=3,p=4$somehash",
        token: "session_token_xyz",
        secret: "totp_secret_key",
        nik: "3201010101010001",
        nomor_rekening: "1234567890",
        nested: {
          password: "myPlainPassword123",
          credit_card: "4111222233334444",
          safeData: "Nilai Aman",
        },
        list: [
          { tokenHash: "abc123456", valid: true },
          { secretKey: "topsecret", note: "Aman" },
        ],
      };

      const redacted = redactSensitiveData(rawPayload) as Record<string, unknown>;

      expect(redacted["username"]).toBe("admin");
      expect(redacted["password_hash"]).toBe("[REDACTED]");
      expect(redacted["token"]).toBe("[REDACTED]");
      expect(redacted["secret"]).toBe("[REDACTED]");
      expect(redacted["nik"]).toBe("[REDACTED]");
      expect(redacted["nomor_rekening"]).toBe("[REDACTED]");

      const nested = redacted["nested"] as Record<string, unknown>;
      expect(nested["password"]).toBe("[REDACTED]");
      expect(nested["credit_card"]).toBe("[REDACTED]");
      expect(nested["safeData"]).toBe("Nilai Aman");

      const list = redacted["list"] as Array<Record<string, unknown>>;
      expect(list[0]?.["tokenHash"]).toBe("[REDACTED]");
      expect(list[0]?.["valid"]).toBe(true);
      expect(list[1]?.["secretKey"]).toBe("[REDACTED]");
      expect(list[1]?.["note"]).toBe("Aman");
    });

    it("writeAudit otomatis meredaksi before dan after sebelum disimpan ke basis data", async () => {
      const createSpy = vi.spyOn(auditLogRepository, "create").mockResolvedValueOnce({
        id: "log-redacted",
        occurredAt: new Date("2026-11-07T12:00:00Z"),
        actorUserId: "user-1",
        actor: null,
        action: "auth.change_password",
        entityType: "user",
        entityId: "user-1",
        before: null,
        after: { password_hash: "[REDACTED]" },
        ip: "127.0.0.1",
        userAgent: "vitest",
        requestId: "req-1",
        metadata: null,
      });

      await auditService.writeAudit({
        actorUserId: "user-1",
        action: "auth.change_password",
        entityType: "user",
        entityId: "user-1",
        before: { password_hash: "old_secret_hash" },
        after: { password_hash: "new_secret_hash" },
        ip: "127.0.0.1",
        requestId: "req-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          before: { password_hash: "[REDACTED]" },
          after: { password_hash: "[REDACTED]" },
          ip: "127.0.0.1",
          requestId: "req-1",
        })
      );
    });
  });
});

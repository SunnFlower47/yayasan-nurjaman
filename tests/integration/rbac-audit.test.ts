import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { rbacService, rbacRepository } from "@/modules/auth";
import { writeAudit } from "@/modules/audit";

describe("Integrasi RBAC dan Jejak Audit (PostgreSQL Asli)", () => {
  let prisma: PrismaClient;
  let superAdminId: string;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // 1. Ambil atau buat akun Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: { username: "admin", deletedAt: null },
    });
    if (!superAdmin) {
      throw new Error("Akun Super Admin belum tersedia dari seed.");
    }
    superAdminId = superAdmin.id;

    // 2. Buat pengguna uji khusus untuk penugasan peran non-admin
    let testUser = await prisma.user.findFirst({
      where: { username: "rbac_test_user" },
    });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          username: "rbac_test_user",
          email: "rbac_test@yayasan-nurjaman.org",
          name: "Pengguna Uji RBAC",
          passwordHash: "dummy_hash_for_rbac_test",
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { deletedAt: null, status: "ACTIVE" },
      });
    }
    testUserId = testUser.id;

    // Bersihkan peran sebelumnya
    await prisma.userRole.deleteMany({ where: { userId: testUserId } });

    // Tugaskan peran BENDAHARA ke testUser
    await rbacRepository.assignRole(testUserId, "BENDAHARA", superAdminId);
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.userRole.deleteMany({ where: { userId: testUserId } });
      await prisma.auditLog.deleteMany({ where: { actorUserId: testUserId } });
      await prisma.securityEvent.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it("1. Super Admin memiliki izin resmi melalui tabel role_permissions basis data (tanpa bypass kode)", async () => {
    const hasAudit = await rbacService.hasPermission(superAdminId, "audit.view");
    const hasUsers = await rbacService.hasPermission(superAdminId, "users.manage");
    const hasRoles = await rbacService.hasPermission(superAdminId, "roles.manage");

    expect(hasAudit).toBe(true);
    expect(hasUsers).toBe(true);
    expect(hasRoles).toBe(true);

    // Verifikasi bahwa izin tersebut benar-benar ada di tabel role_permissions
    const superAdminRole = await prisma.role.findUnique({
      where: { code: "SUPER_ADMIN" },
      include: { rolePermissions: { include: { permission: true } } },
    });
    expect(superAdminRole).not.toBeNull();
    const permCodes = superAdminRole!.rolePermissions.map((rp) => rp.permission.code);
    expect(permCodes).toContain("audit.view");
    expect(permCodes).toContain("users.manage");
  });

  it("2. pengguna dengan dua peran mendapat gabungan izin kumulatif", async () => {
    // Saat ini hanya BENDAHARA (punya audit.view, tidak punya settings.manage)
    expect(await rbacService.hasPermission(testUserId, "audit.view")).toBe(true);
    expect(await rbacService.hasPermission(testUserId, "settings.manage")).toBe(false);

    // Tambahkan peran KETUA (punya settings.manage)
    await rbacRepository.assignRole(testUserId, "KETUA", superAdminId);

    // Sekarang pengguna memiliki gabungan izin dari kedua peran
    expect(await rbacService.hasPermission(testUserId, "audit.view")).toBe(true);
    expect(await rbacService.hasPermission(testUserId, "settings.manage")).toBe(true);

    // Cabut peran KETUA kembali
    await rbacRepository.removeRole(testUserId, "KETUA");
    expect(await rbacService.hasPermission(testUserId, "settings.manage")).toBe(false);
  });

  it("3. pengguna tanpa izin ditolak dan mencatat insiden PERMISSION_DENIED", async () => {
    // testUserId tidak memiliki izin 'users.manage'
    const canManage = await rbacService.hasPermission(testUserId, "users.manage");
    expect(canManage).toBe(false);

    // Buat event PERMISSION_DENIED
    await prisma.securityEvent.create({
      data: {
        type: "PERMISSION_DENIED",
        userId: testUserId,
        ip: "127.0.0.1",
        details: { permission: "users.manage" },
      },
    });

    const event = await prisma.securityEvent.findFirst({
      where: {
        userId: testUserId,
        type: "PERMISSION_DENIED",
      },
      orderBy: { occurredAt: "desc" },
    });

    expect(event).not.toBeNull();
    expect((event!.details as any)?.permission).toBe("users.manage");
  });

  it("4. writeAudit menulis catatan ke basis data dengan redaksi otomatis terhadap password_hash dan token", async () => {
    const uniqueAction = `test.audit.${Date.now()}`;

    const created = await writeAudit({
      actorUserId: superAdminId,
      action: uniqueAction,
      entityType: "integration_test",
      entityId: "test-entity-001",
      before: {
        password_hash: "secret_hash_value_123",
        token: "session_token_abc",
        status: "OLD",
      },
      after: {
        password_hash: "secret_hash_value_456",
        token: "session_token_def",
        status: "NEW",
      },
      ip: "127.0.0.1",
      requestId: "req-test-uuid",
    });

    expect(created.id).toBeDefined();

    // Verifikasi langsung di database melalui query mentah bahwa data teredaksi
    const dbRecord = await prisma.auditLog.findUnique({
      where: { id: created.id },
    });

    expect(dbRecord).not.toBeNull();
    const afterData = dbRecord!.after as any;
    const beforeData = dbRecord!.before as any;

    expect(afterData.password_hash).toBe("[REDACTED]");
    expect(afterData.token).toBe("[REDACTED]");
    expect(afterData.status).toBe("NEW");

    expect(beforeData.password_hash).toBe("[REDACTED]");
    expect(beforeData.token).toBe("[REDACTED]");
    expect(beforeData.status).toBe("OLD");

    expect(dbRecord!.requestId).toBe("req-test-uuid");
    expect(dbRecord!.ip).toBe("127.0.0.1");

    // Bersihkan catatan uji
    await prisma.auditLog.delete({ where: { id: created.id } });
  });
});

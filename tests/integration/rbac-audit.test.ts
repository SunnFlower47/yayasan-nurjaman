import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { rbacService, rbacRepository } from "@/modules/auth";
import { auditService, writeAudit } from "@/modules/audit";

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
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it("1. Super Admin memiliki izin ke seluruh modul (Bypass Hak Akses)", async () => {
    const hasAudit = await rbacService.hasPermission(superAdminId, "audit.view");
    const hasUsers = await rbacService.hasPermission(superAdminId, "users.manage");
    const hasRoles = await rbacService.hasPermission(superAdminId, "roles.manage");

    expect(hasAudit).toBe(true);
    expect(hasUsers).toBe(true);
    expect(hasRoles).toBe(true);
  });

  it("2. pengguna dengan peran spesifik hanya memiliki izin sesuai hak perannya", async () => {
    // Peran BENDAHARA memiliki izin audit.view
    const canViewAudit = await rbacService.hasPermission(testUserId, "audit.view");
    expect(canViewAudit).toBe(true);

    // Peran BENDAHARA TIDAK memiliki izin users.manage (hanya Sekretaris / Super Admin)
    const canManageUsers = await rbacService.hasPermission(testUserId, "users.manage");
    expect(canManageUsers).toBe(false);
  });

  it("3. penugasan dan pencabutan peran memperbarui hak izin secara dinamis", async () => {
    // Tugaskan peran SEKRETARIS (yang memiliki users.manage)
    await rbacRepository.assignRole(testUserId, "SEKRETARIS", superAdminId);
    const canManageAfterAssign = await rbacService.hasPermission(
      testUserId,
      "users.manage"
    );
    expect(canManageAfterAssign).toBe(true);

    // Cabut peran SEKRETARIS
    await rbacRepository.removeRole(testUserId, "SEKRETARIS");
    const canManageAfterRemove = await rbacService.hasPermission(
      testUserId,
      "users.manage"
    );
    expect(canManageAfterRemove).toBe(false);
  });

  it("4. writeAudit menulis catatan ke basis data dan dapat dibaca melalui getAuditLogs", async () => {
    const uniqueAction = `test.audit.${Date.now()}`;

    const created = await writeAudit({
      actorUserId: superAdminId,
      action: uniqueAction,
      entityType: "integration_test",
      entityId: "test-entity-001",
      before: { active: false },
      after: { active: true },
    });

    expect(created.id).toBeDefined();
    expect(created.action).toBe(uniqueAction);

    // Baca kembali melalui auditService
    const logs = await auditService.getAuditLogs({
      action: uniqueAction,
      pageSize: 5,
    });

    expect(logs.data.length).toBeGreaterThanOrEqual(1);
    expect(logs.data[0]?.action).toBe(uniqueAction);
    expect(logs.data[0]?.actorUserId).toBe(superAdminId);
    expect(logs.data[0]?.actor?.username).toBe("admin");
  });
});

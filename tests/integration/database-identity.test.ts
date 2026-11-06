import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

// Helper koneksi
function getClientForRole(username: string, password: string): PrismaClient {
  const baseUrl =
    process.env["DATABASE_URL"] || "postgresql://localhost:5432/yayasan_db?schema=public";
  const url = baseUrl.replace(/\/\/[^:]+:[^@]+@/, `//${username}:${password}@`);
  return new PrismaClient({ datasources: { db: { url } } });
}

describe("Integrasi Basis Data: Modul Identitas dan Akses", () => {
  let appClient: PrismaClient;
  let migratorClient: PrismaClient;

  beforeAll(async () => {
    const dbAppUser = process.env["DB_APP_USER"] || "db_app";
    const dbAppPass = process.env["DB_APP_PASSWORD"] || "app_secure_pass_456!";
    const dbMigratorUser = process.env["DB_MIGRATOR_USER"] || "db_migrator";
    const dbMigratorPass =
      process.env["DB_MIGRATOR_PASSWORD"] || "migrator_secure_pass_123!";

    appClient = getClientForRole(dbAppUser, dbAppPass);
    migratorClient = getClientForRole(dbMigratorUser, dbMigratorPass);

    // Bersihkan data uji sebelumnya
    await migratorClient.user.deleteMany({
      where: { username: { contains: "sekretaris_" } },
    });
  });

  afterAll(async () => {
    await migratorClient.user.deleteMany({
      where: { username: { contains: "sekretaris_" } },
    });
    await appClient.$disconnect();
    await migratorClient.$disconnect();
  });

  // (a) db_app gagal UPDATE, DELETE, dan TRUNCATE pada audit_logs tetapi berhasil INSERT
  it("(a) role db_app berhasil INSERT ke audit_logs tetapi gagal UPDATE, DELETE, dan TRUNCATE", async () => {
    // 1. INSERT berhasil dilakukan oleh db_app
    const createdLog = await appClient.auditLog.create({
      data: {
        action: "test.audit.insert",
        entityType: "test_verification",
        entityId: "id_test_001",
        before: { status: "initial" },
        after: { status: "verified" },
      },
    });
    expect(createdLog.id).toBeDefined();
    expect(createdLog.action).toBe("test.audit.insert");

    // 2. UPDATE ditolak mutlak oleh database
    await expect(
      appClient.$executeRawUnsafe(
        `UPDATE audit_logs SET action = 'tampered' WHERE id = '${createdLog.id}'::uuid;`
      )
    ).rejects.toThrow(/permission denied/i);

    // 3. DELETE ditolak mutlak oleh database
    await expect(
      appClient.$executeRawUnsafe(
        `DELETE FROM audit_logs WHERE id = '${createdLog.id}'::uuid;`
      )
    ).rejects.toThrow(/permission denied/i);

    // 4. TRUNCATE ditolak mutlak oleh database
    await expect(
      appClient.$executeRawUnsafe(`TRUNCATE TABLE audit_logs;`)
    ).rejects.toThrow(/permission denied/i);

    // 5. Verifikasi hal serupa berlaku pada security_events
    const secEvent = await appClient.securityEvent.create({
      data: {
        type: "LOGIN_SUCCESS",
        details: { note: "test security event" },
      },
    });
    expect(secEvent.id).toBeDefined();

    await expect(
      appClient.$executeRawUnsafe(
        `DELETE FROM security_events WHERE id = '${secEvent.id}'::uuid;`
      )
    ).rejects.toThrow(/permission denied/i);
  });

  // (b) username 'Admin' dan 'admin' tidak bisa keduanya ada
  it("(b) username 'Admin' dan 'admin' tidak dapat keduanya ada di database (case-insensitive uniqueness & format)", async () => {
    // Akun 'admin' sudah ada dari proses seed
    const existingAdmin = await migratorClient.user.findFirst({
      where: { username: "admin", deletedAt: null },
    });
    expect(existingAdmin).not.toBeNull();

    // Mencoba memasukkan 'Admin' (huruf besar) harus ditolak oleh CHECK constraint lowercase atau partial unique index
    await expect(
      migratorClient.user.create({
        data: {
          username: "Admin",
          email: "admin_capital@yayasan-nurjaman.org",
          name: "Admin Kapital",
          passwordHash: "dummy_hash",
        },
      })
    ).rejects.toThrow(/(lowercase|unique|violates)/i);

    // Menguji pasangan lain: buat 'sekretaris_<suffix>' lalu coba masukkan 'Sekretaris_<suffix>'
    const suffix = Date.now().toString().slice(-4);
    const userLower = `sekretaris_${suffix}`;
    const userUpper = `Sekretaris_${suffix}`;

    await migratorClient.user.create({
      data: {
        username: userLower,
        email: `sekretaris_${suffix}@yayasan.org`,
        name: "Sekretaris Uji",
        passwordHash: "dummy_hash",
      },
    });

    await expect(
      migratorClient.user.create({
        data: {
          username: userUpper,
          email: `sekretaris2_${suffix}@yayasan.org`,
          name: "Sekretaris Uji 2",
          passwordHash: "dummy_hash",
        },
      })
    ).rejects.toThrow(/(lowercase|unique|violates)/i);
  });

  // (c) role sistem tidak bisa dihapus (constraint atau trigger sesuai desain)
  it("(c) role sistem bawaan (is_system = true) tidak dapat dihapus", async () => {
    // 1. Role SUPER_ADMIN adalah role sistem bawaan
    await expect(
      migratorClient.role.delete({
        where: { code: "SUPER_ADMIN" },
      })
    ).rejects.toThrow(/Role sistem bawaan \(SUPER_ADMIN\) tidak dapat dihapus/i);

    // 2. Role BENDAHARA adalah role sistem bawaan
    await expect(
      migratorClient.role.delete({
        where: { code: "BENDAHARA" },
      })
    ).rejects.toThrow(/Role sistem bawaan \(BENDAHARA\) tidak dapat dihapus/i);

    // 3. Role non-sistem dapat dibuat dan dihapus secara sah
    const customRole = await migratorClient.role.create({
      data: {
        code: "STAFF_MAGANG",
        name: "Staf Magang",
        description: "Peran non-sistem sementara",
        isSystem: false,
      },
    });

    const deleted = await migratorClient.role.delete({
      where: { id: customRole.id },
    });
    expect(deleted.id).toBe(customRole.id);
  });

  // (d) seed dijalankan dua kali tidak menggandakan data
  it("(d) eksekusi seed berulang bersifat idempoten dan tidak menggandakan data", async () => {
    const rolesBefore = await migratorClient.role.count();
    const permissionsBefore = await migratorClient.permission.count();
    const rolePermissionsBefore = await migratorClient.rolePermission.count();
    const superAdminBefore = await migratorClient.user.count({
      where: { username: "admin", deletedAt: null },
    });

    // Jalankan ulang seed via tsx
    execSync("pnpm.cmd db:seed", { stdio: "pipe", env: process.env });

    const rolesAfter = await migratorClient.role.count();
    const permissionsAfter = await migratorClient.permission.count();
    const rolePermissionsAfter = await migratorClient.rolePermission.count();
    const superAdminAfter = await migratorClient.user.count({
      where: { username: "admin", deletedAt: null },
    });

    expect(rolesAfter).toBe(rolesBefore);
    expect(permissionsAfter).toBe(permissionsBefore);
    expect(rolePermissionsAfter).toBe(rolePermissionsBefore);
    expect(superAdminAfter).toBe(superAdminBefore);
    expect(superAdminAfter).toBe(1);
  });
});

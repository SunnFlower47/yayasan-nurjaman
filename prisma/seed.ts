import { PrismaClient } from "@prisma/client";
import * as argon2 from "@node-rs/argon2";
import { SYSTEM_PERMISSIONS } from "../src/modules/auth/permissions";

// Pastikan seed terhubung menggunakan kredensial db_migrator
function getMigratorDatabaseUrl(): string {
  const envUrl = process.env["DATABASE_URL"] || "";
  const migratorUser = process.env["DB_MIGRATOR_USER"] || "db_migrator";
  const migratorPass = process.env["DB_MIGRATOR_PASSWORD"] || "migrator_secure_pass_123!";

  if (envUrl.includes("@")) {
    return envUrl.replace(/\/\/[^:]+:[^@]+@/, `//${migratorUser}:${migratorPass}@`);
  }
  return envUrl;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getMigratorDatabaseUrl(),
    },
  },
});

interface SystemRoleDef {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description:
      "Akses penuh tak terbatas ke seluruh modul sistem (Pemilik / Administrator Utama)",
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
  },
  {
    code: "PEMBINA",
    name: "Pembina",
    description: "Dewan Pembina Yayasan (perlu ditinjau pemilik)",
    permissions: ["users.view", "roles.view", "settings.view", "audit.view"],
  },
  {
    code: "KETUA",
    name: "Ketua",
    description: "Ketua Pengurus Yayasan (perlu ditinjau pemilik)",
    permissions: [
      "users.view",
      "roles.view",
      "settings.view",
      "settings.manage",
      "audit.view",
    ],
  },
  {
    code: "SEKRETARIS",
    name: "Sekretaris",
    description: "Sekretaris Yayasan (perlu ditinjau pemilik)",
    permissions: [
      "users.view",
      "users.manage",
      "roles.view",
      "settings.view",
      "audit.view",
    ],
  },
  {
    code: "BENDAHARA",
    name: "Bendahara",
    description: "Bendahara Keuangan Yayasan (perlu ditinjau pemilik)",
    permissions: ["users.view", "roles.view", "settings.view", "audit.view"],
  },
  {
    code: "PENGAWAS",
    name: "Pengawas",
    description: "Dewan Pengawas Yayasan (perlu ditinjau pemilik)",
    permissions: ["users.view", "roles.view", "settings.view", "audit.view"],
  },
  {
    code: "EDITOR_KONTEN",
    name: "Editor Konten",
    description: "Pengelola konten publikasi dan warta yayasan (perlu ditinjau pemilik)",
    permissions: ["settings.view"],
  },
];

async function main() {
  console.log("=== [MEMULAI SEED DATABASE IDENTITAS & AKSES] ===");

  // 1. Sinkronisasi Katalog Izin Resmi dari Kode
  console.log(
    `-> Menyinkronkan ${SYSTEM_PERMISSIONS.length} izin resmi dari katalog kode...`
  );
  const permissionMap = new Map<string, string>();

  for (const perm of SYSTEM_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        module: perm.module,
        action: perm.action,
        description: perm.description,
      },
      create: {
        code: perm.code,
        module: perm.module,
        action: perm.action,
        description: perm.description,
      },
    });
    permissionMap.set(record.code, record.id);
  }

  // 2. Sinkronisasi 7 Peran Sistem Bawaan
  console.log(`-> Menyinkronkan ${SYSTEM_ROLES.length} peran sistem bawaan...`);
  const roleMap = new Map<string, string>();

  for (const r of SYSTEM_ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
        isSystem: true,
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: true,
      },
    });
    roleMap.set(roleRecord.code, roleRecord.id);

    // Sinkronisasi Izin untuk Peran
    for (const permCode of r.permissions) {
      const permId = permissionMap.get(permCode);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  // 3. Akun Super Admin Awal dari Variabel Lingkungan
  const adminUsername = (process.env["INITIAL_ADMIN_USERNAME"] || "admin")
    .toLowerCase()
    .trim();
  const adminEmail = (process.env["INITIAL_ADMIN_EMAIL"] || "admin@yayasan-nurjaman.org")
    .toLowerCase()
    .trim();
  const adminPassword =
    process.env["INITIAL_ADMIN_PASSWORD"] || "Admin123!Secure@Yayasan";

  console.log(
    `-> Menginisialisasi akun Super Admin: username='${adminUsername}', email='${adminEmail}'`
  );

  const passwordHash = await argon2.hash(adminPassword, {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
    algorithm: 2, // Argon2id (default)
  });

  // Cari apakah user sudah ada
  let superAdminUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
      deletedAt: null,
    },
  });

  if (!superAdminUser) {
    superAdminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        name: "Super Administrator",
        passwordHash,
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });
    console.log(
      "   [BARU] Akun Super Admin berhasil dibuat (must_change_password = true)."
    );
  } else {
    console.log("   [LEWATI] Akun Super Admin sudah terdaftar.");
  }

  // Menugaskan Peran SUPER_ADMIN ke Akun Super Admin
  const superAdminRoleId = roleMap.get("SUPER_ADMIN");
  if (superAdminRoleId && superAdminUser) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdminUser.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        userId: superAdminUser.id,
        roleId: superAdminRoleId,
        assignedBy: superAdminUser.id, // Penugasan awal sistem oleh diri sendiri
      },
    });
    console.log("   [TERKAIT] Peran SUPER_ADMIN terhubung ke pengguna awal.");
  }

  console.log("=== [SEED BERHASIL SELESAI SECARA IDEMPOTEN] ===");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat menjalankan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

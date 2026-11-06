import { PrismaClient } from "@prisma/client";
import * as argon2 from "@node-rs/argon2";
import { SYSTEM_PERMISSIONS } from "../src/modules/auth/permissions";
import { validatePasswordPolicy } from "../src/modules/auth";

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
  datasources: { db: { url: getMigratorDatabaseUrl() } },
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
    description: "Akses penuh tak terbatas ke seluruh modul sistem (Pemilik)",
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

async function syncPermissions(): Promise<Map<string, string>> {
  console.log(`-> Menyinkronkan ${SYSTEM_PERMISSIONS.length} izin resmi...`);
  const permissionMap = new Map<string, string>();
  for (const perm of SYSTEM_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, action: perm.action, description: perm.description },
      create: {
        code: perm.code,
        module: perm.module,
        action: perm.action,
        description: perm.description,
      },
    });
    permissionMap.set(record.code, record.id);
  }
  return permissionMap;
}

async function syncRoles(
  permissionMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log(`-> Menyinkronkan ${SYSTEM_ROLES.length} peran sistem bawaan...`);
  const roleMap = new Map<string, string>();
  for (const r of SYSTEM_ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isSystem: true },
      create: { code: r.code, name: r.name, description: r.description, isSystem: true },
    });
    roleMap.set(roleRecord.code, roleRecord.id);

    for (const permCode of r.permissions) {
      const permId = permissionMap.get(permCode);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleRecord.id, permissionId: permId } },
          update: {},
          create: { roleId: roleRecord.id, permissionId: permId },
        });
      }
    }
  }
  return roleMap;
}

function getValidatedAdminCredentials(): {
  username: string;
  email: string;
  password: string;
} {
  const username = process.env["INITIAL_ADMIN_USERNAME"]?.toLowerCase().trim();
  const email = process.env["INITIAL_ADMIN_EMAIL"]?.toLowerCase().trim();
  const password = process.env["INITIAL_ADMIN_PASSWORD"];

  if (!username || !email || !password) {
    console.error(
      "❌ Inisialisasi admin gagal: Variabel lingkungan INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL, dan INITIAL_ADMIN_PASSWORD wajib diisi saat akun admin belum terdaftar."
    );
    process.exit(1);
  }

  const policy = validatePasswordPolicy(password, { username, email });
  if (!policy.valid) {
    console.error(
      `❌ Inisialisasi admin gagal: Kata sandi INITIAL_ADMIN_PASSWORD tidak memenuhi kebijakan keamanan yayasan: ${policy.error}`
    );
    process.exit(1);
  }

  return { username, email, password };
}

async function createSuperAdmin(
  creds: { username: string; email: string; password: string },
  roleId: string
): Promise<void> {
  console.log(`-> Menginisialisasi akun Super Admin baru: username='${creds.username}'`);
  const passwordHash = await argon2.hash(creds.password, {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
    algorithm: 2,
  });

  const superAdminUser = await prisma.user.create({
    data: {
      username: creds.username,
      email: creds.email,
      name: "Super Administrator",
      passwordHash,
      status: "ACTIVE",
      mustChangePassword: true,
    },
  });

  await prisma.userRole.create({
    data: { userId: superAdminUser.id, roleId, assignedBy: superAdminUser.id },
  });
  console.log(
    "   [BARU] Akun Super Admin berhasil dibuat (must_change_password = true)."
  );
}

async function initSuperAdmin(superAdminRoleId: string): Promise<void> {
  const existingRole = await prisma.userRole.findFirst({
    where: { roleId: superAdminRoleId },
    include: { user: true },
  });

  if (existingRole?.user && existingRole.user.deletedAt === null) {
    console.log(
      `   [LEWATI] Akun Super Admin ('${existingRole.user.username}') sudah terdaftar.`
    );
    return;
  }

  const creds = getValidatedAdminCredentials();
  await createSuperAdmin(creds, superAdminRoleId);
}

async function main() {
  console.log("=== [MEMULAI SEED DATABASE IDENTITAS & AKSES] ===");
  const permissionMap = await syncPermissions();
  const roleMap = await syncRoles(permissionMap);
  const superAdminRoleId = roleMap.get("SUPER_ADMIN");

  if (superAdminRoleId) {
    await initSuperAdmin(superAdminRoleId);
  }
  console.log("=== [SEED BERHASIL SELESAI SECARA IDEMPOTEN] ===");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat menjalankan seed:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

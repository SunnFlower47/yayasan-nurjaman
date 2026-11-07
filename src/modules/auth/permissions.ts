/**
 * Katalog Izin Resmi Sistem (Code-Sourced Permission Catalog)
 * Yayasan Nurjaman Bongas Purwakarta (Fase 1–2)
 *
 * Format kode izin: <modul>.<aksi>
 * Seluruh otorisasi server-side mengevaluasi katalog izin ini.
 */

export interface SystemPermissionDef {
  code: string;
  module: string;
  action: string;
  description: string;
}

export const SYSTEM_PERMISSIONS: readonly SystemPermissionDef[] = [
  // Modul Autentikasi & Sesi
  {
    code: "auth.login",
    module: "auth",
    action: "login",
    description: "Masuk ke panel administrasi internal yayasan",
  },
  {
    code: "auth.step_up",
    module: "auth",
    action: "step_up",
    description: "Melakukan re-autentikasi untuk aksi berisiko tinggi",
  },

  // Modul Manajemen Pengguna (Users)
  {
    code: "users.view",
    module: "users",
    action: "view",
    description: "Melihat daftar dan rincian profil pengguna",
  },
  {
    code: "users.manage",
    module: "users",
    action: "manage",
    description: "Menambah pengguna baru, menonaktifkan akun, dan reset sandi",
  },
  {
    code: "users.assign_role",
    module: "users",
    action: "assign_role",
    description: "Menugaskan atau mencabut peran pada pengguna",
  },

  // Modul Peran & Izin (Roles)
  {
    code: "roles.view",
    module: "roles",
    action: "view",
    description: "Melihat daftar peran dan pemetaan izin sistem",
  },
  {
    code: "roles.manage",
    module: "roles",
    action: "manage",
    description: "Mengubah wewenang dan konfigurasi peran non-sistem",
  },

  // Modul Pengaturan & Profil Kelembagaan (Settings)
  {
    code: "settings.view",
    module: "settings",
    action: "view",
    description: "Melihat profil kelembagaan yayasan dan pengaturan sistem",
  },
  {
    code: "settings.manage",
    module: "settings",
    action: "manage",
    description: "Memperbarui data legalitas, profil, dan konfigurasi yayasan",
  },

  // Modul Jejak Audit & Keamanan (Audit)
  {
    code: "audit.view",
    module: "audit",
    action: "view",
    description: "Melihat riwayat log audit aktivitas dan insiden keamanan",
  },
] as const;

export type SystemPermissionCode = (typeof SYSTEM_PERMISSIONS)[number]["code"];

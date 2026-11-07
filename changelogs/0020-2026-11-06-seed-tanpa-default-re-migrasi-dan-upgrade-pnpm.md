# [ID: 0020] Seed Tanpa Default Re-Migrasi dan Upgrade pnpm

- **Tanggal & Waktu**: 2026-11-06 20:31:17 WIB (Asia/Jakarta)
- **Tipe Perubahan**: security | refactor | chore | config
- **Fase / Modul**: Fase 1b (Identitas & Akses - Login & Manajemen Sesi)
- **Penulis / Agent**: Senior Full-Stack Engineer

---

## 1. Ringkasan Perubahan

Menghapus seluruh nilai bawaan (fallback defaults) untuk `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, dan `INITIAL_ADMIN_PASSWORD` pada `prisma/seed.ts` demi menutup celah bootstrap yang tidak aman. Jika salah satu variabel kosong saat akun admin belum terdaftar, seed langsung menghentikan proses dengan pesan kesalahan tanpa mengekspos rahasia. Kata sandi awal divalidasi ketat terhadap `validatePasswordPolicy` yang sama dengan alur ganti sandi. Berkas template `.env.example` diperbarui dengan dokumentasi lengkap, Playwright E2E diperbarui dengan kredensial sesuai kebijakan, re-migrasi `pnpm db:migrate` dieksekusi, serta global `pnpm` diperbarui ke versi `12.18.0`.

## 2. Latar Belakang & Alasan

1. **Pencegahan Kredensial Bawaan Tertebak**: Menyediakan nilai fallback seperti `admin` atau kata sandi default di kode sumber melanggar prinsip _Defense in Depth_ dan _OWASP ASVS L2_.
2. **Konsistensi Kebijakan Kata Sandi**: Kata sandi awal dari variabel lingkungan harus tunduk pada validasi keamanan yang sama dengan kata sandi baru (minimal 12 karakter, bukan kata sandi umum, tidak memuat username/email).
3. **Dokumentasi Terpusat**: Operator membutuhkan dokumentasi eksplisit di `.env.example` mengenai variabel bootstrap yang wajib disediakan sebelum seeding awal.
4. **Pemeliharaan Alat Bantu (Tooling)**: Peningkatan versi `pnpm` ke `12.18.0` untuk stabilitas manajemen paket dan eksekusi skrip CLI.

## 3. Rincian File yang Berubah

- **Diubah**:
  - `prisma/seed.ts`: Menghapus fallback credentials, menambahkan validasi `validatePasswordPolicy`, memecah fungsi menjadi modular (<= 50 baris per fungsi, total 226 baris).
  - `.env.example`: Menambahkan blok dokumentasi `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, dan `INITIAL_ADMIN_PASSWORD` dengan nilai kosong tanpa rahasia bocor.
  - `tests/e2e/auth.spec.ts`: Memperbarui `initialAdminPassword` agar mematuhi kebijakan kata sandi yayasan (`KunciAman#2026@YayasanNurjamanPurwakarta`).
- **Ditambah**:
  - `changelogs/0020-2026-11-06-seed-tanpa-default-re-migrasi-dan-upgrade-pnpm.md`

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None` (Re-migrasi dijalankan via `pnpm db:migrate` -> "No pending migrations to apply").
- **Dampak Data**: Akun super admin diinisialisasi hanya jika belum terdaftar, dan bersifat idempoten penuh.

## 5. Perubahan Dependensi (Dependencies)

- **Global CLI**: `pnpm` ditingkatkan dari `12.16.1` ke `12.18.0`.

## 6. Dampak & Risiko

- **Dampak**: Operator deployment baru wajib menyetel ketiga variabel lingkungan admin awal di `.env` sebelum menjalankan `pnpm db:seed`.
- **Mitigasi**: Pesan kesalahan CLI sangat jelas dan informatif saat salah satu variabel belum diisi atau kata sandi melanggar kebijakan keamanan.

## 7. Prosedur Verifikasi

1. Uji kegagalan saat variabel kosong: `INITIAL_ADMIN_PASSWORD="" pnpm db:seed` -> Berhenti dengan pesan wajib isi.
2. Uji kegagalan saat sandi pendek: `INITIAL_ADMIN_PASSWORD="Pendek123!" pnpm db:seed` -> Berhenti dengan pesan minimal 12 karakter.
3. Uji kegagalan saat sandi memuat username: `INITIAL_ADMIN_PASSWORD="admin_secret_123" pnpm db:seed` -> Berhenti dengan pesan memuat username.
4. Uji keberhasilan saat kredensial valid: `pnpm db:seed` -> Sukses membuat admin baru dengan `mustChangePassword: true`.
5. Uji idempotensi saat dijalankan ulang: `pnpm db:seed` -> Melewati pembuatan karena akun telah terdaftar.
6. Pemeriksaan mutu: `pnpm check` (lint, typecheck, test 29 lulus, format check, arsitektur check).
7. Uji E2E: `pnpm test:e2e` (7 lulus).
8. Pemindaian rahasia: `pnpm secrets:scan` (0 rahasia terdeteksi).

## 8. Prosedur Rollback

1. `git revert HEAD`

## 9. Status Pengujian

- [x] Linting bersih (`pnpm lint`)
- [x] Typecheck bersih (`pnpm typecheck`)
- [x] Test unit & integrasi lulus (`pnpm test` - 29 tests)
- [x] Test E2E Playwright lulus (`pnpm test:e2e` - 7 tests)
- [x] Format bersih (`pnpm format:check`)
- [x] Integritas arsitektur bersih (`node scripts/check-layers.mjs`)
- [x] Pemindaian rahasia bersih (`pnpm secrets:scan`)

## 10. Tautan Terkait & Catatan Keamanan

- Dokumen Terkait: `docs/SECURITY.md`, `docs/WORKING-RULES.md`, `docs/CODE-STANDARDS.md`.
- Catatan Keamanan: Menjamin nol kunci/kata sandi bawaan di dalam repositori (_zero hardcoded secrets_).

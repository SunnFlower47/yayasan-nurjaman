# [ID: 0026] hardening dependensi zod deepmerge dan penegakan http 2fa

- **Tanggal & Waktu**: 2026-11-08 03.55.00 WIB (Asia/Jakarta)
- **Tipe Perubahan**: security | fix | test
- **Fase / Modul**: Fase 1c/1d (Hardening Dependensi, Proteksi Input, dan Penegakan HTTP 2FA)
- **Penulis / Agent**: SunnFlower47 / Pair Programming Assistant

---

## 1. Ringkasan Perubahan

1. **Investigasi & Resolusi Pengujian E2E 2FA**:
   - Menemukan akar penyebab kegagalan tes alur lengkap pada `tests/e2e/auth.spec.ts`: kontainer Docker `yayasan_app_dev` (menjalankan image lama Fase 1c tanpa verifikasi 2FA) masih aktif di port 3000 dan di-reuse oleh Playwright (`reuseExistingServer: !isCI`).
   - Setelah kontainer dimatikan dan server dev Next.js mutakhir dijalankan, alur 2FA terbukti bekerja 100% sesuai spesifikasi (pengalihan wajib ke `/2fa/setup` setelah ganti kata sandi).
   - Menambahkan pengujian tingkat HTTP komprehensif pada `tests/e2e/mfa-http-enforcement.spec.ts` untuk memverifikasi penolakan akses dan redirect (`302`/`307`) ke `/2fa/setup` (untuk akun tanpa 2FA) atau `/verifikasi-2fa` (untuk sesi parsial) pada rute `/admin`, `/admin/audit`, dan `/admin/keamanan`.
2. **Mitigasi Timeout Tes Seed Database**:
   - Memberikan batas waktu eksplisit 30 detik (`30000ms`) pada tes idempoten seed `tests/integration/database-identity.test.ts` (poin d) agar tidak terpotong oleh default timeout 5 detik Vitest pada lingkungan Windows.
3. **Peningkatan Versi & Penguatan Skema Zod 4.6.7**:
   - Meningkatkan versi `zod` dari `3.24.2` ke `4.6.7` guna menambal kerentanan memori exhaustion (GHSA-mrhx-c7xc-m3w5).
   - Menambahkan batasan `.max()` pada seluruh string, skema input login, penggantian kata sandi, dan variabel lingkungan (`env.ts`).
   - Menetapkan batas ukuran request body Server Actions `serverActions.bodySizeLimit: "2mb"` di `next.config.ts`.
   - Menetapkan batas ukuran request body reverse proxy Caddy `request_body { max_size 5MB }` di `docker/caddy/Caddyfile`.
   - Hasil audit produksi (`pnpm audit --prod`): **0 kerentanan (No known vulnerabilities found)**.
4. **Override Dependensi `deepmerge-ts`**:
   - Mengatur override `deepmerge-ts: ">=8.0.0"` di `pnpm-workspace.yaml` (terpasang `8.0.2`) untuk menambal kerentanan stack exhaustion pada `@prisma/config`.
   - Menguji keabsahan CLI Prisma (`prisma validate` dan `prisma migrate deploy` pada basis data kosong), terbukti skema dan migrasi berjalan sempurna tanpa kerusakan CLI.

## 2. Latar Belakang & Alasan

- Memenuhi arahan kepatuhan keamanan dan resolusi hasil temuan audit dependensi berlevel High/Moderate.
- Menjamin tidak ada celah bypass 2FA pada tingkat protokol HTTP maupun Server Actions.

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `tests/e2e/mfa-http-enforcement.spec.ts`: Pengujian HTTP tingkat protokol untuk verifikasi penolakan sesi tanpa 2FA.
- **Diubah**:
  - `package.json` & `pnpm-lock.yaml`: Upgrade zod ke 4.6.7.
  - `pnpm-workspace.yaml`: Penambahan override `deepmerge-ts: '>=8.0.0'`.
  - `next.config.ts`: Konfigurasi `experimental.serverActions.bodySizeLimit: "2mb"`.
  - `docker/caddy/Caddyfile`: Konfigurasi `request_body { max_size 5MB }`.
  - `src/lib/env.ts`: Penambahan batasan `.max()` pada string environment variables.
  - `src/modules/auth/schemas/login.schema.ts`: Penambahan batasan `.max()` pada password dan next.
  - `src/modules/auth/schemas/change-password.schema.ts`: Penambahan batasan `.max()` pada currentPassword dan confirmPassword.
  - `tests/integration/database-identity.test.ts`: Timeout 30 detik untuk pengujian seed berulang.
  - `tests/e2e/auth.spec.ts`: Penyesuaian container name dinamis pada fallback reset.
  - `.gitignore`: Mengabaikan symlink/junction `prisma/schema/migrations`.

## 4. Pemeriksaan Mutu (Quality Gates)

- **pnpm audit --prod**: 0 kerentanan (No known vulnerabilities found).
- **pnpm test**: 10 file lolos (63/63 tes berhasil).
- **pnpm test:e2e**: 14/14 tes Playwright berhasil (100%).

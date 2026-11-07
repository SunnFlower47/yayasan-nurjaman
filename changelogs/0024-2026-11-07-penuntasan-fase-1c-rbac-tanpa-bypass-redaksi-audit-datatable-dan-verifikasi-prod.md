# [ID: 0024] penuntasan fase 1c rbac tanpa bypass redaksi audit datatable dan verifikasi prod

- **Tanggal & Waktu**: 2026-11-07 23.35.00 WIB (Asia/Jakarta)
- **Tipe Perubahan**: feat | security | infra | docs
- **Fase / Modul**: Fase 1c (Identitas dan Akses: RBAC Otoritatif, Redaksi Audit, Komponen Bersama, & Verifikasi Prod)
- **Penulis / Agent**: SunnFlower47 / Pair Programming Assistant

---

## 1. Ringkasan Perubahan

Menuntaskan secara komprehensif seluruh persyaratan Fase 1c:

1. **Langkah 0 a, b, c**:
   - Peningkatan versi Prisma ke `6.19.3` (jalur stabil 6.x terakhir, `prismaSchemaFolder` GA tanpa preview feature) dan evaluasi Prisma 7.x.
   - Verifikasi tuntas stack produksi Docker (`docker-compose.prod.yml`, Caddy reverse proxy port 80/443, image runner Next.js standalone dengan native `@node-rs/argon2`, cookie `__Host-session` dengan atribut Secure, HttpOnly, SameSite=Lax, dan header CSP ketat tanpa `'unsafe-eval'`).
   - Eksekusi Playwright E2E pada stack produksi `https://localhost` membuktikan nol pelanggaran CSP dan keinteraktifan skrip formulir.
   - Penambahan addendum pada `ADR-007` terkait kewajiban dynamic rendering (`export const dynamic = "force-dynamic"`) pada halaman ber-nonce CSP.
2. **RBAC Otoritatif Murni Tanpa Bypass**:
   - Menghapus seluruh bypass kode `SUPER_ADMIN` di `rbac.repository.ts` dan `rbac.service.ts`. Super Admin mendapatkan izin murni via database `role_permissions` yang dimuat secara idempoten oleh seed.
   - `requirePermission(key)` di-cache per-request (`React.cache`), deny-by-default, mencatat event keamanan `PERMISSION_DENIED` ke tabel `security_events`.
   - Fungsi `can(subject, permissionCode)` untuk penyaringan antarmuka aman.
3. **Redaksi Data Sensitif Audit**:
   - Implementasi `redactSensitiveData` rekursif dengan denylist pola keamanan (`password`, `token`, `secret`, `nik`, `rekening`, `pin`, `credit_card`).
   - `writeAudit` otomatis meredaksi before/after, mendukung `requestId` (header `x-request-id` dari middleware), `ip`, `userAgent`, dan transaksi Prisma client (`dbClient`).
4. **Komponen Bersama & Kerangka Admin**:
   - Dibuat komponen generik `DataTable` dan `PageHeader` di `src/components/shared/` yang mematuhi standar UI-UX-RULES (Server Component, angka rata kanan, state skeleton/kosong/error, accessible).
   - Halaman `/admin/audit` dilengkapi form filter aksi, rentang tanggal, dan paginasi server.
   - Sidebar admin menyaring navigasi berdasarkan izin riil pengguna, header dengan info akun, dan skip link `#main-content`.
5. **Penegakan Otomatis & Uji Komprehensif**:
   - Dibuat `tests/unit/admin-route-protection.test.ts` untuk menjamin seluruh route dan action di `(admin)` memanggil otorisasi server.
   - 44 pengujian Vitest (unit & integrasi PostgreSQL riil) dan 7 pengujian E2E Playwright lolos 100% pada lingkungan dev maupun stack produksi.

## 2. Latar Belakang & Alasan

- Memenuhi kepatuhan OWASP ASVS L2 dan invarian arsitektur proyek: Super Admin tidak boleh memiliki pintu belakang hardcoded di kode sumber.
- Memastikan log audit tidak pernah menyimpan kredensial atau rahasia apa pun dalam kondisi apa pun.
- Membuktikan kesiapan arsitektur produksi sebelum melangkah ke implementasi 2FA TOTP wajib di Fase 1d.

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `src/components/shared/DataTable.tsx`: Komponen tabel data institusional terstandarisasi.
  - `src/components/shared/PageHeader.tsx`: Komponen header halaman panel manajemen.
  - `src/modules/audit/helpers/redact.ts`: Utilitas penyamaran otomatis atribut data sensitif.
  - `tests/unit/admin-route-protection.test.ts`: Uji penegakan otorisasi server-side pada seluruh rute admin.
- **Diubah**:
  - `package.json` & `pnpm-lock.yaml`: Upgrade Prisma dan client ke `6.19.3`.
  - `prisma/schema/schema.prisma`: Penghapusan previewFeatures folder karena sudah GA di 6.19.3.
  - `Dockerfile`: Penambahan penyalinan `node_modules/@node-rs` pada runner dan symlink migrasi pada migrator.
  - `docker-compose.prod.yml`: Penambahan variabel `ALLOWED_ORIGINS` untuk verifikasi Server Actions di lingkungan produksi.
  - `playwright.config.ts`: Konfigurasi `ignoreHTTPSErrors: true` untuk sertifikat TLS lokal Caddy dan kondisional webServer.
  - `src/middleware.ts`: Propagasi header `x-request-id` ke request dan response.
  - `src/modules/audit/repositories/audit-log.repository.ts`: Dukungan `requestId`, `ip`, `userAgent`, dan `dbClient`.
  - `src/modules/audit/services/audit.service.ts`: Redaksi otomatis sebelum create audit log.
  - `src/modules/audit/types.ts`: Penambahan tipe audit log context.
  - `src/modules/auth/repositories/rbac.repository.ts`: Penghapusan bypass hardcode Super Admin.
  - `src/modules/auth/services/rbac.service.ts`: Penghapusan bypass hardcode Super Admin.
  - `src/modules/auth/helpers/require-permission.ts`: Caching izin per request dan logging event `PERMISSION_DENIED`.
  - `src/modules/auth/actions/logout.action.ts`: Penghapusan cookie `__Host-session` dengan atribut `secure: true` dan `path: "/"`.
  - `src/app/(admin)/admin/audit/page.tsx`: Integrasi komponen `DataTable` dan form saring jejak audit.
  - `src/app/(public)/masuk/page.tsx`: Penyetelan `export const dynamic = "force-dynamic"`.
  - `docs/architecture/04a-adr-fondasi-dan-keamanan.md`: Addendum ADR-007 mengenai dynamic rendering dan nonce CSP.
  - `tests/unit/rbac-audit.test.ts`: Penambahan uji redaksi data sensitif dan ketiadaan bypass kode.
  - `tests/integration/rbac-audit.test.ts`: Uji integrasi DB PostgreSQL asli untuk multi-peran dan event penolakan izin.
  - `tests/e2e/auth.spec.ts`: Penyesuaian mode eksekusi serial dan kompatibilitas cookie HTTPS produksi.

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None`
- **Dampak Data**: Skema DDL tetap; tabel `audit_logs` dan `security_events` aktif mencatat aktivitas nyata dan penolakan izin.

## 5. Pemeriksaan Mutu (Quality Gates)

- **pnpm check**: Lolos bersih (ESLint 0 warning/error, tsc 0 error, Vitest 44 passed, Prettier valid, check-layers 0 pelanggaran).
- **pnpm test:e2e**: 7 passed pada dev dan 7 passed pada stack produksi HTTPS `https://localhost`.
- **pnpm secrets:scan**: Lolos bersih (127 berkas diperiksa, 0 rahasia).
- **Batasan Baris Kode**: Seluruh file $\le 250$ baris, fungsi $\le 50$ baris (complexity $\le 10$).

## 6. Risiko & Dampak Mundur (Rollback)

- Risiko rendah: Perubahan otorisasi dan redaksi sepenuhnya backwards compatible dengan model identitas Fase 1a/1b.

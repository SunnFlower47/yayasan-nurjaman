# [ID: 0023] implementasi rbac require-permission audit-log dan layout admin

- **Tanggal & Waktu**: 2026-11-07 21.15.00 WIB (Asia/Jakarta)
- **Tipe Perubahan**: feat | security | ui | docs
- **Fase / Modul**: Fase 1c (Identitas dan Akses: RBAC, Jejak Audit & Kerangka Admin)
- **Penulis / Agent**: Senior Full-Stack Engineer / Pair Programming Assistant

---

## 1. Ringkasan Perubahan

Menuntaskan seluruh ruang lingkup Fase 1c: implementasi otorisasi server-side RBAC otoritatif (`requirePermission`, `hasPermission`), pencatatan riwayat aktivitas append-only terpusat (`writeAudit`), koreksi klaim kebijakan password pada `docs/SECURITY.md`, serta penyediaan institutional layout shell admin (`AdminSidebar`, `AdminHeader`, dashboard ringkasan pengurus, dan halaman jejak audit `/admin/audit`).

## 2. Latar Belakang & Alasan

1. **Prasyarat Otorisasi Fase 1d**: Sebelum menerapkan 2FA wajib dan re-autentikasi (Fase 1d), sistem membutuhkan fondasi otorisasi berbasis peran dan izin resmi (`requirePermission`), layanan jejak audit tidak dapat diubah (`writeAudit`), dan navigasi panel admin internal.
2. **Koreksi Klaim Kepatuhan**: Dokumen `docs/SECURITY.md` dikoreksi secara akurat sesuai standar NIST SP 800-63B-4 bahwa password 8 karakter hanya dapat dipertanggungjawabkan apabila MFA diberlakukan wajib untuk seluruh akun pengurus.
3. **Pemisahan Tanggung Jawab & Clean Architecture**: Penegakan otorisasi diletakkan pada server layer dengan verifikasi langsung ke database untuk mencegah manipulasi sesi di UI/middleware.

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `src/modules/auth/helpers/require-permission.ts`: Helper server-side otoritatif `requirePermission` dengan proteksi 403 Forbidden.
  - `src/modules/auth/repositories/rbac.repository.ts`: Repository RBAC dengan query peran dan katalog izin pengguna.
  - `src/modules/auth/services/rbac.service.ts`: Layanan evaluasi hak akses peran dan izin.
  - `src/modules/audit/types.ts`: Tipe data entri log audit, query options, dan pagination.
  - `src/modules/audit/repositories/audit-log.repository.ts`: Repository pencatatan dan pembacaan log audit (`buildWhereClause`).
  - `src/modules/audit/services/audit.service.ts`: Layanan terpusat `writeAudit` dan `getAuditLogs`.
  - `src/modules/audit/index.ts`: Public API modul audit sebagai satu-satunya titik masuk lintas-modul.
  - `src/components/layout/AdminSidebar.tsx`: Sidebar navigasi institusional panel admin.
  - `src/components/layout/AdminHeader.tsx`: Header panel pengurus dengan indikator peran dan aksi keluar.
  - `src/app/(admin)/layout.tsx`: Layout pelindung rute internal dengan pengecekan sesi dan peran aktif.
  - `src/app/(admin)/admin/audit/page.tsx`: Halaman riwayat jejak audit dilindungi `requirePermission("audit.view")`.
  - `tests/unit/rbac-audit.test.ts`: Unit test RBAC Super Admin bypass dan normalisasi log audit.
  - `tests/integration/rbac-audit.test.ts`: Integration test PostgreSQL asli untuk otorisasi dan persistensi log audit.
- **Diubah**:
  - `docs/SECURITY.md`: Koreksi klaim kepatuhan password 8 karakter dengan syarat MFA wajib di Fase 1d.
  - `src/lib/db.ts`: Ekspor alias `prisma = db` untuk kompatibilitas impor klien Prisma.
  - `src/modules/auth/permissions.ts`: Penambahan izin resmi `users.reset_2fa` dan katalog `PERMISSIONS`.
  - `src/modules/auth/index.ts`: Ekspor publik untuk fungsi-fungsi RBAC dan helper `requirePermission`.
  - `src/modules/auth/services/auth.service.ts`: Integrasi pencatatan jejak audit saat pergantian kata sandi.
  - `src/app/(admin)/admin/page.tsx`: Penyesuaian antarmuka dashboard pengurus ke dalam tata letak admin.
  - `tests/integration/auth.test.ts`: Pembersihan catatan audit di `afterAll` agar mematuhi FK RESTRICT.
  - `tests/e2e/auth.spec.ts`: Penambahan skenario uji E2E navigasi sidebar ke jejak audit dan logout.

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None` (Menggunakan 12 tabel fondasi identitas yang telah dimigrasikan pada Fase 1a).
- **Dampak Data**: Tidak ada perubahan skema DDL. Penambahan data terjadi pada tabel `audit_logs` saat pergantian password.

## 5. Perubahan Dependensi (Dependencies)

- **Ditambah**: Tidak ada
- **Diubah / Dihapus**: Tidak ada

## 6. Dampak & Risiko

- Seluruh rute di bawah `(admin)` kini dilindungi oleh tata letak terpusat yang memeriksa sesi secara otomatis.
- Akun yang berstatus `mustChangePassword` tetap diisolasi tanpa akses ke menu navigasi sidebar hingga pergantian kata sandi selesai.

## 7. Prosedur Verifikasi

1. `pnpm check`: Lint bersih, typecheck bersih, 40 tes Vitest lulus (unit & integrasi DB asli), format Prettier rapi, arsitektur lapis 0 pelanggaran.
2. `pnpm test:e2e`: 7 tes Playwright lintas browser lulus tanpa kegagalan.
3. `pnpm secrets:scan`: 123 berkas dipindai, 0 rahasia terdeteksi.

## 8. Prosedur Rollback

1. `git revert <commit-hash>`

## 9. Status Pengujian

- [x] Linting bersih (`pnpm lint`)
- [x] Typecheck bersih (`pnpm typecheck`)
- [x] Test unit & integrasi lulus (`pnpm test` - 40 tests)
- [x] Test E2E lulus (`pnpm test:e2e` - 7 tests)
- [x] Format rapi (`pnpm format:check`)
- [x] Pemeriksaan batas layer (`node scripts/check-layers.mjs` - 0 violations)
- [x] Pemindaian rahasia (`pnpm secrets:scan` - 0 secrets)

## 10. Tautan Terkait & Catatan Keamanan

- Master Plan: docs/master-plan/02-admin-dan-kelembagaan.md (Fase 1c)
- Standar Keamanan: docs/SECURITY.md (§2.1 Kebijakan Password & Otorisasi Server)
- Desain UI/UX: docs/UI-UX-RULES.md (Institutional Layout)

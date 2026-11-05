# AGENTS.md — Panduan Wajib Setiap Sesi AI Agent

Sistem web resmi dan panel manajemen internal untuk Yayasan Nurjaman Bongas Purwakarta (entitas nirlaba di Purwakarta, Jawa Barat). Sistem mencakup website profil publik dan admin panel terintegrasi untuk anggota, keuangan berbasis ISAK 35, proyek, pajak, dan tata kelola yayasan. Seluruh pengembangan mengutamakan presisi akuntansi, keamanan ketat, dan transparansi institusional.

## Urutan Wajib Baca Dokumen (Harus Dibaca Sebelum Bertindak)

1. [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md) — Rencana induk, status fase aktif, lingkup, dan daftar tugas terperinci.
2. [`docs/WORKING-RULES.md`](file:///docs/WORKING-RULES.md) — Aturan kerja, alur pengerjaan, standar kode, dan invarian akuntansi.
3. [`docs/CODE-STANDARDS.md`](file:///docs/CODE-STANDARDS.md) — Standar clean code, batas ukuran berkas/fungsi, arsitektur berlapis, dan konvensi modular.
4. [`docs/SECURITY.md`](file:///docs/SECURITY.md) — Kebijakan keamanan siber, model ancaman OWASP ASVS L2, otorisasi server, proteksi sesi, dan penanganan data sensitif.
5. [`docs/UI-UX-RULES.md`](file:///docs/UI-UX-RULES.md) — Desain kelembagaan bersih, palet logo resmi, tipografi, komponen bersama, dan larangan AI-slop.
6. [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md) — Struktur sistem terdistribusi, skema konseptual, RBAC, dan audit trail.
7. [`docs/database/00-README.md`](file:///docs/database/00-README.md) — Spesifikasi teknis struktur basis data (70 tabel modular dalam 8 berkas domain).
8. [`docs/database/11-migration-plan.md`](file:///docs/database/11-migration-plan.md) — Panduan migrasi database sekali jalan dan portabilitas mesin Docker.
9. [`docs/database/14-traceability.md`](file:///docs/database/14-traceability.md) — Matriks keterlacakan regulasi, evolusi skema expand-contract, dan validasi restore.

## 10 Aturan Inti yang Dilarang Keras Dilanggar

1. **Disiplin Lingkup Ketat**: Kerjakan HANYA fase/tugas aktif. Dilarang refactor atau menambahkan fitur "sekalian".
2. **Kewajiban Changelog**: Setiap perubahan kode/konfigurasi/DB/docs/CI WAJIB dibuatkan entri terpisah di `changelogs/` sebelum commit.
3. **Invarian Akuntansi**: Total Debit WAJIB sama dengan Kredit. Transaksi `posted` DILARANG diedit/dihapus (hanya void).
4. **Presisi Keuangan**: Nilai uang disimpan sebagai integer rupiah (BigInt/Decimal), DILARANG menggunakan tipe data float.
5. **Konfigurasi Tarif Pajak**: Tarif pajak DILARANG di-hardcode di kode, wajib tersimpan dalam master data berversi tanggal.
6. **Arsitektur Berlapis Bersih**: Komponen UI dilarang melakukan query database langsung; alur wajib: Route/Action → Service → Repository. Deep-import antar-modul domain dilarang keras.
7. **Batas Ukuran & Clean Code**: Maksimal 250 baris per berkas (error di 300), 50 baris per fungsi (complexity <= 10, parameter <= 4), dan 150 baris per komponen React. Bebas kode mati dan `console.log`.
8. **Validasi Batas & Otorisasi Server**: Semua input eksternal wajib divalidasi dengan Zod schema di server layer. Izin (`requirePermission`) dicek di server pada setiap server action/API, bukan hanya di UI atau middleware.
9. **Nol Kunci Rahasia (_Zero Leaked Secrets_)**: Dilarang meletakkan token, kunci privat, atau password di kode atau commit Git. Seluruh rahasia dipindai dengan `pnpm secrets:scan`.
10. **Laporan & Konfirmasi**: Berhenti dan lapor sesuai format setelah menyelesaikan satu fase/tugas. Tunggu konfirmasi user sebelum lanjut.

## Perintah Penting (CLI Scripts)

- **Instalasi**: `pnpm install`
- **Jalankan Dev**: `pnpm dev` (akses `http://localhost:3000` dan dev token `http://localhost:3000/dev/tokens`)
- **Pemeriksaan Mutu Terpadu**: `pnpm check` (lint, typecheck, test, format, check-layers)
- **Pemeriksaan Lintas Lapis**: `node scripts/check-layers.mjs`
- **Audit Kerentanan**: `pnpm security:audit`
- **Pemindaian Kunci Rahasia**: `pnpm secrets:scan`
- **Uji E2E**: `pnpm test:e2e`
- **Database & Prisma**: `pnpm db:migrate` (hanya migration, bukan db push) | `pnpm db:studio`
- **Changelog Baru**: `pnpm changelog:new "deskripsi ringkas perubahan"`

> **PENEGASAN MUTLAK**: Git hook pre-commit akan menolak commit jika perubahan tidak disertai entri baru di `changelogs/`, jika terdapat kunci rahasia terdeteksi, atau jika terjadi pelanggaran batas arsitektur berlapis.

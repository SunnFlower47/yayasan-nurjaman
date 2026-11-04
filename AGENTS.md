# AGENTS.md — Panduan Wajib Setiap Sesi AI Agent

Sistem web resmi dan panel manajemen internal untuk Yayasan Nurjaman Bongas Purwakarta (entitas nirlaba di Purwakarta, Jawa Barat). Sistem mencakup website profil publik dan admin panel terintegrasi untuk anggota, keuangan berbasis ISAK 35, proyek, pajak, dan tata kelola yayasan. Seluruh pengembangan mengutamakan presisi akuntansi, keamanan ketat, dan transparansi institusional.

## Urutan Wajib Baca Dokumen (Harus Dibaca Sebelum Bertindak)

1. [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md) — Rencana induk, status fase aktif, lingkup, dan daftar tugas.
2. [`docs/WORKING-RULES.md`](file:///docs/WORKING-RULES.md) — Aturan kerja, alur pengerjaan, standar kode, dan invarian akuntansi.
3. [`docs/UI-UX-RULES.md`](file:///docs/UI-UX-RULES.md) — Desain kelembagaan bersih, palet logo resmi, tipografi, dan larangan AI-slop.
4. [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md) — Struktur berlapis, skema konseptual, RBAC, dan audit trail.

## 10 Aturan Inti yang Dilarang Keras Dilanggar

1. **Disiplin Lingkup Ketat**: Kerjakan HANYA fase/tugas aktif. Dilarang refactor atau menambahkan fitur "sekalian".
2. **Kewajiban Changelog**: Setiap perubahan kode/konfigurasi/DB WAJIB dibuatkan entri di `changelogs/` sebelum commit.
3. **Invarian Akuntansi**: Total Debit WAJIB sama dengan Kredit. Transaksi `posted` DILARANG diedit/dihapus (hanya void).
4. **Presisi Keuangan**: Nilai uang disimpan sebagai integer rupiah (BigInt/Decimal), DILARANG menggunakan tipe data float.
5. **Konfigurasi Tarif Pajak**: Tarif pajak DILARANG di-hardcode di kode, wajib tersimpan dalam master data berversi tanggal.
6. **Arsitektur Berlapis Bersih**: Komponen UI dilarang melakukan query database langsung; alur wajib: Route/Action → Service → Repository.
7. **Validasi Batas Sistem**: Semua input eksternal wajib divalidasi dengan Zod schema di server layer.
8. **Otorisasi Server-Side**: Keamanan dan permission dicek di server pada setiap server action/API, bukan hanya di UI.
9. **Desain Anti AI-Slop**: Dilarang menggunakan gradient ungu-pink, ilustrasi orang laptop generik, shadow raksasa, dan emoji ikon.
10. **Laporan & Konfirmasi**: Berhenti dan lapor sesuai format setelah menyelesaikan satu fase/tugas. Tunggu konfirmasi user sebelum lanjut.

## Perintah Penting (CLI Scripts)

- **Instalasi**: `pnpm install`
- **Jalankan Dev**: `pnpm dev` (akses `http://localhost:3000` dan dev token `http://localhost:3000/dev/tokens`)
- **Pemeriksaan Mutu**: `pnpm lint` && `pnpm typecheck` && `pnpm test`
- **Uji E2E**: `pnpm test:e2e`
- **Database & Prisma**: `pnpm db:migrate` (hanya migration, bukan db push) | `pnpm db:studio`
- **Changelog Baru**: `pnpm changelog:new "deskripsi ringkas perubahan"`

> **PENEGASAN MUTLAK**: Git hook pre-commit akan menolak commit jika perubahan kode/konfigurasi tidak disertai entri baru di `changelogs/`.

# [ID: 0009] Rekonsiliasi Docker-First, Pemindahan 11-migration-plan ke docs/database, Matriks Keterlacakan 14-traceability, dan ADR-009

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan, Rekonsiliasi Docker & Desain Basis Data)
- **Tipe Perubahan**: `docs`, `security`
- **Branch**: `docs/database-design`
- **Lingkup**: `docs/database/11-migration-plan.md`, `docs/database/14-traceability.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATABASE-SCHEMA.md`, `docs/MASTER-PLAN.md`, `AGENTS.md`

---

### 1. Ringkasan Perubahan

Melakukan rekonsiliasi menyeluruh terhadap arsitektur Docker-First dan desain basis data:

1. Memindahkan berkas panduan migrasi basis data via `git mv` dari `docs/11-migration-plan.md` ke `docs/database/11-migration-plan.md` dan memperbarui seluruh tautan dokumen.
2. Memperkaya panduan migrasi dengan pola evolusi skema **Expand-Contract**, memperjelas toleransi **henti singkat terukur (_brief downtime_)** saat restart app Next.js (mengoreksi klaim zero-downtime monolit), menetapkan jalur normal pemulihan kegagalan via `prisma migrate resolve` (snapshot restore sebagai pilihan terakhir), serta menetapkan **Caddy** sebagai reverse proxy resmi dan cadangan **offsite S3-compatible** sebagai kewajiban mandatori.
3. Menyelaraskan konvensi kriptografi kolom sensitif: mengganti penyebutan rahasia tunggal menjadi **Key Ring Enkripsi Aplikasi (`ENCRYPTION_KEY_ACTIVE_ID` & `ENCRYPTION_KEYS`)** berotasi serta kunci HMAC terpisah **`BLIND_INDEX_SECRET`** untuk pencarian NIK tanpa dekripsi; menegaskan bahwa SELURUH kunci wajib direplikasi saat pindah mesin.
4. Menerbitkan dokumen baru `docs/database/14-traceability.md` yang menetapkan matriks keterlacakan regulasi (ISAK 35, UU PDP 27/2022, PPh 21/23, SK Kemenkumham) ke 70 tabel, mencatat pelacak 3 pilar versi (`postgres_version`, `schema_version`, `app_version`), dan merumuskan aturan penolakan mutlak pre-restore.
5. Menetapkan **ADR-009** di `docs/ARCHITECTURE.md` dan memperbarui `docs/SECURITY.md`, `docs/DATABASE-SCHEMA.md`, `docs/MASTER-PLAN.md`, serta `AGENTS.md`.

---

### 2. Rincian Implementasi & Kebijakan Teknis

1. **Pemindahan Berkas & Integrasi Panduan Migrasi (`docs/database/11-migration-plan.md`)**:

   - Berkas dipindahkan menggunakan `git mv` ke direktori `docs/database/`.
   - Mengintegrasikan pola **Expand lalu Contract**: setiap perubahan skema wajib backward-compatible dengan versi kode yang sedang berjalan.
   - Mengoreksi istilah zero-downtime: restart aplikasi Next.js monolit menimbulkan henti singkat terukur (2–5 detik) saat inisialisasi runtime dan healthcheck.
   - Menetapkan penanganan migrasi gagal: perbaikan maju (_fix forward_) dan sinkronisasi status via `prisma migrate resolve` (`--applied` atau `--rolled-back`) sebagai jalur normal; restorasi dari snapshot cadangan `PRE_DEPLOY` adalah pilihan terakhir (_last resort_).
   - Menetapkan Caddy sebagai reverse proxy resmi dan cadangan offsite ke bucket S3-compatible (Cloudflare R2, AWS S3, MinIO) sebagai kewajiban (_WAJIB_).

2. **Penyelarasan Manajemen Kunci Kriptografi (Multi-Key Convention)**:

   - Menyelaraskan ADR-008, `docs/SECURITY.md` (Bagian 7.1), dan prosedur pindah mesin di `11-migration-plan.md`:
     - **Key Ring AES-256-GCM**: Format ciphertext `bytea` diawali `key_id`, dengan `ENCRYPTION_KEY_ACTIVE_ID` untuk data baru dan seluruh daftar kunci historis di `ENCRYPTION_KEYS` untuk dekripsi data lama.
     - **HMAC Blind Index**: `BLIND_INDEX_SECRET` adalah rahasia terpisah khusus untuk hashing satu arah pencarian deterministik NIK anggota.
     - **Invarian Pemindahan Mesin**: SEMUA kunci di `.env` wajib disalin secara utuh. Jika kunci enkripsi hilang, data terenkripsi tidak bisa dibaca selamanya (_permanent data loss_); jika kunci blind index hilang, pencarian NIK dan deteksi duplikasi anggota rusak total (_search failure & duplicate integrity breach_).

3. **Penerbitan Dokumen Keterlacakan (`docs/database/14-traceability.md`)**:

   - Memetakan kepatuhan ISAK 35, UU PDP No. 27/2022, UU Perpajakan, SK Kemenkumham, dan akuntabilitas proyek Purwakarta ke 70 tabel basis data.
   - Menegaskan kewajiban `backup_jobs` mencatat `postgres_version`, `schema_version`, dan `app_version`.
   - Menyusun 4 aturan penolakan mutlak pre-restore:
     1. Menolak keras jika PostgreSQL target < `postgres_version` cadangan.
     2. Menolak otomatis jika skema target tidak kompatibel dengan `schema_version` cadangan.
     3. Menolak keras jika key ring target tidak memiliki `key_id` yang sesuai atau `BLIND_INDEX_SECRET` berbeda.
     4. Menolak jika pembuatan snapshot otomatis `pre_restore_backup_id` gagal.
   - Mendefinisikan keterlacakan evolusi skema berbasis Expand-Contract dan sifat nirubah (_immutable_) dari `audit_logs`.

4. **Penetapan ADR-009 (`docs/ARCHITECTURE.md`)**:

   - Menambahkan catatan keputusan arsitektur ADR-009: _"Manajemen Kriptografi Multi-Kunci & Pola Migrasi Expand-Contract"_.

5. **Pembaruan Dokumen Terkait**:
   - `docs/DATABASE-SCHEMA.md`: Memperbarui catatan pra-restorasi pada `restore_events` dan konvensi Key Ring.
   - `docs/SECURITY.md`: Memperbarui Section 7.1 untuk konvensi multi-kunci.
   - `docs/MASTER-PLAN.md`: Memperbarui sasaran Fase 0.7 dengan rujukan berkas baru.
   - `AGENTS.md`: Memperbarui urutan wajib baca dokumen (nomor 8 dan 9).

---

### 3. Berkas yang Ditambahkan, Dipindahkan & Dimodifikasi

- `docs/11-migration-plan.md` $\rightarrow$ `docs/database/11-migration-plan.md` (Dipindahkan & Diperkaya)
- `docs/database/14-traceability.md` (Berkas Baru)
- `docs/ARCHITECTURE.md` (Dimodifikasi: ADR-009, Section 6.1, 6.4, 6.7)
- `docs/SECURITY.md` (Dimodifikasi: Section 7.1)
- `docs/DATABASE-SCHEMA.md` (Dimodifikasi: Section 8 & Section 9)
- `docs/MASTER-PLAN.md` (Dimodifikasi: Fase 0.7)
- `AGENTS.md` (Dimodifikasi: Urutan baca dokumen)
- `changelogs/0009-2026-11-05-rekonsiliasi-docker-dan-desain-basis-data.md` (Entri Baru)

---

### 4. Cara Memverifikasi

1. Periksa struktur git move:
   ```bash
   git status
   ```
2. Jalankan pemeriksaan mutu terpadu:
   ```bash
   pnpm check
   ```
3. Jalankan pemindaian rahasia:
   ```bash
   pnpm secrets:scan
   ```

# [ID: 0008] Spesifikasi Struktur Basis Data 70 Tabel Modul Domain

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Desain Skema Basis Data)
- **Tipe Perubahan**: `docs`
- **Lingkup**: `docs/DATABASE-SCHEMA.md`, `AGENTS.md`

---

### 1. Ringkasan Perubahan

Menerbitkan dokumen spesifikasi teknis basis data komprehensif `docs/DATABASE-SCHEMA.md` yang mencakup 70 tabel dalam 8 modul domain (63 tabel inti dan 7 tabel fitur opsional) untuk sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen ini menjadi cetak biru (_blueprint_) acuan sebelum pemodelan skema Prisma diimplementasikan bertahap mulai Fase 1 hingga Fase 8. Selain itu, dokumen `AGENTS.md` diperbarui untuk mencantumkan dokumen skema ini ke dalam urutan baca wajib agen.

---

### 2. Rincian Implementasi & Kebijakan Teknis

1. **Penerbitan Dokumen Spesifikasi Skema (`docs/DATABASE-SCHEMA.md`)**:

   - Mendefinisikan konvensi penamaan seragam: tabel jamak snake*case, primary key `id` (UUIDv7), timestamp UTC `created_at` dan `updated_at`, batasan \_foreign key* eksplisit (`ON DELETE RESTRICT` sebagai standar), soft delete (`deleted_at`), dan _optimistic locking_ (`version int`).
   - Menerapkan presisi mata uang Rupiah utuh dengan tipe `bigint` (dilarang _floating-point_).
   - Menetapkan enkripsi level aplikasi AES-256-GCM (`[enc]`) untuk PII sensitif (NIK anggota, nomor rekening bank, secret 2FA) dengan blind index HMAC-SHA256 (`[hash]`) demi kepatuhan UU Pelindungan Data Pribadi (UU PDP No. 27/2022).

2. **Cakupan 8 Modul Domain (70 Tabel)**:

   - **Modul 1: Identitas & Akses (12 tabel)**: `users`, `sessions`, `accounts`, `verifications`, `roles`, `permissions`, `role_permissions`, `user_roles`, `audit_logs`, `two_factor_backup_codes`, `password_reset_tokens`, `rate_limit_buckets`. Mendukung penugasan _multi-role_, jejak audit append-only yang tidak bisa diubah/dihapus, dan mitigasi brute-force via database rate limiting.
   - **Modul 2: Pengaturan, Profil Yayasan & Media (7 tabel)**: `foundation_profile` (singleton legalitas & SK Kemenkumham), `legal_documents`, `letterheads`, `settings`, `media_assets`, `media_tags`, `media_asset_tags`.
   - **Modul 3: Anggota (6 tabel)**: `members`, `member_positions`, `member_id_cards` (riwayat penerbitan KTA fisik/digital), `member_dues`, `member_dues_payments`, `member_import_batches`. NIK anggota terenkripsi (`nik_enc`) diproteksi blind index (`nik_blind_index`).
   - **Modul 4: Keuangan & Akuntansi ISAK 35 (19 tabel)**:
     - Bagan Akun / COA (`accounts`) dengan klasifikasi aset neto (Tanpa Pembatasan / Dengan Pembatasan).
     - Rekening kas & bank (`cash_and_banks`).
     - **Pemisahan Dokumen Transaksi dari Jurnal Umum**: `financial_transactions` adalah dokumen bisnis pengguna (tempat persetujuan, lampiran nota, dan pemotongan pajak melekat); `journal_entries` dan `journal_lines` adalah jurnal berpasangan seimbang (debit = kredit) yang baru dibentuk ketika transaksi berstatus `POSTED`.
     - `restricted_funds`: dana terikat dikalkulasi secara _runtime_ dari `journal_lines`, tidak disimpan statis.
     - Anggaran & realisasi (`budgets`, `budget_items`), rekonsiliasi bank (`bank_reconciliations`, `bank_reconciliation_lines`), transaksi berulang (`recurring_transactions`), donasi non-kas (`in_kind_donations`), aset tetap & penyusutan (`asset_inventories`, `depreciation_schedules`), serta penutupan buku (`closing_entries`).
   - **Modul 5: Proyek & Kegiatan (7 tabel)**: `projects` (kegiatan sosial/pendidikan/keagamaan Purwakarta), `project_milestones`, `project_budgets`, `project_financial_links` (keterkaitan transaksi keuangan ke pagu proyek), `project_members`, `project_fund_sources`, `project_updates`.
   - **Modul 6: Pajak Berkonfigurasi (6 tabel)**: `tax_types`, `tax_tariffs` (tarif tersimpan dinamis dengan masa berlaku `effective_from` s.d. `effective_to`), `tax_withholdings`, `tax_payments`, `tax_evidences`, `tax_invoices`.
   - **Modul 7: Konten & Publikasi (8 tabel)**: `posts`, `categories`, `post_categories`, `tags`, `post_tags`, `contact_messages`, `galleries`, `public_transparency_snapshots`.
   - **Modul 8: Cadangan & Pemeliharaan Sistem (5 tabel)**: `backup_schedules`, `backup_jobs` (dengan pelacak kompatibilitas `postgres_version`, `schema_version`, dan `app_version`), `restore_validations`, `job_locks`, `download_tokens`.

3. **Pembaruan Dokumen Induk (`AGENTS.md`)**:
   - Menambahkan `docs/DATABASE-SCHEMA.md` pada urutan wajib baca nomor 7.
   - Menambahkan `docs/11-migration-plan.md` pada urutan wajib baca nomor 8.

---

### 3. Berkas yang Ditambahkan & Dimodifikasi

- `docs/DATABASE-SCHEMA.md`: Berkas spesifikasi teknis skema 70 tabel basis data.
- `AGENTS.md`: Pembaruan daftar urutan wajib baca dokumen panduan kerja.
- `changelogs/0008-2026-11-05-spesifikasi-struktur-basis-data.md`: Entri changelog resmi perubahan ini.

---

### 4. Cara Memverifikasi

1. Buka `docs/DATABASE-SCHEMA.md` dan pastikan seluruh 70 tabel dan 8 modul domain terdefinisi dengan tipe data dan constraints lengkap.
2. Periksa konsistensi antara `docs/DATABASE-SCHEMA.md` dengan invarian akuntansi di `docs/WORKING-RULES.md` dan `docs/ARCHITECTURE.md`.
3. Jalankan `pnpm check` dan `pnpm secrets:scan` untuk memastikan tidak ada pelanggaran mutu kode maupun kebocoran kunci rahasia.

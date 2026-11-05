# Diff: DATABASE-SCHEMA.md vs Draf Pemilik

_Perbandingan dokumen · Dibuat 2026-11-06_

> Draf pemilik: file lampiran `Struktur_Database_—_Yayasan_Nurjaman_Bongas_Purwakarta.md`  
> Dokumen saat ini: `docs/DATABASE-SCHEMA.md` (dan turunan modularnya di `docs/database/`)

## Metodologi

Perbandingan dilakukan tabel demi tabel, kolom demi kolom, dengan membaca kedua dokumen secara langsung. Semua temuan dicatat apa adanya.

---

## Ringkasan Eksekutif

| Status                             |       Jumlah | Keterangan                                       |
| :--------------------------------- | -----------: | :----------------------------------------------- |
| **Sama**                           |     66 tabel | Ada di draf dan DATABASE-SCHEMA.md, nama identik |
| **Diubah (level tabel)**           |      0 tabel | Tidak ada perubahan nama tabel                   |
| **Dihapus dari draf**              |      0 tabel | Tidak ada tabel draf yang dihapus                |
| **Ditambah arsitektur**            | 0 tabel baru | Tidak ada tabel baru di luar 70 tabel draf       |
| **Kolom ditambah arsitektur**      |      4 kolom | Di `backup_jobs` (lihat detail)                  |
| **Nilai enum ditambah arsitektur** |      1 nilai | `PRE_DEPLOY` di `backup_jobs.trigger`            |
| **Bahasa kepatuhan hukum**         |   1 instance | Baris 1067, sudah dikoreksi                      |

**Kesimpulan**: Struktur 70 tabel sesuai draf pemilik. Tidak ada tabel atau kolom draf yang hilang. Penyimpangan hanya pada 4 kolom tambahan di `backup_jobs` yang ditambahkan oleh tim arsitektur (bukan dari draf), dan satu nilai enum tambahan.

---

## Detail Perbandingan Per Modul

### Modul 1 — Identitas dan Akses (12 tabel)

| Tabel                       | Di Draf | Di DATABASE-SCHEMA.md | Status   | Catatan                                 |
| :-------------------------- | :------ | :-------------------- | :------- | :-------------------------------------- |
| `users`                     | ✓       | ✓                     | **Sama** | Semua kolom identik termasuk `username` |
| `sessions`                  | ✓       | ✓                     | **Sama** |                                         |
| `two_factor_secrets`        | ✓       | ✓                     | **Sama** |                                         |
| `two_factor_recovery_codes` | ✓       | ✓                     | **Sama** |                                         |
| `password_reset_tokens`     | ✓       | ✓                     | **Sama** |                                         |
| `rate_limit_counters`       | ✓       | ✓                     | **Sama** |                                         |
| `roles`                     | ✓       | ✓                     | **Sama** |                                         |
| `permissions`               | ✓       | ✓                     | **Sama** |                                         |
| `role_permissions`          | ✓       | ✓                     | **Sama** |                                         |
| `user_roles`                | ✓       | ✓                     | **Sama** |                                         |
| `audit_logs`                | ✓       | ✓                     | **Sama** |                                         |
| `security_events`           | ✓       | ✓                     | **Sama** |                                         |

**Kolom kritis yang diverifikasi**:

| Kolom       | Tabel   | Di Draf          | Di DATABASE-SCHEMA.md | Status   |
| :---------- | :------ | :--------------- | :-------------------- | :------- |
| `username`  | `users` | ✓                | ✓ (baris 37)          | **Sama** |
| `member_id` | `users` | ✓ (FK → members) | ✓                     | **Sama** |

---

### Modul 2 — Pengaturan, Profil, dan Media (7 tabel)

| Tabel                     | Di Draf | Di DATABASE-SCHEMA.md | Status   | Catatan                                            |
| :------------------------ | :------ | :-------------------- | :------- | :------------------------------------------------- |
| `media_assets`            | ✓       | ✓                     | **Sama** |                                                    |
| `foundation_profile`      | ✓       | ✓                     | **Sama** | Termasuk `letterhead_note` (ada di draf baris 207) |
| `foundation_missions`     | ✓       | ✓                     | **Sama** |                                                    |
| `foundation_social_links` | ✓       | ✓                     | **Sama** |                                                    |
| `app_settings`            | ✓       | ✓                     | **Sama** |                                                    |
| `report_signatories`      | ✓       | ✓                     | **Sama** |                                                    |
| `number_sequences`        | ✓       | ✓                     | **Sama** |                                                    |

**Tabel tidak ada di draf** (dipindah ke Usulan Tambahan di file modul):

- `legal_documents` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓
- `letterheads` — tidak ada di draf sebagai tabel, tidak ada di DATABASE-SCHEMA.md ✓
- `media_tags` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓
- `media_asset_tags` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓

---

### Modul 3 — Anggota (6 tabel)

| Tabel                     | Di Draf      | Di DATABASE-SCHEMA.md | Status   | Catatan             |
| :------------------------ | :----------- | :-------------------- | :------- | :------------------ |
| `member_positions`        | ✓            | ✓                     | **Sama** |                     |
| `members`                 | ✓            | ✓                     | **Sama** | Semua kolom KTA ada |
| `member_position_history` | ✓            | ✓                     | **Sama** |                     |
| `member_dues`             | ✓ (opsional) | ✓ (opsional)          | **Sama** |                     |
| `member_import_batches`   | ✓ (opsional) | ✓ (opsional)          | **Sama** |                     |
| `member_import_errors`    | ✓ (opsional) | ✓ (opsional)          | **Sama** |                     |

**Kolom KTA yang diverifikasi**:

| Kolom                | Tabel     | Di Draf | Di DATABASE-SCHEMA.md | Status   |
| :------------------- | :-------- | :------ | :-------------------- | :------- |
| `kta_no`             | `members` | ✓       | ✓ (baris 298)         | **Sama** |
| `kta_status`         | `members` | ✓       | ✓ (baris 299)         | **Sama** |
| `kta_issued_on`      | `members` | ✓       | ✓ (baris 300)         | **Sama** |
| `kta_photo_asset_id` | `members` | ✓       | ✓ (baris 301)         | **Sama** |

**Tabel tidak ada di draf** (dipindah ke Usulan Tambahan di file modul):

- `member_id_cards` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓

---

### Modul 4 — Keuangan Inti (19 tabel)

| Tabel                     | Di Draf | Di DATABASE-SCHEMA.md | Status   | Catatan                       |
| :------------------------ | :------ | :-------------------- | :------- | :---------------------------- |
| `fiscal_years`            | ✓       | ✓                     | **Sama** |                               |
| `accounting_periods`      | ✓       | ✓                     | **Sama** |                               |
| `period_status_log`       | ✓       | ✓                     | **Sama** |                               |
| `chart_of_accounts`       | ✓       | ✓                     | **Sama** | Nama benar (bukan `accounts`) |
| `cash_bank_accounts`      | ✓       | ✓                     | **Sama** |                               |
| `parties`                 | ✓       | ✓                     | **Sama** |                               |
| `transaction_categories`  | ✓       | ✓                     | **Sama** |                               |
| `financial_transactions`  | ✓       | ✓                     | **Sama** | Termasuk `party_id`           |
| `transaction_attachments` | ✓       | ✓                     | **Sama** |                               |
| `journal_entries`         | ✓       | ✓                     | **Sama** |                               |
| `journal_lines`           | ✓       | ✓                     | **Sama** | Termasuk `party_id`           |
| `restricted_funds`        | ✓       | ✓                     | **Sama** |                               |
| `restriction_releases`    | ✓       | ✓                     | **Sama** |                               |
| `in_kind_donations`       | ✓       | ✓                     | **Sama** |                               |
| `budget_versions`         | ✓       | ✓                     | **Sama** |                               |
| `budget_lines`            | ✓       | ✓                     | **Sama** |                               |
| `approval_policies`       | ✓       | ✓                     | **Sama** |                               |
| `approval_requests`       | ✓       | ✓                     | **Sama** |                               |
| `approval_actions`        | ✓       | ✓                     | **Sama** |                               |

**Tabel tidak ada di draf** (dipindah ke Usulan Tambahan di file modul):

- `bank_reconciliations` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓
- `recurring_transactions` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓
- `asset_inventories` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓
- `depreciation_schedules` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓
- `closing_entries` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓

---

### Modul 5 — Proyek dan Kegiatan (7 tabel)

| Tabel                     | Di Draf      | Di DATABASE-SCHEMA.md | Status   | Catatan                              |
| :------------------------ | :----------- | :-------------------- | :------- | :----------------------------------- |
| `project_types`           | ✓            | ✓                     | **Sama** |                                      |
| `projects`                | ✓            | ✓                     | **Sama** |                                      |
| `project_milestones`      | ✓            | ✓                     | **Sama** |                                      |
| `project_updates`         | ✓            | ✓                     | **Sama** |                                      |
| `project_files`           | ✓            | ✓                     | **Sama** | Nama benar `project_files`           |
| `project_funding_sources` | ✓ (opsional) | ✓ (opsional)          | **Sama** | Nama benar `project_funding_sources` |
| `project_members`         | ✓ (opsional) | ✓ (opsional)          | **Sama** |                                      |

---

### Modul 6 — Pajak (6 tabel)

| Tabel               | Di Draf | Di DATABASE-SCHEMA.md | Status   | Catatan                                                |
| :------------------ | :------ | :-------------------- | :------- | :----------------------------------------------------- |
| `tax_profile`       | ✓       | ✓                     | **Sama** |                                                        |
| `tax_types`         | ✓       | ✓                     | **Sama** |                                                        |
| `tax_rates`         | ✓       | ✓                     | **Sama** | Nama benar `tax_rates` (bukan `tax_tariffs`)           |
| `transaction_taxes` | ✓       | ✓                     | **Sama** |                                                        |
| `withholding_slips` | ✓       | ✓                     | **Sama** | Nama benar `withholding_slips` (bukan `tax_evidences`) |
| `tax_payments`      | ✓       | ✓                     | **Sama** |                                                        |

**Tabel tidak ada di draf** (dipindah ke Usulan Tambahan di file modul):

- `tax_invoices` — tidak ada di draf, tidak ada di DATABASE-SCHEMA.md ✓

---

### Modul 7 — Konten dan Publikasi (8 tabel)

| Tabel               | Di Draf      | Di DATABASE-SCHEMA.md | Status   | Catatan |
| :------------------ | :----------- | :-------------------- | :------- | :------ |
| `post_categories`   | ✓            | ✓                     | **Sama** |         |
| `posts`             | ✓            | ✓                     | **Sama** |         |
| `tags`              | ✓            | ✓                     | **Sama** |         |
| `post_tags`         | ✓            | ✓                     | **Sama** |         |
| `galleries`         | ✓ (opsional) | ✓ (opsional)          | **Sama** |         |
| `gallery_items`     | ✓ (opsional) | ✓ (opsional)          | **Sama** |         |
| `contact_messages`  | ✓            | ✓                     | **Sama** |         |
| `published_reports` | ✓            | ✓                     | **Sama** |         |

---

### Modul 8 — Sistem (5 tabel)

| Tabel              | Di Draf | Di DATABASE-SCHEMA.md | Status     | Catatan                                                 |
| :----------------- | :------ | :-------------------- | :--------- | :------------------------------------------------------ |
| `backup_schedules` | ✓       | ✓                     | **Sama**   | Kolom `destination` enum LOCAL, S3 sudah benar          |
| `backup_jobs`      | ✓       | ✓                     | **Diubah** | 4 kolom ditambah + 1 nilai enum ditambah (lihat detail) |
| `restore_events`   | ✓       | ✓                     | **Sama**   |                                                         |
| `job_locks`        | ✓       | ✓                     | **Sama**   |                                                         |
| `download_tokens`  | ✓       | ✓                     | **Sama**   |                                                         |

**Detail penyimpangan `backup_jobs`**:

| Item               | Di Draf                        | Di DATABASE-SCHEMA.md                          | Status                  | Alasan / Dampak                                                                                                          |
| :----------------- | :----------------------------- | :--------------------------------------------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `trigger` enum     | MANUAL, SCHEDULED, PRE_RESTORE | MANUAL, SCHEDULED, PRE_RESTORE, **PRE_DEPLOY** | **Ditambah arsitektur** | `PRE_DEPLOY` ditambahkan untuk backup otomatis sebelum deploy. Lihat ADR-009. **PERLU KONFIRMASI pemilik.**              |
| `postgres_version` | Tidak ada                      | ✓ (ada)                                        | **Ditambah arsitektur** | Mencatat versi PostgreSQL saat backup untuk validasi restore. Lihat ADR-009. **PERLU KONFIRMASI pemilik.**               |
| `schema_version`   | Tidak ada                      | ✓ (ada)                                        | **Ditambah arsitektur** | Mencatat nama migrasi Prisma terakhir untuk validasi kompatibilitas schema. Lihat ADR-009. **PERLU KONFIRMASI pemilik.** |
| `app_version`      | Tidak ada                      | ✓ (ada)                                        | **Ditambah arsitektur** | Mencatat versi rilis atau git SHA untuk korelasi restore. Lihat ADR-009. **PERLU KONFIRMASI pemilik.**                   |

---

## Koreksi Bahasa Kepatuhan Hukum

| Lokasi                          | Teks Lama                                                 | Teks Baru                                                                  | Status        |
| :------------------------------ | :-------------------------------------------------------- | :------------------------------------------------------------------------- | :------------ |
| `DATABASE-SCHEMA.md` baris 1067 | "Perlindungan NIK Anggota (Kepatuhan UU PDP No. 27/2022)" | "Perlindungan NIK Anggota (rujukan, PERLU VERIFIKASI: UU PDP No. 27/2022)" | **Dikoreksi** |

---

## Kesimpulan dan Tindakan yang Diperlukan

1. **Konfirmasi 4 kolom tambahan di `backup_jobs`** — `postgres_version`, `schema_version`, `app_version`, dan nilai enum `PRE_DEPLOY` pada `trigger` adalah tambahan arsitektur yang belum ada di draf pemilik. Jika pemilik menyetujui, tambahkan ke draf resmi. Jika tidak, hapus dari desain.
2. **Semua tabel dan kolom draf sudah ada** — tidak ada yang hilang dari desain saat ini.
3. **Usulan tabel di luar 70 tabel** (`legal_documents`, `letterheads`, `media_tags`, `media_asset_tags`, `member_id_cards`, `bank_reconciliations`, `recurring_transactions`, `asset_inventories`, `depreciation_schedules`, `closing_entries`, `tax_invoices`) sudah dipindah ke bagian "Usulan Tambahan, MENUNGGU PERSETUJUAN" di file modul masing-masing.

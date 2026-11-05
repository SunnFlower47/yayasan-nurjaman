# 14-traceability.md — Tiga Matriks Keterlacakan Skema Basis Data

> **Status Dokumen**: Wajib Dipatuhi (Normatif & Mengikat)  
> **Klasifikasi**: Matriks Keterlacakan Sistem, Keamanan & Akuntansi  
> **Lokasi Berkas**: `docs/database/14-traceability.md`

Dokumen ini memetakan keterlacakan dua arah: fitur MASTER-PLAN ke tabel, kontrol SECURITY.md ke mekanisme database, serta invarian akuntansi WORKING-RULES ke penegakan teknis dan metode ujinya.

---

## 1. Matriks 1: Fitur MASTER-PLAN ke Entitas Tabel Basis Data

| Fase MASTER-PLAN              | Fitur Domain Utama                                                                   | Entitas Tabel Skema Terkait                                                                                                                                                                                                                                                                                                                                                                          |
| :---------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 1: Identitas & Akses** | Autentikasi, 2FA TOTP, kontrol sesi, RBAC multi-peran, jejak audit                   | `users`, `sessions`, `two_factor_secrets`, `two_factor_recovery_codes`, `password_reset_tokens`, `rate_limit_counters`, `roles`, `permissions`, `role_permissions`, `user_roles`, `audit_logs`, `security_events`                                                                                                                                                                                    |
| **Fase 2: Profil & Media**    | Identitas legalitas SK Kemenkumham, kop surat, aset media, pengaturan, nomor gapless | `media_assets`, `foundation_profile`, `foundation_missions`, `foundation_social_links`, `app_settings`, `report_signatories`, `number_sequences`                                                                                                                                                                                                                                                     |
| **Fase 3: Anggota & KTA**     | Direktori anggota, enkripsi NIK, mutasi jabatan pengurus, KTA berfoto, iuran, impor  | `members`, `member_positions`, `member_position_history`, `member_dues`, `member_import_batches`, `member_import_errors`                                                                                                                                                                                                                                                                             |
| **Fase 4: Keuangan ISAK 35**  | Bagan akun (COA), kas/bank, transaksi, jurnal ganda seimbang, dana terikat, approval | `fiscal_years`, `accounting_periods`, `period_status_log`, `chart_of_accounts`, `cash_bank_accounts`, `parties`, `transaction_categories`, `financial_transactions`, `transaction_attachments`, `journal_entries`, `journal_lines`, `restricted_funds`, `restriction_releases`, `in_kind_donations`, `budget_versions`, `budget_lines`, `approval_policies`, `approval_requests`, `approval_actions` |
| **Fase 5: Proyek Kegiatan**   | Program sosial Purwakarta, termin kerja, kabar kemajuan, dokumen, relawan panitia    | `project_types`, `projects`, `project_milestones`, `project_updates`, `project_files`, `project_funding_sources`, `project_members`                                                                                                                                                                                                                                                                  |
| **Fase 6: Perpajakan**        | Profil pajak, master tarif berversi tanggal, snapshot transaksi, bukti potong, NTPN  | `tax_profile`, `tax_types`, `tax_rates`, `transaction_taxes`, `withholding_slips`, `tax_payments`                                                                                                                                                                                                                                                                                                    |
| **Fase 7–9: Konten & Portal** | Warta berita, tag topik, galeri album, formulir pesan, transparansi publik           | `post_categories`, `posts`, `tags`, `post_tags`, `galleries`, `gallery_items`, `contact_messages`, `published_reports`                                                                                                                                                                                                                                                                               |
| **Fase 8: Sistem & Backup**   | Penjadwalan backup, pencatatan versi, replikasi offsite S3, job lock, download token | `backup_schedules`, `backup_jobs`, `restore_events`, `job_locks`, `download_tokens`                                                                                                                                                                                                                                                                                                                  |

---

## 2. Matriks 2: Kontrol Keamanan SECURITY.md ke Mekanisme Database

| Kontrol SECURITY.md                | Ancaman / Risiko OWASP ASVS                         | Entitas Terkait                                            | Mekanisme Penegakan Teknis Basis Data                                                                  |
| :--------------------------------- | :-------------------------------------------------- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Enkripsi Data PII at Rest**      | Eksfiltrasi database, kebocoran NIK & rekening      | `members.nik_enc`, `cash_bank_accounts.account_number_enc` | Enkripsi aplikasi AES-256-GCM (`bytea`) via Key Ring (`key_id`). Dekripsi hanya di memori server.      |
| **Pencarian NIK Tanpa Dekripsi**   | Kueri lambat, memory dump exposure                  | `members.nik_blind_index`                                  | Hash HMAC-SHA256 ber-kunci rahasia terpisah (`BLIND_INDEX_SECRET`) dengan indeks parsial unik.         |
| **Anti-Brute Force Login**         | Serangan credential stuffing                        | `rate_limit_counters`                                      | Penyimpanan hit counter sliding window per-kunci di basis data, tahan restart container.               |
| **Integritas Audit Nirubah**       | Manipulasi jejak audit oleh penyerang / admin nakal | `audit_logs`, `security_events`                            | Append-only. Hak `UPDATE` dan `DELETE` dicabut mutlak dari role aplikasi (`REVOKE UPDATE, DELETE`).    |
| **Anti-Tampering Jurnal POSTED**   | Pemalsuan buku besar akuntansi                      | `journal_entries`, `journal_lines`                         | Trigger PostgreSQL menolak mutlak `UPDATE` dan `DELETE` saat berstatus `POSTED`.                       |
| **Pencegahan Akses File Sensitif** | IDOR pada kuitansi kas & scan KTA                   | `media_assets`, `transaction_attachments`                  | Kolom `visibility = PRIVATE`. Tidak ada direct URL; disajikan via token sementara (`download_tokens`). |
| **Pemisahan Role Database**        | Eskalasi hak akses runtime ke skema DDL             | Seluruh skema database                                     | Pemisahan role: `db_migrator` (khusus migrasi sekali jalan) vs `db_app` (DML runtime, `NO DDL`).       |

---

## 3. Matriks 3: Invarian Akuntansi WORKING-RULES Bagian F ke Penegakan & Cara Uji

| Invarian Akuntansi                          | Landasan Aturan Teknis                                                              | Mekanisme Penegakan Basis Data                                                                                                  | Metode & Kasus Uji Verifikasi                                                                                                             |
| :------------------------------------------ | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Keseimbangan Sakral Debit = Kredit**   | Total debit wajib persis sama dengan total kredit pada setiap jurnal.               | Constraint Trigger Deferred pada `journal_lines`: memverifikasi `SUM(debit) = SUM(credit)` sebelum commit saat status `POSTED`. | Sisipkan jurnal dengan debit 10.000 dan kredit 9.000. **Hasil Uji**: Transaksi ditolak dengan error `journal_imbalance`.                  |
| **2. Larangan Mutasi Jurnal POSTED**        | Jurnal yang sudah diposting haram diedit atau dihapus fisik.                        | Trigger `BEFORE UPDATE OR DELETE` pada `journal_entries` dan `journal_lines` menolak jika `status = 'POSTED'`.                  | Eksekusi `UPDATE journal_entries SET description = 'x' WHERE status = 'POSTED'`. **Hasil Uji**: Ditolak error `posted_journal_immutable`. |
| **3. Larangan Posting ke Periode Tertutup** | Transaksi tidak boleh dicatat pada buku bulan yang sudah ditutup.                   | Trigger `BEFORE INSERT OR UPDATE` memverifikasi `accounting_periods.status != 'CLOSED'`.                                        | Sisipkan jurnal pada periode berstatus `CLOSED`. **Hasil Uji**: Ditolak error `accounting_period_closed`.                                 |
| **4. Tarif Pajak Tanpa Tumpang Tindih**     | Satu jenis pajak tidak boleh memiliki lebih dari satu tarif pada tanggal yang sama. | Constraint `EXCLUDE USING gist` pada `tax_rates` dengan tipe `daterange(effective_from, effective_to)`.                         | Sisipkan tarif baru dengan rentang tanggal yang bertabrakan dengan tarif aktif. **Hasil Uji**: Ditolak error exclusion constraint.        |
| **5. Saldo Dana Terikat Non-Statis**        | Saldo dana terikat dilarang disimpan sebagai angka statis di tabel master.          | Dihitung runtime dari agregasi `journal_lines WHERE restricted_fund_id = ...`.                                                  | Kueri perbandingan antara saldo laporan dan total kumulatif baris jurnal. **Hasil Uji**: Deviasi selalu 0.                                |

---

## 4. Keterlacakan Versi & Validasi Pre-Restore (`backup_jobs`)

Model data cadangan mencatat 3 pilar versi: `postgres_version`, `schema_version`, dan `app_version` (disahkan pemilik). Validasi pra-pemulihan menolak restore jika:

1. Versi PostgreSQL target < `postgres_version` cadangan (mencegah forward incompatibility).
2. Skema target belum memiliki migrasi `schema_version` cadangan.
3. Key ring target tidak memiliki `key_id` yang sesuai atau `BLIND_INDEX_SECRET` berbeda.
4. Snapshot otomatis `pre_restore_backup_id` gagal dieksekusi.

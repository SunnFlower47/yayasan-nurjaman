# Modul 4 — Keuangan Inti dan Akuntansi ISAK 35 (Fase 4)

_Bagian dari [Spesifikasi Database](./00-README.md) · 19 tabel_

> Seluruh pencatatan menggunakan jurnal ganda (_double-entry_) dengan aturan yang ditegakkan di level database.

---

### fiscal_years

| Kolom        | Tipe        | Null  | Keterangan                   |
| :----------- | :---------- | :---- | :--------------------------- |
| `code`       | text        | Tidak | Unik, misal: "2026"          |
| `start_date` | date        | Tidak | Tanggal awal tahun buku      |
| `end_date`   | date        | Tidak | CHECK end_date > start_date  |
| `status`     | enum        | Tidak | OPEN, CLOSED                 |
| `closed_at`  | timestamptz | Ya    | Waktu penutupan buku tahunan |
| `closed_by`  | uuid        | Ya    | FK → users                   |

_Catatan: EXCLUDE constraint agar rentang tahun buku tidak tumpang tindih._

### accounting_periods

| Kolom            | Tipe        | Null  | Keterangan               |
| :--------------- | :---------- | :---- | :----------------------- |
| `fiscal_year_id` | uuid        | Tidak | FK → fiscal_years        |
| `period_no`      | smallint    | Tidak | 1 sampai 12 (bulan buku) |
| `start_date`     | date        | Tidak | Awal bulan               |
| `end_date`       | date        | Tidak | Akhir bulan              |
| `status`         | enum        | Tidak | OPEN, CLOSED             |
| `closed_at`      | timestamptz | Ya    | Waktu tutup buku periode |
| `closed_by`      | uuid        | Ya    | FK → users               |

_Catatan: UQ (fiscal_year_id, period_no). Transaksi jurnal pada periode CLOSED ditolak mutlak._

### period_status_log

| Kolom          | Tipe        | Null  | Keterangan                                   |
| :------------- | :---------- | :---- | :------------------------------------------- |
| `period_id`    | uuid        | Tidak | FK → accounting_periods                      |
| `action`       | enum        | Tidak | CLOSE, REOPEN                                |
| `reason`       | text        | Ya    | Alasan pembukaan kembali (wajib saat REOPEN) |
| `performed_by` | uuid        | Tidak | FK → users                                   |
| `performed_at` | timestamptz | Tidak | Waktu aksi                                   |

_Catatan: Append-only._

### chart_of_accounts

| Kolom                | Tipe    | Null  | Keterangan                                                |
| :------------------- | :------ | :---- | :-------------------------------------------------------- |
| `code`               | text    | Tidak | Unik, nomor akun. Terkunci setelah akun dipakai           |
| `name`               | text    | Tidak | Nama akun                                                 |
| `type`               | enum    | Tidak | ASSET, LIABILITY, NET_ASSET, REVENUE, EXPENSE             |
| `normal_balance`     | enum    | Tidak | DEBIT, CREDIT                                             |
| `parent_id`          | uuid    | Ya    | FK → chart_of_accounts (induk hierarki)                   |
| `is_postable`        | boolean | Tidak | Hanya akun daun yang boleh diposting                      |
| `is_cash_bank`       | boolean | Tidak | Penanda akun kas atau setara kas                          |
| `cash_flow_category` | enum    | Ya    | OPERATING, INVESTING, FINANCING. **PERLU VERIFIKASI**     |
| `expense_function`   | enum    | Ya    | PROGRAM, GENERAL_ADMIN, FUNDRAISING. **PERLU VERIFIKASI** |
| `is_system`          | boolean | Tidak | Akun bawaan sistem yang tidak boleh dihapus               |
| `is_active`          | boolean | Tidak | Status keaktifan akun                                     |
| `notes`              | text    | Ya    | Penjelasan peruntukan akun                                |

### cash_bank_accounts

| Kolom                 | Tipe    | Null  | Keterangan                                   |
| :-------------------- | :------ | :---- | :------------------------------------------- |
| `account_id`          | uuid    | Tidak | FK → chart_of_accounts, unik                 |
| `name`                | text    | Tidak | Nama rekening / kas kasir                    |
| `kind`                | enum    | Tidak | CASH, BANK                                   |
| `bank_name`           | text    | Ya    | Nama bank (BCA, Mandiri, BSI, dll.)          |
| `account_number_enc`  | bytea   | Ya    | [enc] Nomor rekening bank terenkripsi        |
| `account_number_mask` | text    | Ya    | Nomor rekening tersamar (misal `******7890`) |
| `holder_name`         | text    | Ya    | Nama pemilik rekening                        |
| `is_active`           | boolean | Tidak | Status aktif                                 |

### parties

| Kolom            | Tipe    | Null  | Keterangan                                   |
| :--------------- | :------ | :---- | :------------------------------------------- |
| `name`           | text    | Tidak | Nama pihak ketiga (rekanan/donatur/penerima) |
| `kind`           | enum    | Tidak | PERSON, ORGANIZATION                         |
| `is_donor`       | boolean | Tidak | Entitas donatur                              |
| `is_vendor`      | boolean | Tidak | Entitas pemasok/rekanan                      |
| `is_beneficiary` | boolean | Tidak | Entitas penerima manfaat program             |
| `tax_id_enc`     | bytea   | Ya    | [enc] NPWP atau NIK terenkripsi              |
| `tax_id_mask`    | text    | Ya    | Penyamaran NPWP/NIK                          |
| `address`        | text    | Ya    | Alamat                                       |
| `phone`          | text    | Ya    | Nomor kontak                                 |
| `email`          | text    | Ya    | Surel                                        |
| `notes`          | text    | Ya    | Catatan (SD)                                 |

### transaction_categories

| Kolom                     | Tipe    | Null  | Keterangan                              |
| :------------------------ | :------ | :---- | :-------------------------------------- |
| `type`                    | enum    | Tidak | INCOME, EXPENSE                         |
| `name`                    | text    | Tidak | Nama kategori transaksi operasional     |
| `account_id`              | uuid    | Tidak | FK → chart_of_accounts (Akun lawan kas) |
| `default_net_asset_class` | enum    | Ya    | WITHOUT_RESTRICTION, WITH_RESTRICTION   |
| `sort_order`              | int     | Tidak | Urutan tampilan                         |
| `is_active`               | boolean | Tidak | Status aktif                            |

### financial_transactions

| Kolom                  | Tipe        | Null  | Keterangan                                                |
| :--------------------- | :---------- | :---- | :-------------------------------------------------------- |
| `txn_no`               | text        | Ya    | Nomor bukti transaksi saat POSTED (unik parsial)          |
| `type`                 | enum        | Tidak | INCOME, EXPENSE, TRANSFER                                 |
| `txn_date`             | date        | Tidak | Tanggal transaksi                                         |
| `cash_bank_account_id` | uuid        | Tidak | FK → cash_bank_accounts                                   |
| `counter_account_id`   | uuid        | Ya    | FK → cash_bank_accounts (hanya TRANSFER)                  |
| `category_id`          | uuid        | Ya    | FK → transaction_categories                               |
| `party_id`             | uuid        | Ya    | FK → parties                                              |
| `project_id`           | uuid        | Ya    | FK → projects                                             |
| `restricted_fund_id`   | uuid        | Ya    | FK → restricted_funds                                     |
| `net_asset_class`      | enum        | Ya    | WITHOUT_RESTRICTION, WITH_RESTRICTION                     |
| `amount`               | bigint      | Tidak | CHECK amount > 0                                          |
| `description`          | text        | Tidak | Rincian keperluan transaksi                               |
| `reference_no`         | text        | Ya    | Nomor nota / kuitansi eksternal                           |
| `status`               | enum        | Tidak | DRAFT, PENDING_APPROVAL, APPROVED, POSTED, REJECTED, VOID |
| `journal_entry_id`     | uuid        | Ya    | FK → journal_entries, unik                                |
| `created_by`           | uuid        | Tidak | FK → users                                                |
| `posted_at`            | timestamptz | Ya    | Waktu pembukuan ke jurnal                                 |
| `posted_by`            | uuid        | Ya    | FK → users                                                |
| `void_reason`          | text        | Ya    | Alasan pembatalan (wajib saat VOID). (v)                  |

### transaction_attachments

| Kolom            | Tipe | Null  | Keterangan                                    |
| :--------------- | :--- | :---- | :-------------------------------------------- |
| `transaction_id` | uuid | Tidak | FK → financial_transactions                   |
| `media_asset_id` | uuid | Tidak | FK → media_assets (visibilitas wajib PRIVATE) |
| `description`    | text | Ya    | Keterangan lampiran kuitansi/struk            |
| `sort_order`     | int  | Tidak | Urutan tampilan                               |

_Catatan: UQ (transaction_id, media_asset_id)._

### journal_entries

| Kolom               | Tipe        | Null  | Keterangan                                                            |
| :------------------ | :---------- | :---- | :-------------------------------------------------------------------- |
| `entry_no`          | text        | Ya    | Nomor jurnal umum saat POSTED (unik parsial)                          |
| `entry_date`        | date        | Tidak | Tanggal pencatatan buku                                               |
| `period_id`         | uuid        | Tidak | FK → accounting_periods                                               |
| `source`            | enum        | Tidak | MANUAL, TRANSACTION, REVERSAL, CLOSING, OPENING, RELEASE, TAX_PAYMENT |
| `description`       | text        | Tidak | Keterangan ringkas jurnal                                             |
| `status`            | enum        | Tidak | DRAFT, POSTED, VOID                                                   |
| `reverses_entry_id` | uuid        | Ya    | FK → journal_entries (self), unik                                     |
| `posted_at`         | timestamptz | Ya    | Stempel waktu posting                                                 |
| `posted_by`         | uuid        | Ya    | FK → users                                                            |
| `created_by`        | uuid        | Tidak | FK → users. (v)                                                       |

### journal_lines

| Kolom                | Tipe     | Null  | Keterangan                                   |
| :------------------- | :------- | :---- | :------------------------------------------- |
| `entry_id`           | uuid     | Tidak | FK → journal_entries                         |
| `line_no`            | smallint | Tidak | Urutan baris dalam jurnal                    |
| `account_id`         | uuid     | Tidak | FK → chart_of_accounts                       |
| `debit`              | bigint   | Tidak | Default 0                                    |
| `credit`             | bigint   | Tidak | Default 0                                    |
| `memo`               | text     | Ya    | Catatan detail per baris akun                |
| `net_asset_class`    | enum     | Ya    | Wajib untuk akun REVENUE, EXPENSE, NET_ASSET |
| `restricted_fund_id` | uuid     | Ya    | FK → restricted_funds                        |
| `project_id`         | uuid     | Ya    | FK → projects                                |
| `party_id`           | uuid     | Ya    | FK → parties                                 |

_Catatan: UQ (entry_id, line_no). Total debit = total kredit saat POSTED dijaga trigger deferred. Tidak boleh UPDATE/DELETE saat POSTED._

### restricted_funds

| Kolom              | Tipe   | Null  | Keterangan                              |
| :----------------- | :----- | :---- | :-------------------------------------- |
| `code`             | text   | Tidak | Unik, kode dana terikat                 |
| `name`             | text   | Tidak | Nama dana terikat                       |
| `purpose`          | text   | Tidak | Batasan atau tujuan khusus              |
| `donor_party_id`   | uuid   | Ya    | FK → parties                            |
| `project_id`       | uuid   | Ya    | FK → projects                           |
| `restriction_type` | enum   | Tidak | PURPOSE, TIME, PURPOSE_AND_TIME         |
| `expires_on`       | date   | Ya    | Batas waktu berlakunya pembatasan       |
| `target_amount`    | bigint | Ya    | Target nominal dana                     |
| `status`           | enum   | Tidak | ACTIVE, FULLY_RELEASED, EXPIRED, CLOSED |
| `notes`            | text   | Ya    | Catatan akad dana                       |

_Catatan: Saldo dana dihitung dari agregasi baris journal_lines, bukan disimpan statis._

### restriction_releases

| Kolom                | Tipe   | Null  | Keterangan                         |
| :------------------- | :----- | :---- | :--------------------------------- |
| `restricted_fund_id` | uuid   | Tidak | FK → restricted_funds              |
| `release_date`       | date   | Tidak | Tanggal pembebasan pembatasan dana |
| `amount`             | bigint | Tidak | CHECK amount > 0                   |
| `reason`             | enum   | Tidak | PURPOSE_MET, TIME_EXPIRED, OTHER   |
| `journal_entry_id`   | uuid   | Tidak | FK → journal_entries, unik         |
| `transaction_id`     | uuid   | Ya    | FK → financial_transactions        |
| `notes`              | text   | Ya    | Keterangan pembebasan              |
| `created_by`         | uuid   | Tidak | FK → users                         |

### in_kind_donations

| Kolom                | Tipe          | Null  | Keterangan                                 |
| :------------------- | :------------ | :---- | :----------------------------------------- |
| `donation_date`      | date          | Tidak | Tanggal penerimaan barang/jasa             |
| `donor_party_id`     | uuid          | Ya    | FK → parties                               |
| `description`        | text          | Tidak | Rincian barang donasi non-kas              |
| `quantity`           | numeric(14,3) | Ya    | Jumlah fisik                               |
| `unit`               | text          | Ya    | Satuan (dus, kg, unit, rim)                |
| `estimated_value`    | bigint        | Tidak | Nilai wajar estimasi. **PERLU VERIFIKASI** |
| `valuation_basis`    | text          | Ya    | Dasar penentuan nilai wajar                |
| `net_asset_class`    | enum          | Tidak | WITHOUT_RESTRICTION, WITH_RESTRICTION      |
| `project_id`         | uuid          | Ya    | FK → projects                              |
| `restricted_fund_id` | uuid          | Ya    | FK → restricted_funds                      |
| `is_recognized`      | boolean       | Tidak | Diakui di neraca atau diungkapkan di CaLK  |
| `journal_entry_id`   | uuid          | Ya    | FK → journal_entries, unik                 |
| `created_by`         | uuid          | Tidak | FK → users                                 |

### budget_versions

| Kolom            | Tipe        | Null  | Keterangan                                                  |
| :--------------- | :---------- | :---- | :---------------------------------------------------------- |
| `fiscal_year_id` | uuid        | Tidak | FK → fiscal_years                                           |
| `scope`          | enum        | Tidak | ORGANIZATION, PROJECT                                       |
| `project_id`     | uuid        | Ya    | FK → projects                                               |
| `version_no`     | int         | Tidak | Nomor revisi anggaran                                       |
| `name`           | text        | Tidak | Nama pagu anggaran                                          |
| `status`         | enum        | Tidak | DRAFT, APPROVED, SUPERSEDED                                 |
| `approved_by`    | uuid        | Ya    | FK → users                                                  |
| `approved_at`    | timestamptz | Ya    | Waktu persetujuan anggaran                                  |
| `notes`          | text        | Ya    | Catatan revisi. UQ (fiscal_year_id, project_id, version_no) |

### budget_lines

| Kolom               | Tipe     | Null  | Keterangan                                                           |
| :------------------ | :------- | :---- | :------------------------------------------------------------------- |
| `budget_version_id` | uuid     | Tidak | FK → budget_versions                                                 |
| `account_id`        | uuid     | Tidak | FK → chart_of_accounts                                               |
| `period_no`         | smallint | Ya    | 1 sampai 12 (null = pagu setahun)                                    |
| `amount`            | bigint   | Tidak | CHECK amount ≥ 0                                                     |
| `notes`             | text     | Ya    | Rincian alokasi biaya. UQ (budget_version_id, account_id, period_no) |

### approval_policies

| Kolom                  | Tipe     | Null  | Keterangan                                             |
| :--------------------- | :------- | :---- | :----------------------------------------------------- |
| `name`                 | text     | Tidak | Nama kebijakan persetujuan                             |
| `applies_to`           | enum     | Tidak | INCOME, EXPENSE, TRANSFER, MANUAL_JOURNAL, VOID        |
| `min_amount`           | bigint   | Tidak | Ambang batas minimal nominal (default 0)               |
| `max_amount`           | bigint   | Ya    | Ambang batas maksimal nominal                          |
| `required_role_id`     | uuid     | Tidak | FK → roles (peran penyetuju berwenang)                 |
| `steps_required`       | smallint | Tidak | Jumlah tahapan persetujuan                             |
| `forbid_self_approval` | boolean  | Tidak | Larangan persetujuan permohonan sendiri (default true) |
| `priority`             | int      | Tidak | Prioritas evaluasi kebijakan                           |
| `is_active`            | boolean  | Tidak | Status aktif                                           |

### approval_requests

| Kolom              | Tipe        | Null  | Keterangan                             |
| :----------------- | :---------- | :---- | :------------------------------------- |
| `transaction_id`   | uuid        | Ya    | FK → financial_transactions            |
| `journal_entry_id` | uuid        | Ya    | FK → journal_entries                   |
| `policy_id`        | uuid        | Tidak | FK → approval_policies                 |
| `requested_by`     | uuid        | Tidak | FK → users                             |
| `requested_at`     | timestamptz | Tidak | Waktu pengajuan persetujuan            |
| `status`           | enum        | Tidak | PENDING, APPROVED, REJECTED, CANCELLED |
| `decided_at`       | timestamptz | Ya    | Waktu penetapan keputusan              |

_Catatan: CHECK tepat satu dari transaction_id atau journal_entry_id yang terisi._

### approval_actions

| Kolom           | Tipe        | Null  | Keterangan                                                           |
| :-------------- | :---------- | :---- | :------------------------------------------------------------------- |
| `request_id`    | uuid        | Tidak | FK → approval_requests                                               |
| `step_no`       | smallint    | Tidak | Nomor tahapan                                                        |
| `actor_user_id` | uuid        | Tidak | FK → users                                                           |
| `decision`      | enum        | Tidak | APPROVE, REJECT                                                      |
| `comment`       | text        | Ya    | Catatan alasan keputusan                                             |
| `decided_at`    | timestamptz | Tidak | Waktu pengambilan keputusan. UQ (request_id, step_no, actor_user_id) |

---

## Usulan Tambahan, MENUNGGU PERSETUJUAN

Tabel-tabel berikut **tidak ada dalam draf 70 tabel pemilik** dan diusulkan oleh tim arsitektur. Status: menunggu persetujuan tertulis pemilik.

### (Usulan) bank_reconciliations dan bank_reconciliation_lines

Rekonsiliasi saldo buku dengan mutasi rekening koran bank.

- **Alasan ditunda**: Rekonsiliasi bank eksplisit di luar lingkup versi ini.
- **Status**: MENUNGGU PERSETUJUAN pemilik.

### (Usulan) recurring_transactions

Template transaksi berulang untuk pengeluaran/pendapatan periodik.

- **Status**: MENUNGGU PERSETUJUAN pemilik.

### (Usulan) asset_inventories dan depreciation_schedules

Inventaris aset tetap yayasan dan perhitungan jadwal penyusutan.

- **Alasan ditunda**: Aset tetap eksplisit di luar lingkup versi ini.
- **Status**: MENUNGGU PERSETUJUAN pemilik.

### (Usulan) closing_entries

Template pencatatan jurnal penutup tahunan otomatis.

- **Status**: MENUNGGU PERSETUJUAN pemilik.

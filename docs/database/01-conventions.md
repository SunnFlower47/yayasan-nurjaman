# 01-conventions.md — Konvensi Teknis Pemodelan Basis Data

> **Status Dokumen**: Wajib Dipatuhi (Normatif & Mengikat)  
> **Klasifikasi**: Standar Rekayasa Basis Data (PostgreSQL 17 & Prisma ORM)  
> **Lokasi Berkas**: `docs/database/01-conventions.md`

Dokumen ini mendefinisikan aturan baku pemodelan skema, penamaan, integritas referensial, indeks, klasifikasi data sensitif, dan pemisahan hak akses role database pada sistem Yayasan Nurjaman Bongas Purwakarta.

---

## 1. Konvensi Penamaan (_Naming Conventions_)

1. **Tabel**: Huruf kecil jamak dengan garis bawah (`snake_case`, _plural_). Contoh: `members`, `journal_entries`, `tax_rates`.
2. **Kolom**: Huruf kecil dengan garis bawah (`snake_case`, _singular_).
3. **Kunci Asing (FK)**: Format `<target_singular>_id`. Contoh: `user_id`, `party_id`, `project_id`. Jika memiliki konteks ganda: `pic_member_id`, `donor_party_id`, `payable_account_id`.
4. **Kolom Boolean**: Diawali kata kerja kondisi `is_` atau `has_` atau `show_`. Contoh: `is_active`, `is_system`, `show_public`, `has_attachments`.
5. **Kolom Waktu & Tanggal**:
   - Jejak audit sistem (`timestamptz`, UTC): Berakhiran `_at`. Contoh: `created_at`, `updated_at`, `posted_at`, `closed_at`.
   - Tanggal bisnis (`date`): Berakhiran `_date` atau `_on`. Contoh: `txn_date`, `birth_date`, `joined_on`, `expires_on`.
6. **Kolom Kriptografi & Data Sensitif**:
   - Kolom terenkripsi: Berakhiran `_enc` dengan tipe `bytea`. Contoh: `nik_enc`, `account_number_enc`, `tax_id_enc`.
   - Kolom blind index / hash: Berakhiran `_blind_index` atau `_hash`. Contoh: `nik_blind_index`, `password_hash`, `token_hash`.
   - Kolom tampilan tersamar: Berakhiran `_mask`. Contoh: `tax_id_mask`, `account_number_mask`.

---

## 2. Kolom Bawaan Wajib (_Standard Columns_)

Kecuali dinyatakan eksplisit sebagai tabel _singleton_, _append-only_, atau _PK komposit_, setiap tabel WAJIB memiliki:

```sql
id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(), -- Direkomendasikan UUIDv7
created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
```

- **UUIDv7**: Menggunakan UUID berbasis waktu (_time-ordered_) guna mencegah fragmentasi indeks B-Tree pada PostgreSQL.
- **Append-Only Table**: Tabel riwayat mutasi/log (`audit_logs`, `security_events`, `period_status_log`, `approval_actions`) HANYA memiliki `occurred_at` / `performed_at` dan DILARANG memiliki `updated_at`.

---

## 3. Integritas Referensial & Kunci Asing (_Foreign Keys_)

1. **Eksplisit `ON DELETE`**: Seluruh foreign key WAJIB mendeklarasikan perilaku penghapusan secara eksplisit:
   - `ON DELETE RESTRICT` (Default): Melindungi data induk yang masih memiliki relasi transaksi (misal: dilarang menghapus `chart_of_accounts` jika sudah ada di `journal_lines`).
   - `ON DELETE CASCADE`: HANYA diizinkan untuk entitas anak milik penuh (_owned composition_) seperti: `journal_lines` terhadap `journal_entries`, `project_milestones` terhadap `projects`, `session` terhadap `user`.
2. **Indeks Otomatis pada FK**: Setiap kolom foreign key WAJIB diberi indeks database guna mencegah _full table scan_ saat join dan cascade lock.

---

## 4. Strategi Pengindeksan Database

1. **Indeks B-Tree Standar**: Diterapkan pada seluruh kolom FK, kode unik, dan kolom pencarian persis.
2. **Indeks Parsial (_Partial Index_)**: Wajib digunakan pada tabel yang menerapkan _Soft Delete_ (`WHERE deleted_at IS NULL`) agar batasan keunikan (`UNIQUE`) tidak memblokir registrasi ulang entitas yang sudah dihapus.
3. **Indeks Komposit (_Compound Index_)**: Urutan kolom mengikuti aturan selektivitas tertinggi di depan, atau pola filter + sort. Contoh: `audit_logs (entity_type, entity_id)` dan `(actor_user_id, occurred_at)`.
4. **Indeks Rentang Waktu (GiST)**: Digunakan bersama ekstensi `btree_gist` untuk klausul `EXCLUDE USING gist` guna mencegah tumpang tindih periode:
   - Masa berlaku tarif pajak: `tax_rates (tax_type_id WITH =, daterange(effective_from, effective_to) WITH &&)`.
   - Periode tahun buku: `accounting_periods`.
   - Riwayat jabatan pengurus: `member_position_history`.

---

## 5. Tipe Data Teks, JSONB & Enum vs Lookup

1. **Teks**: Gunakan tipe `text` murni. Hindari `varchar(n)` arbitrer kecuali dibatasi klausul `CHECK` eksplisit.
2. **JSONB**:
   - HANYA untuk metadata fleksibel, pengaturan dinamis (`app_settings.value`), atau snapshot perubahan audit (`audit_logs.before`/`after`).
   - Seluruh payload JSONB WAJIB divalidasi oleh Zod schema di server layer aplikasi sebelum masuk database.
   - Dilarang menyimpan relasi relasional utama di dalam JSONB array.
3. **Enum vs Lookup Table**:
   - `ENUM` Database: Digunakan untuk status mesin status tetap yang melekat pada logika kode program. Contoh: `status` transaksi (`DRAFT, PENDING, APPROVED, POSTED, REJECTED, VOID`).
   - Lookup Table: Digunakan untuk data master dinamis yang dapat ditambah pengurus tanpa deploy kode. Contoh: `project_types`, `transaction_categories`, `member_positions`.

---

## 6. Klasifikasi Data & Proteksi Kolom Sensitif

| Tingkat Klasifikasi        | Kategori Data                    | Contoh Kolom                                               | Standar Pengamanan Teknis                                                |
| :------------------------- | :------------------------------- | :--------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Publik**                 | Konten situs, warta, profil umum | `posts.title`, `foundation_profile.name`                   | Terbuka untuk umum                                                       |
| **Internal**               | Dokumen operasional              | `financial_transactions.description`                       | RBAC server-side                                                         |
| **Rahasia (Confidential)** | Data keuangan detail, kontak     | `journal_lines.debit`, `members.phone`                     | Role Keuangan / Admin                                                    |
| **Terbatas ([enc])**       | Data PII sensitif, rekening      | `members.nik_enc`, `cash_bank_accounts.account_number_enc` | **AES-256-GCM** via Key Ring (`key_id`), audit log saat akses            |
| **Nir-Dekripsi ([hash])**  | Kredensial, token                | `users.password_hash`, `members.nik_blind_index`           | **Argon2id** (sandi), **HMAC-SHA256** (blind index), **SHA-256** (token) |

---

## 7. Pemisahan Hak Akses Role Database (_Least Privilege_)

Database PostgreSQL wajib mengonfigurasi minimal dua role terpisah:

1. **`db_migrator` (Role Migrasi & Skema)**:
   - Pemilik DDL (_Data Definition Language_).
   - Hak: `CREATE, ALTER, DROP, TRUNCATE` skema.
   - Hanya digunakan oleh container `migrate` sekali jalan saat deployment.
2. **`db_app` (Role Aplikasi Runtime)**:
   - Khusus DML runtime (`SELECT, INSERT, UPDATE, DELETE`).
   - Dilarang memiliki hak DDL (`NO DDL`).
   - **Pencabutan Hak Istimewa Immutability**:
     - Tabel `audit_logs`: Hak `UPDATE` dan `DELETE` **DICABUT MUTLAK** (`REVOKE UPDATE, DELETE ON audit_logs FROM db_app`).
     - Tabel `security_events`: Hak `UPDATE` dan `DELETE` **DICABUT MUTLAK**.
     - Jurnal `POSTED`: Dilindungi oleh database trigger penolak `UPDATE` dan `DELETE`.

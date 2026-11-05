# Struktur Database — Yayasan Nurjaman Bongas Purwakarta

_Draf Spesifikasi Teknis · 70 Tabel dalam 8 Modul · Panduan Pemodelan Skema Basis Data_

> **Status Dokumen**: Draf Arsitektur Terverifikasi (Belum Diimplementasikan ke Prisma)  
> **Target Implementasi**: Diterapkan bertahap per fase melalui Prisma Migration (Fase 1 s.d. 8)

---

## Cara Membaca Dokumen Ini

Setiap tabel memiliki kolom bawaan **`id`** (UUIDv7, primary key), **`created_at`** dan **`updated_at`** (`timestamptz`, UTC), kecuali ada keterangan eksplisit _append-only_, _singleton_, atau _PK komposit_.

| Notasi                 | Arti & Ketentuan Teknis                                                                                                                                                                                                                |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FK → tabel**         | Kunci asing (_Foreign key_). `ON DELETE` selalu eksplisit; bila tidak disebut berarti `RESTRICT`.                                                                                                                                      |
| **UQ**                 | Indeks / Batasan Unik (_Unique Constraint_).                                                                                                                                                                                           |
| **SD**                 | _Soft Delete_ (memiliki kolom `deleted_at timestamptz`).                                                                                                                                                                               |
| **v**                  | Kolom `version int` untuk _optimistic locking_ (mencegah _race condition_ mutasi).                                                                                                                                                     |
| **[enc]**              | Dienkripsi di level aplikasi (AES-256-GCM), disimpan sebagai `bytea` berisi key ID, nonce 12-byte, ciphertext, dan authentication tag 16-byte. Menggunakan Key Ring (`ENCRYPTION_KEYS`) untuk rotasi kunci (kunci aktif + kunci lama). |
| **[hash]**             | Hanya nilai hash satu arah yang disimpan (Argon2id untuk sandi, SHA-256 untuk token, atau HMAC-SHA256 via `BLIND_INDEX_SECRET` untuk blind index NIK). Nilai teks asli tidak pernah disimpan.                                          |
| **bigint**             | Satuan mata uang Rupiah utuh tanpa pecahan desimal. Dilarang tipe float.                                                                                                                                                               |
| **date / timestamptz** | `date` untuk tanggal bisnis; `timestamptz` untuk jejak waktu sistem (zona waktu UTC).                                                                                                                                                  |

Semua kolom FK otomatis diberi indeks database. Bagian bertanda **PERLU VERIFIKASI** bergantung pada aturan tata buku akuntansi ISAK 35 atau regulasi perpajakan yang wajib dikonfirmasi ke akuntan / konsultan pajak yayasan.

---

## 1. Identitas dan Akses (Fase 1–2)

Bentuk akhir tabel autentikasi mengikuti library auth yang disahkan.

### users

| Kolom                  | Tipe        | Null  | Keterangan                                                                                |
| :--------------------- | :---------- | :---- | :---------------------------------------------------------------------------------------- |
| `username`             | text        | Tidak | Dipakai untuk login. Unik, lowercase, 3–32 karakter (a–z, 0–9, titik, garis bawah, strip) |
| `email`                | text        | Tidak | Unik, disimpan lowercase. Untuk reset password dan notifikasi, bukan untuk login          |
| `name`                 | text        | Tidak | Nama tampilan pengguna                                                                    |
| `password_hash`        | text        | Tidak | [hash] Argon2id                                                                           |
| `status`               | enum        | Tidak | ACTIVE, DISABLED                                                                          |
| `must_change_password` | boolean     | Tidak | Default false                                                                             |
| `password_changed_at`  | timestamptz | Tidak | Waktu perubahan sandi terakhir                                                            |
| `last_login_at`        | timestamptz | Ya    | Waktu login terakhir                                                                      |
| `member_id`            | uuid        | Ya    | FK → members, unik. Menghubungkan akun login dengan data anggota                          |

_Catatan: SD, v. UQ username dan UQ email (parsial untuk yang belum dihapus). Login memakai username dan password (plus 2FA). Pesan galat login tetap generik agar username tidak bisa ditebak, dan rate limit dihitung per username dan per IP._

### sessions

| Kolom                 | Tipe        | Null  | Keterangan                                               |
| :-------------------- | :---------- | :---- | :------------------------------------------------------- |
| `user_id`             | uuid        | Tidak | FK → users, ON DELETE CASCADE                            |
| `token_hash`          | text        | Tidak | [hash], unik                                             |
| `ip`                  | inet        | Ya    | Alamat IP klien                                          |
| `user_agent`          | text        | Ya    | Peramban klien                                           |
| `last_seen_at`        | timestamptz | Tidak | Aktivitas terakhir                                       |
| `idle_expires_at`     | timestamptz | Tidak | Batas waktu tidak aktif (30 menit)                       |
| `absolute_expires_at` | timestamptz | Tidak | Batas mutlak sesi (8 jam), diindeks untuk pembersihan    |
| `reauth_at`           | timestamptz | Ya    | Waktu re-autentikasi terakhir untuk aksi berisiko tinggi |
| `revoked_at`          | timestamptz | Ya    | Waktu pencabutan sesi                                    |
| `revoked_reason`      | text        | Ya    | Alasan pencabutan (logout, ganti password, role revoked) |

### two_factor_secrets

| Kolom            | Tipe        | Null  | Keterangan                                                 |
| :--------------- | :---------- | :---- | :--------------------------------------------------------- |
| `user_id`        | uuid        | Tidak | FK → users, unik, ON DELETE CASCADE                        |
| `secret`         | bytea       | Tidak | [enc] Kunci rahasia TOTP                                   |
| `confirmed_at`   | timestamptz | Ya    | Terisi setelah verifikasi kode pertama                     |
| `last_used_step` | bigint      | Ya    | Langkah waktu TOTP terakhir yang dipakai (mencegah replay) |

### two_factor_recovery_codes

| Kolom       | Tipe        | Null  | Keterangan                        |
| :---------- | :---------- | :---- | :-------------------------------- |
| `user_id`   | uuid        | Tidak | FK → users, ON DELETE CASCADE     |
| `code_hash` | text        | Tidak | [hash] Kode cadangan sekali pakai |
| `used_at`   | timestamptz | Ya    | Waktu kode cadangan digunakan     |

### password_reset_tokens

| Kolom          | Tipe        | Null  | Keterangan                    |
| :------------- | :---------- | :---- | :---------------------------- |
| `user_id`      | uuid        | Tidak | FK → users, ON DELETE CASCADE |
| `token_hash`   | text        | Tidak | [hash], unik                  |
| `expires_at`   | timestamptz | Tidak | Berumur singkat (15–30 menit) |
| `used_at`      | timestamptz | Ya    | Sekali pakai                  |
| `requested_ip` | inet        | Ya    | IP pemohon reset              |

### rate_limit_counters

| Kolom           | Tipe        | Null  | Keterangan                                 |
| :-------------- | :---------- | :---- | :----------------------------------------- |
| `key`           | text        | Tidak | Misal `login:ip:...` atau `login:akun:...` |
| `window_start`  | timestamptz | Tidak | Awal jendela hitungan waktu                |
| `hit_count`     | int         | Tidak | Jumlah percobaan                           |
| `blocked_until` | timestamptz | Ya    | Waktu berakhir pemblokiran                 |

_Catatan: UQ (key, window_start). Tanpa FK, tahan terhadap restart server._

### roles

| Kolom         | Tipe    | Null  | Keterangan                                             |
| :------------ | :------ | :---- | :----------------------------------------------------- |
| `code`        | text    | Tidak | Unik, misal: SUPER_ADMIN, KETUA, BENDAHARA, SEKRETARIS |
| `name`        | text    | Tidak | Nama peran                                             |
| `description` | text    | Ya    | Penjelasan wewenang                                    |
| `is_system`   | boolean | Tidak | Role sistem bawaan tidak dapat dihapus                 |

### permissions

| Kolom         | Tipe | Null  | Keterangan                                             |
| :------------ | :--- | :---- | :----------------------------------------------------- |
| `code`        | text | Tidak | Unik, format modul.aksi (misal `finance.post_journal`) |
| `module`      | text | Tidak | Nama modul                                             |
| `action`      | text | Tidak | Aksi spesifik                                          |
| `description` | text | Ya    | Deskripsi izin                                         |

_Catatan: Katalog bersumber dari kode program, disinkronkan ke tabel ini._

### role_permissions

| Kolom           | Tipe | Null  | Keterangan                          |
| :-------------- | :--- | :---- | :---------------------------------- |
| `role_id`       | uuid | Tidak | FK → roles, ON DELETE CASCADE       |
| `permission_id` | uuid | Tidak | FK → permissions, ON DELETE CASCADE |

_Catatan: PK komposit (role_id, permission_id), tanpa kolom id._

### user_roles

| Kolom         | Tipe        | Null  | Keterangan                    |
| :------------ | :---------- | :---- | :---------------------------- |
| `user_id`     | uuid        | Tidak | FK → users, ON DELETE CASCADE |
| `role_id`     | uuid        | Tidak | FK → roles                    |
| `assigned_by` | uuid        | Tidak | FK → users (pelaku penugasan) |
| `assigned_at` | timestamptz | Tidak | Waktu penugasan peran         |

_Catatan: PK komposit (user_id, role_id)._

### audit_logs

| Kolom           | Tipe        | Null  | Keterangan                                  |
| :-------------- | :---------- | :---- | :------------------------------------------ |
| `occurred_at`   | timestamptz | Tidak | Stempel waktu kejadian                      |
| `actor_user_id` | uuid        | Ya    | FK → users. Null untuk aksi otomatis sistem |
| `action`        | text        | Tidak | Misal `finance.transaction.post`            |
| `entity_type`   | text        | Tidak | Nama entitas yang diubah                    |
| `entity_id`     | text        | Ya    | ID primer entitas                           |
| `before`        | jsonb       | Ya    | Nilai sebelum perubahan                     |
| `after`         | jsonb       | Ya    | Nilai sesudah perubahan                     |
| `ip`            | inet        | Ya    | Alamat IP aktor                             |
| `user_agent`    | text        | Ya    | Informasi peramban klien                    |
| `request_id`    | text        | Ya    | Pengenal penelusuran request                |
| `metadata`      | jsonb       | Ya    | Informasi tambahan                          |

_Catatan: Append-only murni, tanpa updated_at. Pengguna aplikasi tidak memiliki izin UPDATE/DELETE. Indeks: (entity_type, entity_id), (actor_user_id, occurred_at), (occurred_at)._

### security_events

| Kolom         | Tipe        | Null  | Keterangan                                                                                                                                           |
| :------------ | :---------- | :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occurred_at` | timestamptz | Tidak | Waktu kejadian                                                                                                                                       |
| `type`        | enum        | Tidak | LOGIN_SUCCESS, LOGIN_FAILED, LOCKOUT, PERMISSION_DENIED, ROLE_CHANGED, SESSION_REVOKED, TWO_FACTOR_CHANGED, BACKUP_DOWNLOADED, RESTORE_STARTED, dst. |
| `user_id`     | uuid        | Ya    | FK → users                                                                                                                                           |
| `ip`          | inet        | Ya    | Alamat IP                                                                                                                                            |
| `user_agent`  | text        | Ya    | Peramban                                                                                                                                             |
| `details`     | jsonb       | Ya    | Detail konteks (tanpa data pribadi/token)                                                                                                            |

_Catatan: Append-only._

---

## 2. Pengaturan, Profil Yayasan, dan Media (Fase 2)

### media_assets

| Kolom           | Tipe   | Null  | Keterangan                                     |
| :-------------- | :----- | :---- | :--------------------------------------------- |
| `storage_key`   | text   | Tidak | Unik, pengenal nama acak di penyimpanan berkas |
| `original_name` | text   | Tidak | Nama asli berkas                               |
| `mime`          | text   | Tidak | Divalidasi via magic bytes tanda tangan biner  |
| `size_bytes`    | bigint | Tidak | Ukuran dalam byte                              |
| `sha256`        | text   | Tidak | Checksum integritas berkas                     |
| `visibility`    | enum   | Tidak | PUBLIC, PRIVATE                                |
| `width`         | int    | Ya    | Lebar piksel (untuk gambar)                    |
| `height`        | int    | Ya    | Tinggi piksel (untuk gambar)                   |
| `alt_text`      | text   | Ya    | Teks alternatif aksesibilitas                  |
| `uploaded_by`   | uuid   | Tidak | FK → users                                     |

_Catatan: SD._

### foundation_profile

| Kolom              | Tipe     | Null  | Keterangan                                      |
| :----------------- | :------- | :---- | :---------------------------------------------- |
| `id`               | smallint | Tidak | Singleton, CHECK id = 1                         |
| `name`             | text     | Tidak | Nama resmi yayasan                              |
| `short_name`       | text     | Ya    | Nama singkat / singkatan                        |
| `tagline`          | text     | Ya    | Slogan kelembagaan                              |
| `description`      | text     | Tidak | Deskripsi profil yayasan                        |
| `history`          | text     | Ya    | Sejarah berdirinya yayasan                      |
| `vision`           | text     | Ya    | Pernyataan visi yayasan                         |
| `logo_asset_id`    | uuid     | Ya    | FK → media_assets                               |
| `favicon_asset_id` | uuid     | Ya    | FK → media_assets                               |
| `hero_asset_id`    | uuid     | Ya    | FK → media_assets                               |
| `address`          | text     | Tidak | Alamat sekretariat lengkap (Bongas, Purwakarta) |
| `map_url`          | text     | Ya    | Tautan koordinat peta Google Maps               |
| `phone`            | text     | Ya    | Nomor telepon resmi                             |
| `email`            | text     | Ya    | Email resmi lembaga                             |
| `deed_no`          | text     | Ya    | Nomor akta pendirian notaris                    |
| `deed_date`        | date     | Ya    | Tanggal akta pendirian                          |
| `decree_no`        | text     | Ya    | Nomor SK Pengesahan Kemenkumham                 |
| `decree_date`      | date     | Ya    | Tanggal SK Pengesahan Kemenkumham               |
| `letterhead_note`  | text     | Ya    | Teks tambahan kop surat resmi                   |
| `updated_by`       | uuid     | Tidak | FK → users                                      |

_Catatan: Singleton, v._

### foundation_missions

| Kolom        | Tipe    | Null  | Keterangan                 |
| :----------- | :------ | :---- | :------------------------- |
| `text`       | text    | Tidak | Satu butir pernyataan misi |
| `sort_order` | int     | Tidak | Urutan tampilan            |
| `is_active`  | boolean | Tidak | Status aktif               |

### foundation_social_links

| Kolom        | Tipe | Null  | Keterangan                                         |
| :----------- | :--- | :---- | :------------------------------------------------- |
| `platform`   | text | Tidak | Nama platform (Facebook, Instagram, YouTube, dll.) |
| `url`        | text | Tidak | Tautan URL profil resmi                            |
| `sort_order` | int  | Tidak | Urutan tampilan                                    |

### app_settings

| Kolom         | Tipe  | Null  | Keterangan                              |
| :------------ | :---- | :---- | :-------------------------------------- |
| `key`         | text  | Tidak | Kunci pengaturan unik                   |
| `value`       | jsonb | Tidak | Nilai pengaturan (divalidasi skema Zod) |
| `description` | text  | Ya    | Penjelasan pengaturan                   |
| `updated_by`  | uuid  | Tidak | FK → users                              |

### report_signatories

| Kolom         | Tipe    | Null  | Keterangan                                         |
| :------------ | :------ | :---- | :------------------------------------------------- |
| `label`       | text    | Tidak | Jabatan penandatangan (Ketua, Bendahara, Pengawas) |
| `person_name` | text    | Tidak | Nama pejabat penandatangan                         |
| `member_id`   | uuid    | Ya    | FK → members                                       |
| `sort_order`  | int     | Tidak | Posisi urutan kolom tanda tangan                   |
| `is_active`   | boolean | Tidak | Status aktif                                       |

### number_sequences

| Kolom        | Tipe     | Null  | Keterangan                                        |
| :----------- | :------- | :---- | :------------------------------------------------ |
| `scope`      | enum     | Tidak | JOURNAL, TRANSACTION, MEMBER, WHT_SLIP, dst.      |
| `year`       | int      | Ya    | Null bila nomor urut tidak direset per tahun buku |
| `prefix`     | text     | Ya    | Awalan nomor registrasi                           |
| `next_value` | bigint   | Tidak | Nilai urutan berikutnya                           |
| `pad_length` | smallint | Tidak | Jumlah digit pengisi nol di depan                 |

_Catatan: UQ (scope, year) dengan NULLS NOT DISTINCT. Alokasi nomor menggunakan row-level lock di dalam transaksi basis data guna menjamin penomoran tanpa celah (gapless)._

---

## 3. Anggota (Fase 3)

### member_positions

| Kolom               | Tipe    | Null  | Keterangan                                    |
| :------------------ | :------ | :---- | :-------------------------------------------- |
| `code`              | text    | Tidak | Unik, kode posisi                             |
| `name`              | text    | Tidak | Nama posisi/jabatan                           |
| `category`          | enum    | Tidak | PEMBINA, PENGURUS, PENGAWAS, ANGGOTA, LAINNYA |
| `sort_order`        | int     | Tidak | Urutan tampilan struktur                      |
| `show_in_structure` | boolean | Tidak | Ditampilkan di bagan struktur pengurus publik |
| `is_active`         | boolean | Tidak | Status aktif                                  |

### members

| Kolom                | Tipe    | Null  | Keterangan                                                                     |
| :------------------- | :------ | :---- | :----------------------------------------------------------------------------- |
| `member_no`          | text    | Tidak | Unik, nomor registrasi anggota                                                 |
| `full_name`          | text    | Tidak | Nama lengkap                                                                   |
| `gender`             | enum    | Ya    | L, P                                                                           |
| `birth_place`        | text    | Ya    | Tempat lahir                                                                   |
| `birth_date`         | date    | Ya    | Tanggal lahir                                                                  |
| `nik_enc`            | bytea   | Ya    | [enc] NIK terenkripsi AES-256-GCM                                              |
| `nik_blind_index`    | text    | Ya    | HMAC-SHA256 dengan kunci rahasia terpisah untuk pencarian persis. Unik parsial |
| `address`            | text    | Ya    | Alamat domisili                                                                |
| `phone`              | text    | Ya    | Nomor telepon / WhatsApp                                                       |
| `email`              | text    | Ya    | Alamat surel                                                                   |
| `photo_asset_id`     | uuid    | Ya    | FK → media_assets (foto profil anggota)                                        |
| `kta_no`             | text    | Ya    | Nomor Kartu Tanda Anggota (KTA). Unik parsial, berbeda dari member_no          |
| `kta_status`         | enum    | Tidak | NOT_ISSUED (KTA belum dibuat), ISSUED (KTA sudah dibuat). Default NOT_ISSUED   |
| `kta_issued_on`      | date    | Ya    | Tanggal penerbitan KTA                                                         |
| `kta_photo_asset_id` | uuid    | Ya    | FK → media_assets. Foto KTA hasil scan, visibility wajib PRIVATE               |
| `status`             | enum    | Tidak | ACTIVE, INACTIVE, RESIGNED                                                     |
| `joined_on`          | date    | Tidak | Tanggal bergabung                                                              |
| `left_on`            | date    | Ya    | CHECK left_on ≥ joined_on                                                      |
| `show_public`        | boolean | Tidak | Tampil di direktori publik (default false)                                     |
| `notes`              | text    | Ya    | Catatan internal sekretariat                                                   |

_Catatan: SD, v. Foto KTA yang diunggah berstatus PRIVATE pada media_assets._

### member_position_history

| Kolom         | Tipe | Null  | Keterangan                        |
| :------------ | :--- | :---- | :-------------------------------- |
| `member_id`   | uuid | Tidak | FK → members                      |
| `position_id` | uuid | Tidak | FK → member_positions             |
| `start_date`  | date | Tidak | Tanggal mulai menjabat            |
| `end_date`    | date | Ya    | CHECK end_date ≥ start_date       |
| `decree_ref`  | text | Ya    | Nomor SK Pengangkatan / Penugasan |
| `notes`       | text | Ya    | Keterangan mutasi                 |

_Catatan: EXCLUDE constraint agar periode masa jabatan tidak tumpang tindih untuk kombinasi (member, position) yang sama._

### member_dues (Opsional)

| Kolom            | Tipe   | Null  | Keterangan                    |
| :--------------- | :----- | :---- | :---------------------------- |
| `member_id`      | uuid   | Tidak | FK → members                  |
| `period`         | date   | Tidak | Tanggal 1 bulan tagihan iuran |
| `amount`         | bigint | Tidak | CHECK amount ≥ 0              |
| `status`         | enum   | Tidak | UNPAID, PAID, WAIVED          |
| `paid_on`        | date   | Ya    | Tanggal pembayaran iuran      |
| `transaction_id` | uuid   | Ya    | FK → financial_transactions   |

_Catatan: UQ (member_id, period)._

### member_import_batches (Opsional)

| Kolom          | Tipe        | Null  | Keterangan                  |
| :------------- | :---------- | :---- | :-------------------------- |
| `file_name`    | text        | Tidak | Nama berkas impor CSV/Excel |
| `total_rows`   | int         | Tidak | Jumlah total baris          |
| `success_rows` | int         | Tidak | Jumlah baris berhasil       |
| `failed_rows`  | int         | Tidak | Jumlah baris gagal          |
| `status`       | enum        | Tidak | RUNNING, DONE, FAILED       |
| `created_by`   | uuid        | Tidak | FK → users                  |
| `finished_at`  | timestamptz | Ya    | Waktu selesai proses        |

### member_import_errors (Opsional)

| Kolom        | Tipe | Null  | Keterangan                                    |
| :----------- | :--- | :---- | :-------------------------------------------- |
| `batch_id`   | uuid | Tidak | FK → member_import_batches, ON DELETE CASCADE |
| `row_number` | int  | Tidak | Nomor baris berkas sumber                     |
| `field`      | text | Ya    | Kolom bermasalah                              |
| `message`    | text | Tidak | Pesan galat validasi                          |

_Catatan: Tidak menyimpan data mentah baris agar NIK tidak bocor ke tabel log ini._

---

## 4. Keuangan Inti & Akuntansi ISAK 35 (Fase 4)

Bagian paling krusial. Seluruh pencatatan menggunakan jurnal ganda (_double-entry_) di balik layar dengan aturan yang ditegakkan di level database.

### fiscal_years

| Kolom        | Tipe        | Null  | Keterangan                   |
| :----------- | :---------- | :---- | :--------------------------- |
| `code`       | text        | Tidak | Unik, misal: "2026"          |
| `start_date` | date        | Tidak | Tanggal awal tahun buku      |
| `end_date`   | date        | Tidak | CHECK end_date > start_date  |
| `status`     | enum        | Tidak | OPEN, CLOSED                 |
| `closed_at`  | timestamptz | Ya    | Waktu penutupan buku tahunan |
| `closed_by`  | uuid        | Ya    | FK → users                   |

_Catatan: EXCLUDE constraint agar rentang tahun buku tidak saling tumpang tindih._

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

_Catatan: UQ (fiscal_year_id, period_no). EXCLUDE rentang tumpang tindih. Transaksi jurnal pada periode CLOSED ditolak mutlak._

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

| Kolom                | Tipe    | Null  | Keterangan                                                              |
| :------------------- | :------ | :---- | :---------------------------------------------------------------------- |
| `code`               | text    | Tidak | Unik, nomor akun. Terkunci setelah akun dipakai di jurnal               |
| `name`               | text    | Tidak | Nama akun                                                               |
| `type`               | enum    | Tidak | ASSET, LIABILITY, NET_ASSET, REVENUE, EXPENSE. Terkunci setelah dipakai |
| `normal_balance`     | enum    | Tidak | DEBIT, CREDIT                                                           |
| `parent_id`          | uuid    | Ya    | FK → chart_of_accounts (induk hierarki)                                 |
| `is_postable`        | boolean | Tidak | Hanya akun daun (bukan header) yang boleh diposting                     |
| `is_cash_bank`       | boolean | Tidak | Penanda akun kas atau setara kas                                        |
| `cash_flow_category` | enum    | Ya    | OPERATING, INVESTING, FINANCING. **PERLU VERIFIKASI**                   |
| `expense_function`   | enum    | Ya    | PROGRAM, GENERAL_ADMIN, FUNDRAISING. **PERLU VERIFIKASI**               |
| `is_system`          | boolean | Tidak | Akun bawaan sistem yang tidak boleh dihapus                             |
| `is_active`          | boolean | Tidak | Status keaktifan akun                                                   |
| `notes`              | text    | Ya    | Penjelasan peruntukan akun                                              |

### cash_bank_accounts

| Kolom                 | Tipe    | Null  | Keterangan                                                  |
| :-------------------- | :------ | :---- | :---------------------------------------------------------- |
| `account_id`          | uuid    | Tidak | FK → chart_of_accounts, unik                                |
| `name`                | text    | Tidak | Nama rekening / kas kasir                                   |
| `kind`                | enum    | Tidak | CASH, BANK                                                  |
| `bank_name`           | text    | Ya    | Nama bank (BCA, Mandiri, BSI, dll.)                         |
| `account_number_enc`  | bytea   | Ya    | [enc] Nomor rekening bank terenkripsi                       |
| `account_number_mask` | text    | Ya    | Nomor rekening tersamar untuk tampilan (misal `******7890`) |
| `holder_name`         | text    | Ya    | Nama atas nama pemilik rekening                             |
| `is_active`           | boolean | Tidak | Status aktif                                                |

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
| `notes`          | text    | Ya    | Catatan                                      |

_Catatan: SD._

### transaction_categories

| Kolom                     | Tipe    | Null  | Keterangan                                                |
| :------------------------ | :------ | :---- | :-------------------------------------------------------- |
| `type`                    | enum    | Tidak | INCOME, EXPENSE                                           |
| `name`                    | text    | Tidak | Nama kategori transaksi operasional                       |
| `account_id`              | uuid    | Tidak | FK → chart_of_accounts. Akun lawan kas untuk kategori ini |
| `default_net_asset_class` | enum    | Ya    | WITHOUT_RESTRICTION, WITH_RESTRICTION                     |
| `sort_order`              | int     | Tidak | Urutan tampilan                                           |
| `is_active`               | boolean | Tidak | Status aktif                                              |

### financial_transactions

Dokumen transaksi pengguna tempat persetujuan (_approval_), lampiran, dan pajak melekat. Jurnal umum baru terbentuk secara otomatis saat transaksi mencapai status POSTED.

| Kolom                  | Tipe        | Null  | Keterangan                                                           |
| :--------------------- | :---------- | :---- | :------------------------------------------------------------------- |
| `txn_no`               | text        | Ya    | Nomor bukti transaksi, diisi saat POSTED (unik parsial, tanpa celah) |
| `type`                 | enum        | Tidak | INCOME, EXPENSE, TRANSFER                                            |
| `txn_date`             | date        | Tidak | Tanggal transaksi                                                    |
| `cash_bank_account_id` | uuid        | Tidak | FK → cash_bank_accounts                                              |
| `counter_account_id`   | uuid        | Ya    | FK → cash_bank_accounts (hanya untuk TRANSFER)                       |
| `category_id`          | uuid        | Ya    | FK → transaction_categories                                          |
| `party_id`             | uuid        | Ya    | FK → parties                                                         |
| `project_id`           | uuid        | Ya    | FK → projects                                                        |
| `restricted_fund_id`   | uuid        | Ya    | FK → restricted_funds                                                |
| `net_asset_class`      | enum        | Ya    | WITHOUT_RESTRICTION, WITH_RESTRICTION                                |
| `amount`               | bigint      | Tidak | CHECK amount > 0                                                     |
| `description`          | text        | Tidak | Rincian keperluan transaksi                                          |
| `reference_no`         | text        | Ya    | Nomor nota, kuitansi eksternal, atau slip setoran                    |
| `status`               | enum        | Tidak | DRAFT, PENDING_APPROVAL, APPROVED, POSTED, REJECTED, VOID            |
| `journal_entry_id`     | uuid        | Ya    | FK → journal_entries, unik                                           |
| `created_by`           | uuid        | Tidak | FK → users                                                           |
| `posted_at`            | timestamptz | Ya    | Waktu pembukuan ke jurnal                                            |
| `posted_by`            | uuid        | Ya    | FK → users                                                           |
| `void_reason`          | text        | Ya    | Alasan pembatalan (wajib saat status VOID)                           |

_Catatan: v. TRANSFER: counter_account berbeda dari cash_bank_account dan category kosong. INCOME & EXPENSE: category wajib terisi._

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
| `entry_no`          | text        | Ya    | Nomor jurnal umum, diisi saat POSTED (unik parsial, tanpa celah)      |
| `entry_date`        | date        | Tidak | Tanggal pencatatan buku                                               |
| `period_id`         | uuid        | Tidak | FK → accounting_periods                                               |
| `source`            | enum        | Tidak | MANUAL, TRANSACTION, REVERSAL, CLOSING, OPENING, RELEASE, TAX_PAYMENT |
| `description`       | text        | Tidak | Keterangan ringkas jurnal                                             |
| `status`            | enum        | Tidak | DRAFT, POSTED, VOID                                                   |
| `reverses_entry_id` | uuid        | Ya    | FK → journal_entries (self), unik. Rujukan jurnal pembalik            |
| `posted_at`         | timestamptz | Ya    | Stempel waktu posting                                                 |
| `posted_by`         | uuid        | Ya    | FK → users                                                            |
| `created_by`        | uuid        | Tidak | FK → users                                                            |

_Catatan: v. Indeks (entry_date, status) dan (period_id)._

### journal_lines

| Kolom                | Tipe     | Null  | Keterangan                                              |
| :------------------- | :------- | :---- | :------------------------------------------------------ |
| `entry_id`           | uuid     | Tidak | FK → journal_entries                                    |
| `line_no`            | smallint | Tidak | Urutan baris dalam jurnal                               |
| `account_id`         | uuid     | Tidak | FK → chart_of_accounts                                  |
| `debit`              | bigint   | Tidak | Default 0                                               |
| `credit`             | bigint   | Tidak | Default 0                                               |
| `memo`               | text     | Ya    | Catatan detail per baris akun                           |
| `net_asset_class`    | enum     | Ya    | Wajib terisi untuk akun REVENUE, EXPENSE, dan NET_ASSET |
| `restricted_fund_id` | uuid     | Ya    | FK → restricted_funds                                   |
| `project_id`         | uuid     | Ya    | FK → projects                                           |
| `party_id`           | uuid     | Ya    | FK → parties                                            |

_Catatan: UQ (entry_id, line_no). CHECK debit ≥ 0, credit ≥ 0, dan tepat salah satunya > 0. Dijaga oleh trigger database:_

- _Constraint trigger deferred yang memverifikasi total debit persis sama dengan total kredit saat POSTED._
- _Trigger yang menolak UPDATE dan DELETE pada jurnal dan baris yang sudah POSTED._
- _Penolakan posting ke accounting_periods berstatus CLOSED._

### restricted_funds

| Kolom              | Tipe   | Null  | Keterangan                                       |
| :----------------- | :----- | :---- | :----------------------------------------------- |
| `code`             | text   | Tidak | Unik, kode dana terikat                          |
| `name`             | text   | Tidak | Nama dana terikat                                |
| `purpose`          | text   | Tidak | Batasan atau tujuan khusus dari pemberi dana     |
| `donor_party_id`   | uuid   | Ya    | FK → parties                                     |
| `project_id`       | uuid   | Ya    | FK → projects                                    |
| `restriction_type` | enum   | Tidak | PURPOSE (tujuan), TIME (waktu), PURPOSE_AND_TIME |
| `expires_on`       | date   | Ya    | Batas waktu berlakunya pembatasan                |
| `target_amount`    | bigint | Ya    | Target nominal dana                              |
| `status`           | enum   | Tidak | ACTIVE, FULLY_RELEASED, EXPIRED, CLOSED          |
| `notes`            | text   | Ya    | Catatan akad dana                                |

_Catatan: Saldo dana tidak pernah disimpan di tabel ini, melainkan selalu dihitung dari agregasi baris journal_lines._

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

| Kolom                | Tipe          | Null  | Keterangan                                                                                |
| :------------------- | :------------ | :---- | :---------------------------------------------------------------------------------------- |
| `donation_date`      | date          | Tidak | Tanggal penerimaan barang/jasa                                                            |
| `donor_party_id`     | uuid          | Ya    | FK → parties                                                                              |
| `description`        | text          | Tidak | Rincian barang donasi non-kas                                                             |
| `quantity`           | numeric(14,3) | Ya    | Jumlah fisik                                                                              |
| `unit`               | text          | Ya    | Satuan (dus, kg, unit, rim)                                                               |
| `estimated_value`    | bigint        | Tidak | Nilai wajar estimasi. **PERLU VERIFIKASI**                                                |
| `valuation_basis`    | text          | Ya    | Dasar penentuan nilai wajar                                                               |
| `net_asset_class`    | enum          | Tidak | WITHOUT_RESTRICTION, WITH_RESTRICTION                                                     |
| `project_id`         | uuid          | Ya    | FK → projects                                                                             |
| `restricted_fund_id` | uuid          | Ya    | FK → restricted_funds                                                                     |
| `is_recognized`      | boolean       | Tidak | Diakui di laporan posisi keuangan atau hanya diungkapkan di Catatan Atas Laporan Keuangan |
| `journal_entry_id`   | uuid          | Ya    | FK → journal_entries, unik                                                                |
| `created_by`         | uuid          | Tidak | FK → users                                                                                |

_Catatan: CHECK is_recognized sama dengan (journal_entry_id terisi)._

### budget_versions

| Kolom            | Tipe        | Null  | Keterangan                  |
| :--------------- | :---------- | :---- | :-------------------------- |
| `fiscal_year_id` | uuid        | Tidak | FK → fiscal_years           |
| `scope`          | enum        | Tidak | ORGANIZATION, PROJECT       |
| `project_id`     | uuid        | Ya    | FK → projects               |
| `version_no`     | int         | Tidak | Nomor revisi anggaran       |
| `name`           | text        | Tidak | Nama pagu anggaran          |
| `status`         | enum        | Tidak | DRAFT, APPROVED, SUPERSEDED |
| `approved_by`    | uuid        | Ya    | FK → users                  |
| `approved_at`    | timestamptz | Ya    | Waktu persetujuan anggaran  |
| `notes`          | text        | Ya    | Catatan revisi              |

_Catatan: UQ (fiscal_year_id, project_id, version_no) dengan NULLS NOT DISTINCT. CHECK scope = PROJECT jika dan hanya jika project_id terisi._

### budget_lines

| Kolom               | Tipe     | Null  | Keterangan                                    |
| :------------------ | :------- | :---- | :-------------------------------------------- |
| `budget_version_id` | uuid     | Tidak | FK → budget_versions                          |
| `account_id`        | uuid     | Tidak | FK → chart_of_accounts                        |
| `period_no`         | smallint | Ya    | 1 sampai 12 (null berarti pagu setahun penuh) |
| `amount`            | bigint   | Tidak | CHECK amount ≥ 0                              |
| `notes`             | text     | Ya    | Rincian alokasi biaya                         |

_Catatan: UQ (budget_version_id, account_id, period_no)._

### approval_policies

| Kolom                  | Tipe     | Null  | Keterangan                                             |
| :--------------------- | :------- | :---- | :----------------------------------------------------- |
| `name`                 | text     | Tidak | Nama kebijakan persetujuan                             |
| `applies_to`           | enum     | Tidak | INCOME, EXPENSE, TRANSFER, MANUAL_JOURNAL, VOID        |
| `min_amount`           | bigint   | Tidak | Ambang batas minimal nominal (default 0)               |
| `max_amount`           | bigint   | Ya    | Ambang batas maksimal nominal                          |
| `required_role_id`     | uuid     | Tidak | FK → roles (peran penyetuju yang berwenang)            |
| `steps_required`       | smallint | Tidak | Jumlah tahapan persetujuan bertingkat                  |
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

| Kolom           | Tipe        | Null  | Keterangan                  |
| :-------------- | :---------- | :---- | :-------------------------- |
| `request_id`    | uuid        | Tidak | FK → approval_requests      |
| `step_no`       | smallint    | Tidak | Nomor tahapan               |
| `actor_user_id` | uuid        | Tidak | FK → users                  |
| `decision`      | enum        | Tidak | APPROVE, REJECT             |
| `comment`       | text        | Ya    | Catatan alasan keputusan    |
| `decided_at`    | timestamptz | Tidak | Waktu pengambilan keputusan |

_Catatan: Append-only. UQ (request_id, step_no, actor_user_id)._

---

## 5. Proyek dan Kegiatan (Fase 5)

Keterkaitan transaksi dan jurnal ke proyek melalui kolom `project_id` pada `financial_transactions` dan `journal_lines`, sehingga laporan realisasi proyek menggunakan agregasi kueri terstruktur.

### project_types

| Kolom       | Tipe    | Null  | Keterangan                                              |
| :---------- | :------ | :---- | :------------------------------------------------------ |
| `code`      | text    | Tidak | Unik, kode kategori proyek                              |
| `name`      | text    | Tidak | Nama jenis (Sosial, Pendidikan, Keagamaan, Pembangunan) |
| `is_active` | boolean | Tidak | Status aktif                                            |

### projects

| Kolom            | Tipe    | Null  | Keterangan                                        |
| :--------------- | :------ | :---- | :------------------------------------------------ |
| `code`           | text    | Tidak | Unik, nomor registrasi kegiatan                   |
| `name`           | text    | Tidak | Nama kegiatan/program kerja                       |
| `type_id`        | uuid    | Tidak | FK → project_types                                |
| `description`    | text    | Ya    | Deskripsi dan latar belakang program              |
| `location_text`  | text    | Ya    | Lokasi pelaksanaan di Purwakarta                  |
| `status`         | enum    | Tidak | PLANNED, ONGOING, COMPLETED, CANCELLED            |
| `start_date`     | date    | Ya    | Tanggal rencana mulai                             |
| `end_date`       | date    | Ya    | CHECK end_date ≥ start_date                       |
| `pic_member_id`  | uuid    | Ya    | FK → members (Penanggung Jawab / PIC)             |
| `budget_total`   | bigint  | Ya    | Pagu anggaran total yang disetujui                |
| `is_public`      | boolean | Tidak | Tampil di portofolio situs publik (default false) |
| `slug`           | text    | Ya    | Unik parsial untuk URL publik                     |
| `cover_asset_id` | uuid    | Ya    | FK → media_assets                                 |

_Catatan: SD, v._

### project_milestones

| Kolom                    | Tipe        | Null  | Keterangan                         |
| :----------------------- | :---------- | :---- | :--------------------------------- |
| `project_id`             | uuid        | Tidak | FK → projects, ON DELETE CASCADE   |
| `name`                   | text        | Tidak | Nama termin / tahapan kerja        |
| `description`            | text        | Ya    | Rincian target capaian             |
| `planned_start`          | date        | Ya    | Rencana awal                       |
| `planned_end`            | date        | Ya    | Rencana selesai                    |
| `planned_payment_amount` | bigint      | Ya    | Rencana pembayaran termin bertahap |
| `status`                 | enum        | Tidak | PENDING, IN_PROGRESS, DONE         |
| `completed_at`           | timestamptz | Ya    | Waktu penyelesaian termin          |
| `sort_order`             | int         | Tidak | Urutan tahapan                     |

### project_updates

| Kolom         | Tipe    | Null  | Keterangan                                    |
| :------------ | :------ | :---- | :-------------------------------------------- |
| `project_id`  | uuid    | Tidak | FK → projects, ON DELETE CASCADE              |
| `title`       | text    | Tidak | Judul kabar kemajuan proyek                   |
| `body`        | text    | Tidak | Laporan naratif perkembangan                  |
| `update_date` | date    | Tidak | Tanggal laporan                               |
| `is_public`   | boolean | Tidak | Ditampilkan di website publik (default false) |
| `created_by`  | uuid    | Tidak | FK → users                                    |

### project_files

| Kolom            | Tipe    | Null  | Keterangan                       |
| :--------------- | :------ | :---- | :------------------------------- |
| `project_id`     | uuid    | Tidak | FK → projects, ON DELETE CASCADE |
| `update_id`      | uuid    | Ya    | FK → project_updates             |
| `media_asset_id` | uuid    | Tidak | FK → media_assets                |
| `kind`           | enum    | Tidak | PHOTO, DOCUMENT, CONTRACT, OTHER |
| `title`          | text    | Ya    | Judul berkas                     |
| `is_public`      | boolean | Tidak | Ditampilkan di publik            |
| `sort_order`     | int     | Tidak | Urutan                           |

### project_funding_sources (Opsional)

| Kolom                | Tipe   | Null  | Keterangan                          |
| :------------------- | :----- | :---- | :---------------------------------- |
| `project_id`         | uuid   | Tidak | FK → projects, ON DELETE CASCADE    |
| `restricted_fund_id` | uuid   | Ya    | FK → restricted_funds               |
| `planned_amount`     | bigint | Tidak | Alokasi dana terikat untuk kegiatan |
| `note`               | text   | Ya    | Keterangan akad                     |

_Catatan: UQ (project_id, restricted_fund_id)._

### project_members (Opsional)

| Kolom        | Tipe | Null  | Keterangan                            |
| :----------- | :--- | :---- | :------------------------------------ |
| `project_id` | uuid | Tidak | FK → projects, ON DELETE CASCADE      |
| `member_id`  | uuid | Tidak | FK → members                          |
| `role_text`  | text | Tidak | Peran spesifik dalam panitia kegiatan |

_Catatan: UQ (project_id, member_id)._

---

## 6. Pajak (Fase 6)

Seluruh master tarif dan rentang waktu disimpan sebagai data konfigurasi berversi tanggal. Tidak ada tarif pajak yang di-hardcode di kode aplikasi. Seluruh modul ini **PERLU VERIFIKASI** konsultan pajak sebelum dipakai sungguhan.

### tax_profile

| Kolom                  | Tipe     | Null  | Keterangan                              |
| :--------------------- | :------- | :---- | :-------------------------------------- |
| `id`                   | smallint | Tidak | Singleton, CHECK id = 1                 |
| `npwp_enc`             | bytea    | Ya    | [enc] NPWP yayasan terenkripsi          |
| `npwp_mask`            | text     | Ya    | NPWP tersamar untuk tampilan            |
| `taxpayer_name`        | text     | Ya    | Nama resmi wajib pajak                  |
| `is_vat_registered`    | boolean  | Tidak | Status Pengusaha Kena Pajak (PKP)       |
| `vat_registered_since` | date     | Ya    | Tanggal pengukuhan PKP                  |
| `tax_office`           | text     | Ya    | Kantor Pelayanan Pajak (KPP) terdaftar  |
| `rounding_mode`        | enum     | Tidak | NEAREST, UP, DOWN. **PERLU VERIFIKASI** |
| `updated_by`           | uuid     | Tidak | FK → users                              |

_Catatan: Singleton._

### tax_types

| Kolom                | Tipe    | Null  | Keterangan                                            |
| :------------------- | :------ | :---- | :---------------------------------------------------- |
| `code`               | text    | Tidak | Unik, misal: PPH21, PPH23, PPH4_2, PPN                |
| `name`               | text    | Tidak | Nama jenis pajak                                      |
| `kind`               | enum    | Tidak | WITHHOLDING, COLLECTION, VAT_OUTPUT, VAT_INPUT, OTHER |
| `payable_account_id` | uuid    | Tidak | FK → chart_of_accounts (Akun Hutang Pajak)            |
| `expense_account_id` | uuid    | Ya    | FK → chart_of_accounts                                |
| `requires_slip`      | boolean | Tidak | Wajib menerbitkan bukti potong atau tidak             |
| `description`        | text    | Ya    | Keterangan regulasi                                   |
| `is_active`          | boolean | Tidak | Status aktif                                          |

### tax_rates

| Kolom            | Tipe         | Null  | Keterangan                        |
| :--------------- | :----------- | :---- | :-------------------------------- |
| `tax_type_id`    | uuid         | Tidak | FK → tax_types                    |
| `rate`           | numeric(7,4) | Tidak | Persentase tarif (CHECK rate ≥ 0) |
| `basis_note`     | text         | Ya    | Dasar pengenaan pajak             |
| `effective_from` | date         | Tidak | Tanggal awal mulai berlaku        |
| `effective_to`   | date         | Ya    | Tanggal akhir masa berlaku        |
| `notes`          | text         | Ya    | Dasar hukum/PMK                   |

_Catatan: EXCLUDE constraint (btree_gist) agar rentang masa berlaku untuk satu jenis pajak tidak tumpang tindih._

### transaction_taxes

| Kolom             | Tipe         | Null  | Keterangan                                     |
| :---------------- | :----------- | :---- | :--------------------------------------------- |
| `transaction_id`  | uuid         | Tidak | FK → financial_transactions                    |
| `tax_type_id`     | uuid         | Tidak | FK → tax_types                                 |
| `tax_rate_id`     | uuid         | Ya    | FK → tax_rates                                 |
| `rate_snapshot`   | numeric(7,4) | Tidak | Snapshot tarif saat transaksi dibuat           |
| `base_amount`     | bigint       | Tidak | Dasar Pengenaan Pajak (DPP)                    |
| `tax_amount`      | bigint       | Tidak | Nilai nominal pajak yang dipotong              |
| `treatment`       | enum         | Tidak | WITHHOLD (memotong pembayaran), ADD (menambah) |
| `is_overridden`   | boolean      | Tidak | Tarif dimodifikasi manual                      |
| `override_reason` | text         | Ya    | Alasan pemodifikasian manual                   |

_Catatan: Menggunakan snapshot tarif sehingga perubahan master tarif di masa mendatang tidak mengubah riwayat transaksi lampau._

### withholding_slips

Bukti potong pajak. Skema terstandar yang kompatibel baik dengan format bukti potong internal maupun skema eksternal e-Bupot DJP.

| Kolom                       | Tipe         | Null  | Keterangan                            |
| :-------------------------- | :----------- | :---- | :------------------------------------ |
| `slip_no`                   | text         | Tidak | Nomor bukti potong unik (tanpa celah) |
| `external_ref`              | text         | Ya    | Nomor referensi DJP e-Bupot           |
| `slip_date`                 | date         | Tidak | Tanggal penerbitan bukti potong       |
| `tax_period_year`           | smallint     | Tidak | Masa pajak: tahun                     |
| `tax_period_month`          | smallint     | Tidak | Masa pajak: bulan (1–12)              |
| `tax_type_id`               | uuid         | Tidak | FK → tax_types                        |
| `transaction_tax_id`        | uuid         | Ya    | FK → transaction_taxes, unik          |
| `party_id`                  | uuid         | Tidak | FK → parties (pihak yang dipotong)    |
| `party_name_snapshot`       | text         | Tidak | Snapshot nama penerima honor/jasa     |
| `party_tax_id_snapshot_enc` | bytea        | Ya    | [enc] Snapshot NPWP/NIK penerima      |
| `gross_amount`              | bigint       | Tidak | Penghasilan bruto                     |
| `tax_amount`                | bigint       | Tidak | Nilai pajak dipotong                  |
| `rate_snapshot`             | numeric(7,4) | Tidak | Snapshot tarif persen                 |
| `status`                    | enum         | Tidak | DRAFT, ISSUED, CANCELLED              |
| `tax_payment_id`            | uuid         | Ya    | FK → tax_payments                     |
| `file_asset_id`             | uuid         | Ya    | FK → media_assets (PDF bukti potong)  |
| `notes`                     | text         | Ya    | Keterangan                            |

### tax_payments

Catatan setoran pajak ke kas negara.

| Kolom              | Tipe     | Null  | Keterangan                               |
| :----------------- | :------- | :---- | :--------------------------------------- |
| `payment_date`     | date     | Tidak | Tanggal penyetoran                       |
| `tax_period_year`  | smallint | Tidak | Masa tahun pajak                         |
| `tax_period_month` | smallint | Tidak | Masa bulan pajak                         |
| `tax_type_id`      | uuid     | Tidak | FK → tax_types                           |
| `amount`           | bigint   | Tidak | CHECK amount > 0                         |
| `billing_code`     | text     | Ya    | Kode billing pajak                       |
| `ntpn`             | text     | Ya    | Nomor Transaksi Penerimaan Negara (NTPN) |
| `transaction_id`   | uuid     | Ya    | FK → financial_transactions              |
| `journal_entry_id` | uuid     | Ya    | FK → journal_entries                     |
| `proof_asset_id`   | uuid     | Ya    | FK → media_assets (bukti setor BPN)      |
| `status`           | enum     | Tidak | PLANNED, PAID                            |
| `notes`            | text     | Ya    | Catatan                                  |

---

## 7. Konten dan Publikasi (Fase 8–9)

### post_categories

| Kolom         | Tipe | Null  | Keterangan          |
| :------------ | :--- | :---- | :------------------ |
| `name`        | text | Tidak | Nama kategori warta |
| `slug`        | text | Tidak | Unik, pengenal URL  |
| `description` | text | Ya    | Deskripsi topik     |
| `sort_order`  | int  | Tidak | Urutan              |

### posts

| Kolom             | Tipe        | Null  | Keterangan                                       |
| :---------------- | :---------- | :---- | :----------------------------------------------- |
| `title`           | text        | Tidak | Judul artikel                                    |
| `slug`            | text        | Tidak | Unik parsial untuk yang belum dihapus            |
| `excerpt`         | text        | Ya    | Ringkasan narasi                                 |
| `body_json`       | jsonb       | Tidak | Struktur dokumen editor Tiptap                   |
| `body_html`       | text        | Tidak | Hasil sanitasi HTML ketat untuk rendering publik |
| `cover_asset_id`  | uuid        | Ya    | FK → media_assets (gambar tajuk)                 |
| `category_id`     | uuid        | Ya    | FK → post_categories                             |
| `status`          | enum        | Tidak | DRAFT, SCHEDULED, PUBLISHED, ARCHIVED            |
| `published_at`    | timestamptz | Ya    | CHECK: wajib terisi bila status PUBLISHED        |
| `author_id`       | uuid        | Tidak | FK → users                                       |
| `seo_title`       | text        | Ya    | Judul meta SEO                                   |
| `seo_description` | text        | Ya    | Deskripsi meta SEO                               |
| `og_asset_id`     | uuid        | Ya    | FK → media_assets (gambar OpenGraph)             |

_Catatan: SD, v._

### tags

| Kolom  | Tipe | Null  | Keterangan     |
| :----- | :--- | :---- | :------------- |
| `name` | text | Tidak | Nama tag label |
| `slug` | text | Tidak | Unik           |

### post_tags

| Kolom     | Tipe | Null  | Keterangan                    |
| :-------- | :--- | :---- | :---------------------------- |
| `post_id` | uuid | Tidak | FK → posts, ON DELETE CASCADE |
| `tag_id`  | uuid | Tidak | FK → tags, ON DELETE CASCADE  |

_Catatan: PK komposit (post_id, tag_id)._

### galleries (Opsional)

| Kolom            | Tipe    | Null  | Keterangan             |
| :--------------- | :------ | :---- | :--------------------- |
| `title`          | text    | Tidak | Judul album galeri     |
| `slug`           | text    | Tidak | Unik                   |
| `description`    | text    | Ya    | Narasi album kegiatan  |
| `is_public`      | boolean | Tidak | Tampil di situs publik |
| `cover_asset_id` | uuid    | Ya    | FK → media_assets      |

_Catatan: SD._

### gallery_items (Opsional)

| Kolom            | Tipe | Null  | Keterangan                        |
| :--------------- | :--- | :---- | :-------------------------------- |
| `gallery_id`     | uuid | Tidak | FK → galleries, ON DELETE CASCADE |
| `media_asset_id` | uuid | Tidak | FK → media_assets                 |
| `caption`        | text | Ya    | Keterangan foto kegiatan          |
| `sort_order`     | int  | Tidak | Urutan                            |

### contact_messages

| Kolom             | Tipe        | Null  | Keterangan                             |
| :---------------- | :---------- | :---- | :------------------------------------- |
| `name`            | text        | Tidak | Nama pengirim                          |
| `email`           | text        | Tidak | Surel pengirim                         |
| `subject`         | text        | Ya    | Perihal pesan                          |
| `message`         | text        | Tidak | Isi pesan                              |
| `ip_hash`         | text        | Ya    | Hash SHA-256 dari IP (bukan IP mentah) |
| `user_agent_hash` | text        | Ya    | Hash peramban                          |
| `spam_score`      | numeric     | Ya    | Skor deteksi spam                      |
| `status`          | enum        | Tidak | NEW, READ, REPLIED, SPAM, ARCHIVED     |
| `handled_by`      | uuid        | Ya    | FK → users                             |
| `handled_at`      | timestamptz | Ya    | Waktu tindak lanjut                    |
| `received_at`     | timestamptz | Tidak | Waktu pesan diterima                   |

### published_reports

Halaman transparansi publik hanya membaca snapshot dari tabel ini, tidak pernah melakukan kueri langsung ke tabel transaksi atau jurnal keuangan.

| Kolom            | Tipe        | Null  | Keterangan                                                             |
| :--------------- | :---------- | :---- | :--------------------------------------------------------------------- |
| `report_type`    | enum        | Tidak | POSITION, ACTIVITY, NET_ASSET_CHANGE, CASH_FLOW, PROJECT_SUMMARY, dst. |
| `period_start`   | date        | Tidak | Tanggal awal periode pelaporan                                         |
| `period_end`     | date        | Tidak | Tanggal akhir periode pelaporan                                        |
| `title`          | text        | Tidak | Judul publikasi laporan                                                |
| `file_asset_id`  | uuid        | Tidak | FK → media_assets (PDF resmi bertanda tangan, visibility PUBLIC)       |
| `summary`        | jsonb       | Ya    | Angka agregat ringkasan yang disahkan                                  |
| `published_by`   | uuid        | Tidak | FK → users (Ketua / Bendahara)                                         |
| `published_at`   | timestamptz | Tidak | Waktu publikasi                                                        |
| `unpublished_at` | timestamptz | Ya    | Waktu pencabutan publikasi                                             |

---

## 8. Sistem dan Cadangan Data (Fase 8)

### backup_schedules

| Kolom             | Tipe    | Null  | Keterangan                                |
| :---------------- | :------ | :---- | :---------------------------------------- |
| `cron_expr`       | text    | Tidak | Pola cron penjadwalan                     |
| `kind`            | enum    | Tidak | DB_ONLY, DB_AND_FILES                     |
| `retention_count` | int     | Tidak | Batas jumlah arsip cadangan yang disimpan |
| `retention_days`  | int     | Ya    | Batas umur retensi hari                   |
| `destination`     | enum    | Tidak | LOCAL, S3                                 |
| `encrypt`         | boolean | Tidak | Enkripsi cadangan (default true)          |
| `is_active`       | boolean | Tidak | Status aktif                              |
| `updated_by`      | uuid    | Tidak | FK → users                                |

### backup_jobs

Model data cadangan yang dilengkapi pencatatan versi lingkungan guna validasi kompatibilitas pemulihan data sebelum dieksekusi.

| Kolom              | Tipe        | Null  | Keterangan                                                                  |
| :----------------- | :---------- | :---- | :-------------------------------------------------------------------------- |
| `trigger`          | enum        | Tidak | MANUAL, SCHEDULED, PRE_RESTORE, PRE_DEPLOY                                  |
| `kind`             | enum        | Tidak | DB_ONLY, DB_AND_FILES                                                       |
| `status`           | enum        | Tidak | RUNNING, SUCCESS, FAILED                                                    |
| `started_at`       | timestamptz | Tidak | Waktu mulai proses                                                          |
| `finished_at`      | timestamptz | Ya    | Waktu selesai proses                                                        |
| `postgres_version` | text        | Tidak | Versi PostgreSQL saat backup dibuat (misal: "17.2")                         |
| `schema_version`   | text        | Tidak | Nama migrasi Prisma terakhir yang aktif (misal: "20261105000000_init_auth") |
| `app_version`      | text        | Tidak | Versi rilis aplikasi atau Git commit SHA (misal: "0.1.0-e825d51")           |
| `storage_key`      | text        | Ya    | Lokasi path berkas cadangan                                                 |
| `size_bytes`       | bigint      | Ya    | Ukuran arsip cadangan                                                       |
| `sha256`           | text        | Ya    | Hash integritas berkas                                                      |
| `encrypted`        | boolean     | Tidak | Status enkripsi arsip                                                       |
| `key_id`           | text        | Ya    | ID kunci enkripsi yang dipakai                                              |
| `destination`      | enum        | Tidak | LOCAL, S3                                                                   |
| `schedule_id`      | uuid        | Ya    | FK → backup_schedules                                                       |
| `requested_by`     | uuid        | Ya    | FK → users                                                                  |
| `error_message`    | text        | Ya    | Pesan galat tersanitasi jika gagal                                          |

### restore_events

| Kolom                   | Tipe        | Null  | Keterangan                                                  |
| :---------------------- | :---------- | :---- | :---------------------------------------------------------- |
| `backup_job_id`         | uuid        | Tidak | FK → backup_jobs (berkas cadangan yang dipulihkan)          |
| `pre_restore_backup_id` | uuid        | Tidak | FK → backup_jobs (snapshot otomatis sebelum restore, wajib) |
| `requested_by`          | uuid        | Tidak | FK → users (Super Admin)                                    |
| `started_at`            | timestamptz | Tidak | Waktu mulai                                                 |
| `finished_at`           | timestamptz | Ya    | Waktu selesai                                               |
| `status`                | enum        | Tidak | RUNNING, SUCCESS, FAILED                                    |
| `notes`                 | text        | Ya    | Keterangan audit pemulihan                                  |

_Catatan: Prosedur Pre-Restore & Validasi Penolakan Mutlak (lihat detail di `docs/database/14-traceability.md`):_

1. _Target PostgreSQL Version Check: Restore DITOLAK KERAS jika versi PostgreSQL target lebih tua daripada `postgres_version` berkas cadangan._
2. _Schema Version Compatibility Check: Restore DITOLAK OTOMATIS jika skema target tidak kompatibel dengan `schema_version` cadangan._
3. _Cryptographic Key Check: Restore DITOLAK KERAS jika key ring target tidak memiliki `key_id` yang cocok atau `BLIND_INDEX_SECRET` berbeda._
4. _Snapshot Wajib: Snapshot otomatis `pre_restore_backup_id` wajib sukses dibuat sebelum pemulihan basis data dieksekusi._

### job_locks

| Kolom          | Tipe        | Null  | Keterangan                                      |
| :------------- | :---------- | :---- | :---------------------------------------------- |
| `job_name`     | text        | Tidak | Primary key (tanpa kolom id)                    |
| `locked_by`    | text        | Tidak | Pengenal instance worker                        |
| `locked_until` | timestamptz | Tidak | Batas waktu sewa lock (mencegah eksekusi ganda) |

### download_tokens

Tautan unduh berumur pendek untuk file cadangan atau ekspor sensitif.

| Kolom            | Tipe        | Null  | Keterangan        |
| :--------------- | :---------- | :---- | :---------------- |
| `token_hash`     | text        | Tidak | [hash], unik      |
| `backup_job_id`  | uuid        | Ya    | FK → backup_jobs  |
| `media_asset_id` | uuid        | Ya    | FK → media_assets |
| `expires_at`     | timestamptz | Tidak | Waktu kedaluwarsa |
| `used_at`        | timestamptz | Ya    | Sekali pakai      |
| `created_by`     | uuid        | Tidak | FK → users        |

_Catatan: CHECK tepat salah satu dari backup_job_id atau media_asset_id yang terisi._

---

## 9. Ringkasan Modul & Poin Keputusan Kunci

| Modul Domain                     | Jumlah Tabel | Keterangan Ruang Lingkup                                                    |
| :------------------------------- | :----------- | :-------------------------------------------------------------------------- |
| **1. Identitas & Akses**         | 12           | Autentikasi Argon2id, Sesi, 2FA TOTP, RBAC, Rate Limit, Audit Log           |
| **2. Pengaturan, Profil, Media** | 7            | Media Assets, Profil Legalitas SK Kemenkumham, Kop Surat, Pengaturan Sistem |
| **3. Anggota**                   | 6            | Direktori Anggota, Enkripsi NIK, Jabatan Pengurus, KTA, Iuran               |
| **4. Keuangan Inti (ISAK 35)**   | 19           | COA, Kas & Bank, Transaksi, Jurnal Seimbang, Dana Terikat, Approval         |
| **5. Proyek & Kegiatan**         | 7            | Kegiatan Sosial Purwakarta, Milestone, Keterkaitan Pagu Anggaran            |
| **6. Pajak Berkonfigurasi**      | 6            | Tarif Berversi Tanggal, Pemotongan PPh 21/23, Bukti Potong, Setoran NTPN    |
| **7. Konten & Publikasi**        | 8            | Warta/Berita, Galeri Foto, Pesan Kontak, Snapshot Transparansi Publik       |
| **8. Sistem & Cadangan**         | 5            | Penjadwalan Backup, Validasi Versi Restore, Job Locks, Download Tokens      |
| **Total Seluruh Tabel**          | **70 Tabel** | **63 Tabel Inti + 7 Tabel Fitur Opsional**                                  |

_Tabel bertanda opsional (iuran dan impor anggota, anggota dan sumber dana proyek, galeri) berjumlah 7 tabel. Jika disederhanakan, totalnya menjadi 63 tabel._

### 6 Poin Keputusan Arsitektur Kunci

1. **Pemisahan Dokumen Transaksi dari Jurnal Umum**:
   `financial_transactions` adalah dokumen bisnis pengguna tempat persetujuan (_approval_), lampiran nota, dan pemotongan pajak melekat. Jurnal umum (`journal_entries` dan `journal_lines`) baru dibentuk saat transaksi berstatus `POSTED`. Hal ini memastikan jurnal akuntansi tetap suci dan berpasangan sempurna tanpa tercemar status draf atau penolakan.
2. **Fleksibilitas Penugasan Multi-Role**:
   Tabel `user_roles` mendukung satu pengguna memegang lebih dari satu peran (misal: Bendahara merangkap Penanggung Jawab Proyek).
3. **Perlindungan NIK Anggota (rujukan, PERLU VERIFIKASI: UU PDP No. 27/2022)**:
   NIK disimpan terenkripsi di `nik_enc` via AES-256-GCM menggunakan Key Ring berotasi (`key_id`) dan didukung `nik_blind_index` (HMAC-SHA256 via `BLIND_INDEX_SECRET`) untuk pencarian cepat dan deteksi duplikat tanpa perlu mendekripsi seluruh baris data.
4. **Kalkulasi Saldo Dana Terikat Secara Runtime**:
   Saldo dana terikat (`restricted_funds`) tidak pernah disimpan sebagai angka statis; selalu dihitung dari baris jurnal pembukuan (`journal_lines`). Ini menjamin saldo laporan tidak akan pernah menyimpang dari buku besar.
5. **Daftar Poin yang PERLU VERIFIKASI Akuntan / Konsultan Pajak**:
   - `expense_function` dan `cash_flow_category` pada Bagan Akun (COA).
   - Aturan pembulatan pajak (`rounding_mode`).
   - Prosedur jurnal penutupan tahun buku (_closing entries_).
   - Perlakuan pengakuan donasi non-kas (_in-kind donations_).
6. **Batasan Desain yang Dikeluarkan dari Skema Database**:
   - Tidak ada integrasi e-Faktur langsung atau payment gateway real-time otomatis.
   - Kunci enkripsi master (`ENCRYPTION_KEYS`) dan kunci blind index (`BLIND_INDEX_SECRET`) tidak disimpan di database, melainkan di variabel lingkungan host. Cadangan offsite berbasis S3-compatible diwajibkan secara mandatori melalui worker.

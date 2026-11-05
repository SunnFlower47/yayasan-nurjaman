# Modul 8 — Sistem dan Cadangan Data (Fase 8)

_Bagian dari [Spesifikasi Database](./00-README.md) · 5 tabel_

---

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

---

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

_Catatan kolom tambahan arsitektur:_

- _`postgres_version`, `schema_version`, `app_version`: **[Ditambah arsitektur — lihat ADR-009]**. Tidak ada di draf pemilik. Ditambahkan untuk mendukung validasi kompatibilitas restore (lihat `docs/database/14-traceability.md`). **PERLU KONFIRMASI** pemilik apakah kolom ini disetujui._
- _Nilai `PRE_DEPLOY` pada `trigger`: **[Ditambah arsitektur — lihat ADR-009]**. Draf pemilik hanya memuat MANUAL, SCHEDULED, PRE_RESTORE. `PRE_DEPLOY` ditambahkan untuk backup otomatis sebelum deploy. **PERLU KONFIRMASI** pemilik._

---

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

---

### job_locks

| Kolom          | Tipe        | Null  | Keterangan                                      |
| :------------- | :---------- | :---- | :---------------------------------------------- |
| `job_name`     | text        | Tidak | Primary key (tanpa kolom id)                    |
| `locked_by`    | text        | Tidak | Pengenal instance worker                        |
| `locked_until` | timestamptz | Tidak | Batas waktu sewa lock (mencegah eksekusi ganda) |

---

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

## Usulan Tambahan, MENUNGGU PERSETUJUAN

_Tidak ada usulan tambahan untuk modul ini._

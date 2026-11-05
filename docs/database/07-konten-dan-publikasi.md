# Modul 7 — Konten dan Publikasi (Fase 8–9)

_Bagian dari [Spesifikasi Database](./00-README.md) · 8 tabel (6 inti + 2 opsional)_

---

### post_categories

| Kolom         | Tipe | Null  | Keterangan          |
| :------------ | :--- | :---- | :------------------ |
| `name`        | text | Tidak | Nama kategori warta |
| `slug`        | text | Tidak | Unik, pengenal URL  |
| `description` | text | Ya    | Deskripsi topik     |
| `sort_order`  | int  | Tidak | Urutan              |

---

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

---

### tags

| Kolom  | Tipe | Null  | Keterangan     |
| :----- | :--- | :---- | :------------- |
| `name` | text | Tidak | Nama tag label |
| `slug` | text | Tidak | Unik           |

---

### post_tags

| Kolom     | Tipe | Null  | Keterangan                    |
| :-------- | :--- | :---- | :---------------------------- |
| `post_id` | uuid | Tidak | FK → posts, ON DELETE CASCADE |
| `tag_id`  | uuid | Tidak | FK → tags, ON DELETE CASCADE  |

_Catatan: PK komposit (post_id, tag_id)._

---

### galleries (Opsional)

| Kolom            | Tipe    | Null  | Keterangan             |
| :--------------- | :------ | :---- | :--------------------- |
| `title`          | text    | Tidak | Judul album galeri     |
| `slug`           | text    | Tidak | Unik                   |
| `description`    | text    | Ya    | Narasi album kegiatan  |
| `is_public`      | boolean | Tidak | Tampil di situs publik |
| `cover_asset_id` | uuid    | Ya    | FK → media_assets      |

_Catatan: SD._

---

### gallery_items (Opsional)

| Kolom            | Tipe | Null  | Keterangan                        |
| :--------------- | :--- | :---- | :-------------------------------- |
| `gallery_id`     | uuid | Tidak | FK → galleries, ON DELETE CASCADE |
| `media_asset_id` | uuid | Tidak | FK → media_assets                 |
| `caption`        | text | Ya    | Keterangan foto kegiatan          |
| `sort_order`     | int  | Tidak | Urutan                            |

---

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

---

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

## Usulan Tambahan, MENUNGGU PERSETUJUAN

_Tidak ada usulan tambahan untuk modul ini._

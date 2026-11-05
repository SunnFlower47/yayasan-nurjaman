# Modul 2 — Pengaturan, Profil Yayasan, dan Media (Fase 2)

_Bagian dari [Spesifikasi Database](./00-README.md) · 7 tabel_

---

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

---

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

---

### foundation_missions

| Kolom        | Tipe    | Null  | Keterangan                 |
| :----------- | :------ | :---- | :------------------------- |
| `text`       | text    | Tidak | Satu butir pernyataan misi |
| `sort_order` | int     | Tidak | Urutan tampilan            |
| `is_active`  | boolean | Tidak | Status aktif               |

---

### foundation_social_links

| Kolom        | Tipe | Null  | Keterangan                                         |
| :----------- | :--- | :---- | :------------------------------------------------- |
| `platform`   | text | Tidak | Nama platform (Facebook, Instagram, YouTube, dll.) |
| `url`        | text | Tidak | Tautan URL profil resmi                            |
| `sort_order` | int  | Tidak | Urutan tampilan                                    |

---

### app_settings

| Kolom         | Tipe  | Null  | Keterangan                              |
| :------------ | :---- | :---- | :-------------------------------------- |
| `key`         | text  | Tidak | Kunci pengaturan unik                   |
| `value`       | jsonb | Tidak | Nilai pengaturan (divalidasi skema Zod) |
| `description` | text  | Ya    | Penjelasan pengaturan                   |
| `updated_by`  | uuid  | Tidak | FK → users                              |

---

### report_signatories

| Kolom         | Tipe    | Null  | Keterangan                                         |
| :------------ | :------ | :---- | :------------------------------------------------- |
| `label`       | text    | Tidak | Jabatan penandatangan (Ketua, Bendahara, Pengawas) |
| `person_name` | text    | Tidak | Nama pejabat penandatangan                         |
| `member_id`   | uuid    | Ya    | FK → members                                       |
| `sort_order`  | int     | Tidak | Posisi urutan kolom tanda tangan                   |
| `is_active`   | boolean | Tidak | Status aktif                                       |

---

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

## Usulan Tambahan, MENUNGGU PERSETUJUAN

Tabel-tabel berikut **tidak ada dalam draf 70 tabel pemilik** dan diusulkan oleh tim arsitektur. Implementasi memerlukan persetujuan tertulis pemilik:

### (Usulan) legal_documents

Penyimpanan dokumen hukum yayasan (akta, SK, perjanjian). Saat ini informasi legalitas disimpan sebagai teks di `foundation_profile`. Jika dokumen-dokumen ini perlu disimpan sebagai file, dapat menggunakan `media_assets` dengan metadata terpisah tanpa perlu tabel baru.

- **Dampak**: Menambah kompleksitas relasi dan UI upload dokumen hukum.
- **Alternatif**: Gunakan `media_assets` dengan penamaan file konvensional tanpa tabel terpisah.

### (Usulan) letterheads

Konfigurasi template kop surat (logo, alamat, font, tata letak). Saat ini `foundation_profile.letterhead_note` sudah mengakomodasi kebutuhan dasar.

- **Dampak**: Perlu UI template builder kop surat yang belum ada dalam roadmap.
- **Alternatif**: Data kop surat diambil dari `foundation_profile` saja.

### (Usulan) media_tags dan media_asset_tags

Sistem penandaan (_tagging_) media untuk kategorisasi aset di pustaka media.

- **Dampak**: Menambah 2 tabel relasi dan UI tag management.
- **Alternatif**: Gunakan kolom `alt_text` atau penamaan `storage_key` terstruktur.

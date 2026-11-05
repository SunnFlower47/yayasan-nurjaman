# Spesifikasi Database — Yayasan Nurjaman Bongas Purwakarta

_Draf Spesifikasi Teknis · 70 Tabel dalam 8 Modul · Panduan Pemodelan Skema Basis Data_

> **Status Dokumen**: Draf Arsitektur Terverifikasi (Belum Diimplementasikan ke Prisma)
> **Target Implementasi**: Diterapkan bertahap per fase melalui Prisma Migration (Fase 1 s.d. 8)

## Indeks Modul

| File                                                             | Modul                                 | Fase | Tabel |
| :--------------------------------------------------------------- | :------------------------------------ | :--- | ----: |
| [01-identitas-dan-akses.md](./01-identitas-dan-akses.md)         | Identitas dan Akses                   | 1–2  |    12 |
| [02-pengaturan-profil-media.md](./02-pengaturan-profil-media.md) | Pengaturan, Profil Yayasan, dan Media | 2    |     7 |
| [03-anggota.md](./03-anggota.md)                                 | Anggota                               | 3    |     6 |
| [04-keuangan-inti.md](./04-keuangan-inti.md)                     | Keuangan Inti dan Akuntansi ISAK 35   | 4    |    19 |
| [05-proyek-dan-kegiatan.md](./05-proyek-dan-kegiatan.md)         | Proyek dan Kegiatan                   | 5    |     7 |
| [06-pajak.md](./06-pajak.md)                                     | Pajak                                 | 6    |     6 |
| [07-konten-dan-publikasi.md](./07-konten-dan-publikasi.md)       | Konten dan Publikasi                  | 8–9  |     8 |
| [08-sistem.md](./08-sistem.md)                                   | Sistem dan Cadangan Data              | 8    |     5 |

**Total**: 70 tabel (63 inti + 7 opsional)

## Legenda Notasi

| Notasi                 | Arti dan Ketentuan Teknis                                                                                                                                                                                                              |
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

Setiap tabel memiliki kolom bawaan **`id`** (UUIDv7, primary key), **`created_at`** dan **`updated_at`** (`timestamptz`, UTC), kecuali ada keterangan eksplisit _append-only_, _singleton_, atau _PK komposit_.

## Keterangan Tambahan Arsitektur

Kolom tambahan yang ditambahkan oleh tim arsitektur (bukan dari draf pemilik) ditandai dengan: **[Ditambah arsitektur — lihat ADR terkait]**.

Usulan tabel di luar 70 tabel draf pemilik dimuat di bagian **"Usulan Tambahan, MENUNGGU PERSETUJUAN"** di setiap file modul.

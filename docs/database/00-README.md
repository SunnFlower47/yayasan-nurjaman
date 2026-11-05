# Spesifikasi Database — Yayasan Nurjaman Bongas Purwakarta

_Draf Spesifikasi Teknis · 70 Tabel dalam 8 Modul · Panduan Pemodelan Skema Basis Data_

> **Status Dokumen**: Draf Arsitektur Terverifikasi (Belum Diimplementasikan ke Prisma)
> **Target Implementasi**: Diterapkan bertahap per fase melalui Prisma Migration (Fase 1 s.d. 8)

## Indeks Modul & Dokumen Terkait

| Berkas                                                           | Deskripsi Modul / Panduan                                   | Fase | Tabel |
| :--------------------------------------------------------------- | :---------------------------------------------------------- | :--: | ----: |
| [01-conventions.md](./01-conventions.md)                         | Standar Konvensi Skema, Kolom Wajib, Proteksi PII & Role DB |  —   |     — |
| [02-erd-overview.md](./02-erd-overview.md)                       | Diagram Relasi Entitas (ERD) Arsitektur Global 8 Modul      |  —   |     — |
| [01-identitas-dan-akses.md](./01-identitas-dan-akses.md)         | Modul 1: Identitas, Sesi, RBAC & Jejak Audit                | 1–2  |    12 |
| [02-pengaturan-profil-media.md](./02-pengaturan-profil-media.md) | Modul 2: Profil Yayasan, Media & Pengaturan Sistem          |  2   |     7 |
| [03-anggota.md](./03-anggota.md)                                 | Modul 3: Keanggotaan, Mutasi Jabatan, KTA & Iuran           |  3   |     6 |
| [04a-keuangan-inti-jurnal.md](./04a-keuangan-inti-jurnal.md)     | Modul 4a: Bagan Akun, Kas/Bank, Transaksi & Jurnal Ganda    |  4   |    11 |
| [04b-keuangan-inti-anggaran.md](./04b-keuangan-inti-anggaran.md) | Modul 4b: Dana Terikat ISAK 35, Anggaran & Approval         |  4   |     8 |
| [05-proyek-dan-kegiatan.md](./05-proyek-dan-kegiatan.md)         | Modul 5: Proyek Purwakarta, Milestone & Pagu Dana           |  5   |     7 |
| [06-pajak.md](./06-pajak.md)                                     | Modul 6: Master Tarif Berversi, Bukti Potong, NTPN          |  6   |     6 |
| [07-konten-dan-publikasi.md](./07-konten-dan-publikasi.md)       | Modul 7: Berita, Tag, Galeri & Laporan Publik               | 8–9  |     8 |
| [08-sistem.md](./08-sistem.md)                                   | Modul 8: Jadwal Backup, Restore Event, Locks & Tokens       |  8   |     5 |
| [11-migration-plan.md](./11-migration-plan.md)                   | Panduan Migrasi Sekali Jalan & Portabilitas Docker          |  —   |     — |
| [12-reporting-queries.md](./12-reporting-queries.md)             | Kueri Pelaporan Finansial ISAK 35, Proyek & Pajak           |  —   |     — |
| [13-scenarios.md](./13-scenarios.md)                             | 8 Skenario Operasional Bisnis Yayasan                       |  —   |     — |
| [14-traceability.md](./14-traceability.md)                       | 3 Matriks Keterlacakan Regulasi, Keamanan & Akuntansi       |  —   |     — |
| [15-diff-vs-draf.md](./15-diff-vs-draf.md)                       | Rekonsiliasi Spesifikasi vs Draf Pemilik (Disahkan)         |  —   |     — |
| [99-open-questions.md](./99-open-questions.md)                   | Daftar Pertanyaan Terbuka & Kebijakan Data Anggota          |  —   |     — |

**Total Tabel Inti & Opsional**: **70 tabel** (63 tabel inti + 7 tabel fitur opsional) Sesuai Draf Resmi Pemilik.

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

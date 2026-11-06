# Rincian Fase 7 & 8: Pelaporan ISAK 35 & CMS/Backup Sistem

Dokumen ini memuat spesifikasi teknis lengkap, ruang lingkup, checklist keamanan, dan pengujian kasus negatif untuk kelompok fase pelaporan formal dan manajemen konten admin. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

### Fase 7: Pelaporan Keuangan ISAK 35, Dashboard & Ekspor Dokumen

- **Tujuan**: Menyajikan laporan keuangan formal nirlaba yang siap diaudit dan dipresentasikan ke Pembina/Donatur.
- **Ruang Lingkup**:
  - [ ] Implementasi lengkap 10 kueri agregasi pelaporan keuangan ISAK 35 (`docs/database/12-reporting-queries.md`).
  - Generator Laporan Posisi Keuangan (Neraca Nirlaba).
  - Generator Laporan Penghasilan Komprehensif (Laporan Aktivitas: Terikat & Tidak Terikat).
  - Generator Laporan Arus Kas (Metode Langsung/Tidak Langsung) & Laporan Perubahan Aset Neto.
  - Dashboard analitik keuangan untuk Pembina dan Ketua Yayasan.
  - Format cetak dokumen standar resmi (A4, kop surat yayasan, kolom tanda tangan pejabat).
  - Ekspor laporan ke PDF dan lembar kerja Excel bertipe presisi.
- **Checklist Keamanan**:
  - [ ] Akses laporan keuangan dibatasi hanya untuk peran Pembina, Ketua, Pengawas, dan Bendahara.
  - [ ] Rekonsiliasi matematis: Neraca wajib seimbang antara Aset dengan Liabilitas + Aset Neto.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Editor Konten atau Staf Lapangan mencoba mengakses laporan ISAK 35 ditolak (403).
  - [ ] Ekspor laporan pada rentang tanggal tidak valid (tanggal awal > akhir) ditolak Zod (422).

---

### Fase 8: Manajemen Konten Admin (CMS) & Backup/Restore Sistem

- **Tujuan**: Fasilitas penyusunan konten publik secara mandiri dari admin panel serta perlindungan integritas data.
- **Ruang Lingkup**:
  - Skema database Article, ArticleCategory, MediaGallery (StorageProvider lokal/S3), SystemBackup.
  - Admin editor berita berbasis Tiptap dengan sanitasi HTML ketat.
  - Manajemen galeri foto kegiatan dengan optimasi gambar dan verifikasi _magic bytes_.
  - Modul backup basis data otomatis (dump PostgreSQL terkompresi dan terenkripsi, status replikasi offsite).
  - Mekanisme pemulihan data (_restore verification drill_ dengan validasi versi postgres, schema, dan app).
- **Checklist Keamanan**:
  - [ ] Seluruh input teks kaya disanitasi ketat di server (larangan script, iframe asing, handler inline).
  - [ ] Berkas unggahan diverifikasi ekstensi, MIME, dan biner magic bytes; nama berkas diacak UUIDv4.
  - [ ] Berkas dump backup terenkripsi dan disimpan di volume terisolasi; peringatan bila salinan offsite belum sukses.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Pengunggahan berkas executable (.exe/.sh/.php) yang di-rename menjadi .jpg ditolak pemeriksaan magic bytes (400).
  - [ ] Penyisipan payload XSS `<script>alert(1)</script>` pada artikel otomatis dibersihkan oleh sanitizer.

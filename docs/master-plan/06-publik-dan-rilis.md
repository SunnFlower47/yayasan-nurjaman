# Rincian Fase 9 & 10: Website Publik & Rilis Produksi

Dokumen ini memuat spesifikasi teknis lengkap, ruang lingkup, checklist keamanan, dan pengujian kasus negatif untuk kelompok fase peluncuran publik dan rilis produksi. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

### Fase 9: Website Publik, Transparansi & Optimasi SEO

- **Tujuan**: Membuka representasi digital yayasan kepada publik Purwakarta dan calon donatur secara profesional.
- **Ruang Lingkup**:
  - Halaman Beranda editorial dengan program unggulan dan dokumentasi resmi.
  - Halaman Profil Lembaga, Visi Misi, Sejarah, Legalitas, dan Struktur Pengurus (mengonsumsi data Fase 2).
  - Halaman Berita & Galeri Kegiatan (mengonsumsi data Fase 8).
  - Halaman Transparansi Akuntabilitas (menampilkan ringkasan laporan ISAK 35 teragregasi yang telah disetujui Ketua).
  - Halaman Kontak & Lokasi Sekretariat Bongas, Purwakarta.
  - Optimasi SEO, metadata OpenGraph, sitemap.xml, dan skor performa Core Web Vitals tinggi.
- **Checklist Keamanan**:
  - [ ] Halaman publik bersifat murni _read-only_; formulir kontak dibatasi rate limiting ketat dan captcha/honeypot.
  - [ ] Data privat pengurus/anggota (NIK, alamat rumah pribadi, nomor rekening personal) tidak pernah diekspos ke publik.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Pengiriman formulir kontak dengan spam berulang ditolak rate limiting (429).
  - [ ] Akses rute admin tersembunyi dari situs publik menghasilkan 401/404 tanpa kebocoran informasi stack trace.

---

### Fase 10: Hardening Akhir, Pentest Independen & Rilis Produksi

- **Tujuan**: Menguji ketahanan sistem secara komprehensif, audit akuntansi final, dan penyebaran ke server produksi.
- **Ruang Lingkup**:
  - Uji penetrasi independen (_simulated grey-box penetration testing_): pengujian eskalasi hak akses, bypass maker-checker, fuzzer input.
  - Audit rekonsiliasi akuntansi akhir bersama akuntan yayasan.
  - Konfigurasi produksi: Docker Compose produksi, Caddy reverse proxy dengan TLS 1.3 otomatis, backup cron off-site.
  - Dokumentasi serah terima sistem dan buku panduan operasional pengurus.
- **Checklist Keamanan**:
  - [ ] Seluruh temuan pentest berkategori High/Medium telah diselesaikan.
  - [ ] Audit ketergantungan `pnpm security:audit` bebas kerentanan High/Critical.
  - [ ] Uji skenario pemulihan bencana (_disaster recovery drill_) berhasil membangkitkan data dari dump cadangan.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Fuzzing payload terhadap seluruh endpoint tidak menyebabkan server crash atau memory exhaustion.
  - [ ] Pengujian kegagalan koneksi database menghasilkan respons HTTP 503 yang aman tanpa ekspos kredensial.

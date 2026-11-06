# Rincian Fase 3 & 4: Anggota & Keuangan ISAK 35

Dokumen ini memuat spesifikasi teknis lengkap, ruang lingkup, checklist keamanan, dan pengujian kasus negatif untuk kelompok fase keanggotaan dan akuntansi nirlaba. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

### Fase 3: Manajemen Anggota & Data Masking

- **Tujuan**: Mengelola direktori anggota, dewan pengurus, relawan, dan donatur tetap yayasan dengan perlindungan privasi.
- **Ruang Lingkup**:
  - Skema database Member, MemberCategory, MemberHistory.
  - Form pendataan anggota dengan validasi NIK opsional dan enkripsi at-rest AES-256-GCM + blind index HMAC-SHA256.
  - Antarmuka data table anggota dengan paginasi, pencarian, dan filter kategori.
  - Fitur penyamaran data (_data masking_) untuk NIK dan kontak pada tabel umum.
  - Ekspor data anggota berizin khusus dengan pencatatan audit log otomatis. Default seluruh data anggota adalah non-publik (`show_public = false`).
- **Checklist Keamanan**:
  - [ ] Data NIK tersimpan terenkripsi di PostgreSQL.
  - [ ] Penyamaran data NIK aktif secara default di antarmuka (`3201************`).
  - [ ] Ekspor data dibatasi hanya untuk Sekretaris dan Super Admin.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Percobaan injeksi SQL melalui parameter filter/search ditolak Prisma parameterized query.
  - [ ] Permintaan pembukaan data NIK tanpa izin khusus ditolak (403).

---

### Fase 4: Keuangan Inti & Akuntansi Nirlaba ISAK 35

- **Tujuan**: Membangun mesin pencatatan transaksi jurnal berimbang ganda dan pengelolaan kas/bank.
- **Ruang Lingkup**:
  - [ ] Implementasi dan validasi 8 skenario keuangan operasional nirlaba (`docs/database/13-scenarios.md`).
  - [ ] Pengujian otomatis invarian DDL dengan nama tabel asli skema basis data (keseimbangan debit=kredit, imutabilitas posted, closed period sebagai unit/integration test).
  - Skema database ChartOfAccount (COA), JournalEntry, JournalLine, CashAccount, AccountingPeriod.
  - Bagan Akun Standar Entitas Nonlaba (Aset Neto Dengan & Tanpa Pembatasan).
  - Form input kas masuk/keluar & jurnal umum dengan validasi real-time Debit = Kredit.
  - Siklus transaksi: DRAFT → PENDING APPROVAL → POSTED.
  - Mekanisme pembatalan VOID (jurnal pembalik nirubah, transaksi posted tidak dapat diedit).
  - Fitur Penguncian Periode / Tutup Buku Bulanan & Tahunan.
  - Alur Maker-Checker untuk permohonan pencairan kas.
- **Checklist Keamanan**:
  - [ ] Invarian akuntansi mutlak: Debit == Kredit ditegakkan di Service dan Transaction level.
  - [ ] Anti-self-approval: Pembuat draf dilarang menyetujui transaksinya sendiri.
  - [ ] Transaksi berstatus POSTED terkunci dari perubahan atau penghapusan fisik.
  - [ ] Rekaman mutasi keuangan selalu mencatat audit log append-only.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Transaksi jurnal dengan selisih Debit dan Kredit Rp 1 ditolak keras (422 Unprocessable Entity).
  - [ ] Permintaan edit/delete pada transaksi `POSTED` ditolak (400 Bad Request).
  - [ ] Pembuatan jurnal pada periode akuntansi berstatus `CLOSED` ditolak (400 Bad Request).

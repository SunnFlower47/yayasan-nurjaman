# 13-scenarios.md — 8 Skenario Operasional Bisnis & Alur Basis Data

> **Status Dokumen**: Wajib Dipatuhi (Normatif & Mengikat)  
> **Klasifikasi**: Validasi Alur Transaksi & Kasus Uji Bisnis  
> **Lokasi Berkas**: `docs/database/13-scenarios.md`

Dokumen ini mendeskripsikan 8 alur skenario operasional nyata Yayasan Nurjaman Bongas Purwakarta dan mutasi data yang terjadi pada tabel basis data.

---

## Skenario 1: Pendaftaran Anggota Baru & Penerbitan KTA Berfoto

1. **Pendaftaran**: Admin menginput nama, gender, tempat/tanggal lahir, dan NIK anggota.
2. **Kriptografi**: Aplikasi mengenkripsi NIK menjadi `nik_enc` via AES-256-GCM menggunakan `ENCRYPTION_KEY_ACTIVE_ID`, dan menghitung HMAC-SHA256 menjadi `nik_blind_index` via `BLIND_INDEX_SECRET`.
3. **Database Write**: Baris baru diinsert ke `members` (`status = ACTIVE`, `show_public = false`, `kta_status = NOT_ISSUED`).
4. **Penerbitan KTA**: Admin mengunggah berkas scan KTA resmi ke `media_assets` (`visibility = PRIVATE`, `storage_backend = LOCAL`).
5. **Update KTA**: Tabel `members` diupdate: `kta_no = 'KTA-2026-001'`, `kta_status = ISSUED`, `kta_issued_on = CURRENT_DATE`, `kta_photo_asset_id` menaut ke berkas media.

---

## Skenario 2: Pengeluaran Kas Program dengan Persetujuan Bertingkat

1. **Pengajuan**: Staf menginput transaksi pengeluaran di `financial_transactions` (`type = EXPENSE`, `amount = Rp 15.000.000`, `project_id` terisi, `status = DRAFT`).
2. **Evaluasi Kebijakan**: Sistem mencocokkan nominal terhadap `approval_policies`. Ditemukan aturan: transaksi > Rp 10.000.000 memerlukan 2 tahap persetujuan (Ketua & Bendahara).
3. **Request Dibentuk**: Baris `approval_requests` dibuat (`status = PENDING`). Status transaksi berubah menjadi `PENDING_APPROVAL`.
4. **Tahap 1 & 2**: Bendahara dan Ketua melakukan approval via `approval_actions` (`decision = APPROVE`). Pengecekan `forbid_self_approval` mencegah pemohon menyetujui sendiri.
5. **Posting Otomatis**: Transaksi berubah status menjadi `POSTED`, memicu pembentukan `journal_entries` dan 2 baris `journal_lines`:
   - Debit: Beban Program Proyek (Rp 15.000.000)
   - Kredit: Kas Operasional Bank (Rp 15.000.000)

---

## Skenario 3: Penerimaan Donasi Dana Terikat & Pembebasan Bertahap

1. **Penerimaan Dana**: Donatur memberikan dana terikat renovasi asrama yatim Rp 50.000.000.
2. **Master Akad**: Baris baru dibuat di `restricted_funds` (`target_amount = 50000000`, `restriction_type = PURPOSE`).
3. **Pencatatan Kas Masuk**: `financial_transactions` diinput (`type = INCOME`, `restricted_fund_id` terisi, `net_asset_class = WITH_RESTRICTION`). Saat posted, jurnal mencatat kas masuk di debit dan pendapatan terikat di kredit.
4. **Pembebasan Termin 1**: Saat pekerjaan fisik termin 1 selesai senilai Rp 20.000.000, admin menginput `restriction_releases` (`amount = 20000000`, `reason = PURPOSE_MET`).
5. **Jurnal Reklasifikasi**: Sistem otomatis membuat `journal_entries` reklasifikasi:
   - Debit: Beban Pelepasan Pembatasan Aset Neto Terikat (Rp 20.000.000)
   - Kredit: Pendapatan Pelepasan Pembatasan Aset Neto Tidak Terikat (Rp 20.000.000)

---

## Skenario 4: Penerimaan Donasi Non-Kas & Pengungkapan CaLK

1. **Penerimaan Barang**: Donatur menyumbangkan 10 unit komputer untuk pelatihan santri.
2. **Penaksiran Nilai Wajar**: Komite penaksir menetapkan estimasi nilai wajar Rp 40.000.000 (`valuation_basis = 'Harga pasar e-katalog terverifikasi'`).
3. **Pencatatan**: Baris dibuat di `in_kind_donations` (`is_recognized = true`, `quantity = 10`, `unit = 'unit'`).
4. **Pembukuan**: Jurnal umum dibuat menaut ke `in_kind_donations.journal_entry_id`:
   - Debit: Aset Peralatan Komputer (Rp 40.000.000)
   - Kredit: Pendapatan Donasi Non-Kas (Rp 40.000.000)
   - Rincian dasar valuasi otomatis dimasukkan ke lampiran Catatan Atas Laporan Keuangan (CaLK).

---

## Skenario 5: Pemotongan PPh 21 Honor Narasumber, Bukti Potong & NTPN

1. **Transaksi Honor**: Pembayaran honor narasumber pelatihan Rp 5.000.000 kepada `parties` perorangan non-pegawai.
2. **Kalkulasi Pajak**: Sistem membaca `tax_rates` PPh 21 aktif (tarif 5%). Terbentuk baris `transaction_taxes` (`base_amount = 5000000`, `rate_snapshot = 5.0000`, `tax_amount = 250000`, `treatment = WITHHOLD`).
3. **Posting Transaksi**: Penerima honor menerima kas bersih Rp 4.750.000. Jurnal mencatat:
   - Debit: Beban Honor Narasumber (Rp 5.000.000)
   - Kredit: Kas Bank (Rp 4.750.000)
   - Kredit: Hutang Pajak PPh 21 (Rp 250.000)
4. **Penerbitan Bukti Potong**: Baris baru di `withholding_slips` diterbitkan dengan nomor resmi `slip_no` (`status = ISSUED`).
5. **Penyetoran ke Kas Negara**: Bendahara menyetor ke bank persepsi dengan kode billing dan menginput NTPN di `tax_payments`. Hutang pajak dilunasi via jurnal kas keluar.

---

## Skenario 6: Tutup Buku Bulanan & Tahunan

1. **Validasi**: Seluruh transaksi bulan bersangkutan wajib berstatus `POSTED` atau `VOID` (tidak boleh ada `PENDING_APPROVAL`).
2. **Keseimbangan Jurnal**: Sistem memverifikasi $\sum \text{Debit} = \sum \text{Kredit}$.
3. **Penguncian Periode**: Baris `accounting_periods` diupdate menjadi `status = CLOSED`, `closed_at = NOW()`, `closed_by = user_id`.
4. **Penegakan Database**: Trigger menolak setiap upaya insert/update jurnal baru yang bertanggal pada periode yang telah `CLOSED`.
5. **Audit Reopen**: Jika ditemukan koreksi material, pembukaan periode wajib melalui persetujuan Ketua dan alasan dicatat di `period_status_log` (`action = REOPEN`, `reason = '...'`).

---

## Skenario 7: Pencadangan Lokal, Replikasi Offsite & Pre-Restore Snapshot

1. **Trigger Backup**: Scheduler cron worker memicu `backup_jobs` harian (`trigger = SCHEDULED`, `kind = DB_ONLY`).
2. **Eksekusi Lokal**: Worker menjalankan `pg_dump`, mencatat `postgres_version`, `schema_version`, `app_version`, `sha256`, dan mengenkripsi berkas arsip dengan kunci terpisah.
3. **Status Lokal**: `backup_jobs` berstatus `SUCCESS` (`storage_key` terisi).
4. **Replikasi Offsite**: Worker mengunggah arsip terenkripsi ke bucket S3 offsite. Jika sukses: `offsite_status = SUCCESS`, `offsite_storage_key` dan `offsite_copied_at` terisi. Jika gagal: `offsite_status = FAILED`, admin panel memunculkan banner peringatan.
5. **Simulasi Restore**: Operator meminta restore. Sistem WAJIB membuat snapshot otomatis `PRE_RESTORE` terlebih dahulu (`pre_restore_backup_id`), memvalidasi kecocokan versi PostgreSQL dan schema migrasi, baru menjalankan pemulihan.

---

## Skenario 8: Mutasi Kepengurusan Yayasan & Pembaruan Kop Surat

1. **Penerbitan SK**: Pembina menerbitkan SK mutasi pengurus baru berdasarkan akta notaris.
2. **Histori Jabatan**: Baris lama di `member_position_history` ditutup (`end_date = CURRENT_DATE`). Baris baru ditambahkan dengan `decree_ref` nomor SK baru.
3. **Pembaruan Profil**: Sekretaris memperbarui data legalitas di `foundation_profile` (`decree_no`, `letterhead_note`).
4. **Penandatangan Laporan**: Baris di `report_signatories` diperbarui menaut ke `member_id` pejabat baru yang berwenang menandatangani laporan keuangan ISAK 35.

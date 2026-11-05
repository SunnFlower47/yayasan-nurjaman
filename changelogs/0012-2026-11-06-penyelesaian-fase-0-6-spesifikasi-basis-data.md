# [ID: 0012] Penyelesaian Spesifikasi Basis Data Fase 0.6, Konvensi, ERD, dan Pembuktian DDL

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.6 (Penyelesaian Spesifikasi Basis Data & Arsitektur Pendukung)
- **Tipe Perubahan**: `docs`
- **Branch**: `docs/database-design`
- **Lingkup**: `docs/database/` (seluruh modul 00 s.d. 99, sql-snippets), `docs/ARCHITECTURE.md`, `docs/MASTER-PLAN.md`, `docs/DATABASE-SCHEMA.md`, `scripts/verify-schema-split.mjs`

---

### 1. Ringkasan Perubahan

Menyelesaikan seluruh target sisa Fase 0.6 pada branch `docs/database-design`:

1. **Penerapan Keputusan Pemilik Proyek**:

   - Menyetujui dan membakukan 4 atribut di `backup_jobs`: `postgres_version`, `schema_version`, `app_version`, dan nilai `PRE_DEPLOY` pada trigger (`docs/database/08-sistem.md` dan `docs/database/15-diff-vs-draf.md`).
   - Penetapan kolom penyimpanan `media_assets`: `storage_backend` (enum `LOCAL, S3`, default `LOCAL`) dan `bucket` (nullable text); mendokumentasikan aturan siklus hidup berkas fisik terisolasi dari soft delete di `docs/database/02-pengaturan-profil-media.md`.
   - Pemisahan salinan cadangan lokal dan offsite: penambahan atribut `offsite_status` (`NONE, PENDING, SUCCESS, FAILED`), `offsite_storage_key`, dan `offsite_copied_at` pada `backup_jobs` dengan aturan peringatan banner admin bila backup lokal sukses namun offsite gagal (`docs/database/08-sistem.md`). Kunci enkripsi backup offline dan tidak disimpan di VPS.
   - Kebijakan data anggota: NIK opsional (`nullable`), terenkripsi AES-256-GCM dengan blind index HMAC-SHA256, serta seluruh data anggota default non-publik (`show_public = false`, mematuhi UU PDP No. 27/2022) dicatat di `docs/database/99-open-questions.md`.
   - Kolom KTA tetap berada pada tabel `members`; `member_id_cards` sebagai usulan tambahan.

2. **Resolusi Duplikasi Dokumen Skema**:

   - Memvalidasi kelengkapan 70 tabel draf pemilik melalui skrip verifikasi otomatis `scripts/verify-schema-split.mjs` dengan hasil 100% tabel dan kolom tercakup tanpa ada yang hilang.
   - Mengganti monolit lama `docs/DATABASE-SCHEMA.md` menjadi penunjuk ringkas (16 baris) yang mengarahkan pembaca ke indeks modular `docs/database/00-README.md`.

3. **Penetapan Tiga ADR Baru di `docs/ARCHITECTURE.md`**:

   - **ADR-011**: Pemilihan Better Auth dengan strategi pemetaan skema domain mandiri, login multi-identitas (username & email), 2FA TOTP RFC 6238, dan invalidasi sesi berbasis `reauth_at`.
   - **ADR-012**: Model pelacakan salinan cadangan lokal dan offsite pada tabel `backup_jobs` vs tabel relasional `backup_copies` (status: MENUNGGU PERSETUJUAN SAYA).
   - **ADR-013**: Abstraksi lapisan penyimpanan berkas `StorageProvider` dengan implementasi default `LocalStorageProvider` untuk VPS tunggal dan opsi migrasi transparan ke S3 di masa depan.

4. **Konvensi, ERD, dan Dokumen Pelengkap**:

   - `docs/database/01-conventions.md`: Standar penamaan tabel/kolom snake_case, kolom wajib audit, aturan eksplisit FK `ON DELETE`, aturan pengindeksan, klasifikasi data sensitif, serta pemisahan role database `db_migrator` vs `db_app`.
   - `docs/database/02-erd-overview.md`: Diagram relasi entitas komprehensif tingkat sistem berbasis Mermaid.
   - Pemecahan modul 4 menjadi `04a-keuangan-inti-jurnal.md` dan `04b-keuangan-inti-anggaran.md` untuk menjaga ukuran berkas ketat di bawah batas 250 baris.
   - `docs/database/12-reporting-queries.md`: 6 kueri agregasi SQL untuk laporan keuangan ISAK 35 (Posisi Keuangan, Aktivitas, dan Arus Kas).
   - `docs/database/13-scenarios.md`: 8 skenario operasional bisnis nirlaba (pendaftaran anggota, donasi terikat/bebas, belanja modal proyek, pemotongan pajak, tutup buku, rilis pembatasan, dan backup offsite).
   - `docs/database/14-traceability.md`: Tiga matriks keterlacakan regulasi, strategi migrasi expand-contract, dan validasi kompatibilitas pra-restore.
   - `docs/database/99-open-questions.md`: Dokumentasi asumsi akuntansi, pajak, dan perlindungan privasi yang memerlukan verifikasi pihak berwenang.

5. **Eksperimen & Pembuktian DDL Invarian di PostgreSQL Docker**:
   - Berhasil menguji 5 invarian database inti pada container PostgreSQL 17 terisolasi dan menyimpan skrip reproduksinya di `docs/database/sql-snippets/`:
     - `01-unbalanced-journal.sql`: Validasi keseimbangan jurnal (penolakan status POSTED jika Debit != Kredit).
     - `02-immutable-posted-journal.sql`: Imutabilitas jurnal posted (penolakan modifikasi atau penghapusan transaksi posted).
     - `03-closed-period.sql`: Penolakan pencatatan transaksi pada periode akuntansi berstatus CLOSED/LOCKED.
     - `04-overlapping-tax-rates.sql`: Pencegahan tumpang tindih tanggal efektif tarif pajak menggunakan constraint `EXCLUDE USING gist`.
     - `05-audit-log-permissions.sql`: Hak akses peran `db_app` append-only (penolakan UPDATE/DELETE pada tabel audit log).

---

### 2. Verifikasi Kualitas & Batas Arsitektur

- **Batas Ukuran Berkas**: Seluruh 26 berkas di `docs/` dan `docs/database/` berada ketat di bawah batas 250 baris per berkas (termasuk `MASTER-PLAN.md` yang dipadatkan menjadi 101 baris).
- **Integritas Kode Domain**: Tidak ada kode domain yang dibuat atau diubah di folder `src/` atau `prisma/`.
- **Keamanan Secrets**: Pemindaian `pnpm secrets:scan` bersih dari kunci rahasia.
- **Pemeriksaan Lintas Lapis**: Linter, typecheck, dan arsitektur `check-layers` lolos tanpa galat.

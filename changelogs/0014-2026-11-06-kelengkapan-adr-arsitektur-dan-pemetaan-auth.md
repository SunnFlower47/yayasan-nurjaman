# [ID: 0014] Kelengkapan 22 ADR Arsitektur, Pemetaan Autentikasi, dan Modularisasi Dokumen Arsitektur

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.6 (Arsitektur Sistem & Spesifikasi Keputusan Teknis)
- **Tipe Perubahan**: `docs`
- **Branch**: `docs/database-design`
- **Lingkup**: `docs/ARCHITECTURE.md`, `docs/architecture/` (`00-index.md` s.d. `04c-adr-database-dan-sistem.md`), `docs/database/15-diff-vs-draf.md`, `docs/MASTER-PLAN.md`, `docs/master-plan/`, `AGENTS.md`

---

### 1. Ringkasan Perubahan

1. **Koreksi Terminologi Login (Koreksi terhadap Catatan Changelog 0012)**:

   - Mengoreksi pernyataan "login multi-identitas" pada Changelog 0012 tanpa mengubah berkas historis tersebut.
   - **Ketetapan Final Pemilik**: Mekanisme login resmi **HANYA menggunakan username + password (+ 2FA TOTP)**. Alamat email **HANYA digunakan untuk penerimaan token reset password dan notifikasi kelembagaan**, bukan sebagai kredensial masuk.

2. **Penetapan dan Pemutakhiran Status ADR Existing**:

   - **ADR-011**: Status ditetapkan **MENUNGGU PERSETUJUAN SAYA** sampai pemilik mengevaluasi hasil analisis mendalam Tugas 2 (Better Auth vs Auth Tipis Buatan Sendiri).
   - **ADR-012 (Model Pelacakan Salinan Cadangan Offsite)**: Status diresmikan menjadi **DIPUTUSKAN** (menggunakan kolom langsung `offsite_status`, `offsite_storage_key`, `offsite_copied_at` pada `backup_jobs`).
   - **ADR-013 (Abstraksi Lapisan Penyimpanan Media)**: Status diresmikan menjadi **DIPUTUSKAN** (menggunakan interface `StorageProvider` dengan implementasi bawaan `LocalStorageProvider` pada volume bernama Docker).

3. **Perumusan 9 ADR Baru (ADR-014 s.d. ADR-022)**:

   - **ADR-014 (Strategi Primary Key & Penomoran Dokumen)**: PK internal menggunakan UUID acak/unguessable (anti-IDOR); penomoran dokumen manusiawi (`JV/...`, `KTA/...`) disimpan di kolom terpisah yang dihasilkan tanpa celah (_gapless_) via sequence table dengan pessimistic row lock (`FOR UPDATE`). Status: **DIPUTUSKAN**.
   - **ADR-015 (Pembakuan Tipe Data Nilai Finansial)**: Menyelesaikan ambiguitas ADR-005 dengan memutuskan SATU tipe data: **`BIGINT` (Integer Rupiah)** untuk seluruh nilai uang tanpa sen. Status: **DIPUTUSKAN**.
   - **ADR-016 (Standarisasi Tipe Data Penanggalan)**: Tipe `DATE` murni untuk tanggal bisnis (bebas pergeseran timezone); tipe `TIMESTAMPTZ` (UTC) untuk jejak teknis sistem. Status: **DIPUTUSKAN**.
   - **ADR-017 (Model Otorisasi RBAC Multi-Role)**: Pengguna dapat memiliki banyak peran via `user_roles`; katalog permission didefinisikan secara tegas di kode TypeScript (_code-sourced_) dan dievaluasi via _union_ izin. Status: **DIPUTUSKAN**.
   - **ADR-018 (Pemisahan Transaksi Bisnis dari Jurnal Akuntansi)**: Transaksi operasional (kas, proyek, iuran) dicatat pada tabel modul domain, dan memicu jurnal akuntansi ganda berimbang di `journal_entries`. Status: **DIPUTUSKAN**.
   - **ADR-019 (Kebijakan Penghapusan Data & Enum/Lookup)**: Imutabilitas transaksi `POSTED`, append-only audit trail, soft delete master data, serta pemisahan tegas antara ENUM sistem dan lookup tables dinamis. Status: **DIPUTUSKAN**.
   - **ADR-020 (Skema Basis Data Multi-Berkas Prisma)**: Mengaktifkan fitur resmi `prismaSchemaFolder` pada Prisma 6.4.1 terpasang untuk membagi skema 70 tabel ke `prisma/schema/*.prisma`. Status: **DIPUTUSKAN**.
   - **ADR-021 (Strategi Konkurensi & Locking)**: Optimistic locking via kolom `version`, pessimistic row lock untuk penomoran dokumen, dan tingkat isolasi `REPEATABLE READ` untuk pembukuan jurnal. Status: **DIPUTUSKAN**.
   - **ADR-022 (Arsitektur Single-Tenant)**: Sistem dan basis data didedikasikan 100% untuk satu entitas (Yayasan Nurjaman Bongas Purwakarta) tanpa kolom `tenant_id`. Status: **DIPUTUSKAN**.

4. **Analisis Mendalam Pemetaan Auth (Tugas 2 pada ADR-011 & Diff Draf)**:

   - Memetakan secara eksplisit skema 4 model Better Auth (`user`, `session`, `account`, `verification`) serta plugin `username` dan `twoFactor` terhadap 12 tabel Modul 1 draf pemilik.
   - Membandingkan Jalan 1 (Better Auth dengan custom mapping) versus Jalan 2 (Auth Tipis Buatan Sendiri / _Lightweight In-House Auth_).
   - Memberikan rekomendasi teknis tegas: **Jalan 2 (Auth Tipis Buatan Sendiri)** direkomendasikan karena 100% mempertahankan 12 tabel draf pemilik tanpa menambah tabel asing (`account`, `verification`) dan selaras dengan sistem tertutup internal yayasan.
   - Mencatat seluruh potensi deviasi tabel jika Jalan 1 dipilih ke dalam `docs/database/15-diff-vs-draf.md` sebagai "diubah karena library auth, MENUNGGU PERSETUJUAN".

5. **Pembaruan Status Fase 0.6**:

   - Memperbarui status Fase 0.6 pada tabel master di `docs/MASTER-PLAN.md`, `docs/master-plan/00-index.md`, dan `docs/master-plan/01-fondasi-dan-setup.md` dari "Selesai" menjadi **"Berjalan"**.

6. **Modularisasi Dokumen Arsitektur (`docs/architecture/`)**:
   - Memecah uraian teknis arsitektur ke dalam folder `docs/architecture/` (`01-stack-dan-struktur.md`, `02-alur-dan-keamanan.md`, `03-docker-first.md`, `04a-...`, `04b-...`, `04c-...`) guna menjaga seluruh berkas di bawah 250 baris tanpa memadatkan atau menghilangkan teks.
   - Menjaga seluruh 18 judul asli di `docs/ARCHITECTURE.md` tetap utuh sebagai indeks induk sistem.

---

### 2. Verifikasi Mutu & Integritas Lingkungan

- **Batas Ukuran Berkas**: Seluruh berkas di `docs/architecture/` dan `docs/ARCHITECTURE.md` berada di bawah 250 baris per berkas.
- **Keterpeliharaan Kode**: Direktori `src/` dan `prisma/` bersih dari perubahan (0 file diff).
- **Pemindaian Rahasia & Arsitektur**: `pnpm check` dan `pnpm secrets:scan` lolos tanpa peringatan/galat.

# 4c. ADR: Standar Basis Data, Konkurensi & Arsitektur Sistem

Dokumen ini memuat Architectural Decision Records (ADR) nomor 014 s.d. 022 untuk sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen induk: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).

---

### ADR-014: Strategi Primary Key & Penomoran Dokumen Bisnis Tanpa Celah

- **Konteks**: Memilih identifikasi unik rekaman basis data yang aman dari serangan enumerasi dan mekanisme penomoran dokumen resmi yayasan (kuitansi, nomor jurnal, KTA).
- **Opsi**:
  1. Primary Key Auto-increment (BIGSERIAL/IDENTITY) sekaligus sebagai nomor dokumen.
  2. Primary Key UUID acak (UUIDv4 / CUID2 / UUIDv7) dan nomor dokumen di kolom terpisah yang dihasilkan via sequence table.
- **Trade-off**:
  Auto-increment integer membocorkan volume transaksi organisasi, mudah ditebak (_Insecure Direct Object Reference / IDOR_), dan menyulitkan penggabungan data. Namun penomoran dokumen manusiawi (misal: `JV/2026/11/0001`) tetap dibutuhkan pengurus dan akuntan yayasan secara urut tanpa celah (_gapless_).
- **Rekomendasi Tegas**:
  1. **Primary Key Internal Wajib Non-Berurutan & Tidak Bisa Ditebak**: Seluruh tabel menggunakan UUIDv4/CUID2 (`VARCHAR(36)` atau native UUID) yang dihasilkan aplikasi atau PostgreSQL `gen_random_uuid()`.
  2. **Nomor Dokumen Manusiawi di Kolom Terpisah**: Disimpan pada kolom bisnis terpisah (`entry_number`, `receipt_no`, `kta_no`) dengan constraint `UNIQUE`.
  3. **Penomoran Tanpa Celah (_Gapless Sequence Table_)**: Dihasilkan melalui tabel khusus `document_sequences` dengan penguncian baris pesimistik (`SELECT next_val FROM document_sequences WHERE code = $1 FOR UPDATE`) di dalam transaksi DB, mencegah celah nomor akibat rollback atau tabrakan konkurensi.
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/01-conventions.md` Bagian 2 & 5)_.

---

### ADR-015: Pembakuan Tipe Data Nilai Finansial (Satu Keputusan Tegas)

- **Konteks**: Menyelesaikan ambiguitas pada ADR-005 lama yang menyebut "BigInt / Decimal", serta menetapkan tipe data tunggal untuk seluruh nilai uang di basis data.
- **Opsi**:
  1. `DOUBLE PRECISION` / Float.
  2. `DECIMAL(19,4)` / `NUMERIC`.
  3. `BIGINT` (Integer Rupiah).
- **Trade-off**:
  Float mutlak dilarang karena kelemahan representasi pecahan biner. Decimal/Numeric mendukung pecahan tetapi memerlukan overhead konversi string di Node.js. Karena mata uang operasional yayasan adalah Rupiah Indonesia (IDR) yang tidak memiliki satuan pecahan sen dalam transaksi riil, `BIGINT` (64-bit integer hingga Rp 9.223.372.036.854.775.807) menjamin presisi mutlak tanpa kompromi, operasi aritmatika native JavaScript `BigInt` yang sangat cepat, dan eliminasi total galat pembulatan. Untuk tarif/persentase pajak tetap menggunakan `NUMERIC(5,2)`.
- **Rekomendasi Tegas**: **Memutuskan SATU Tipe Data: `BIGINT` (Integer Rupiah)** untuk seluruh kolom nilai uang (`amount`, `debit`, `credit`, `budget_limit`, `balance`, `tax_base`, `withheld_amount`).
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/01-conventions.md` Bagian 2.1)_.

---

### ADR-016: Standarisasi Tipe Data Penanggalan Bisnis vs Jejak Waktu Sistem

- **Konteks**: Mencegah pergeseran tanggal laporan keuangan akibat konversi zona waktu (UTC vs Asia/Jakarta WIB).
- **Opsi**:
  1. Seluruh tanggal dan waktu menggunakan `TIMESTAMPTZ`.
  2. Pemisahan tegas: tipe `DATE` murni untuk tanggal bisnis, dan tipe `TIMESTAMPTZ` untuk jejak waktu teknis sistem.
- **Trade-off**:
  Jika tanggal transaksi bisnis (misal: 6 November 2026) disimpan sebagai timestamp UTC, query laporan berbasis tanggal lokal rentan bergeser ke hari sebelumnya (5 November) akibat konversi offset zona waktu +07:00. Tipe `DATE` merepresentasikan tanggal kalender murni tanpa terpengaruh pergeseran jam.
- **Rekomendasi Tegas**:
  1. **`DATE`**: Wajib digunakan untuk seluruh atribut tanggal peristiwa bisnis (tanggal transaksi, tanggal kuitansi, tanggal lahir anggota, batas periode buku `start_date`/`end_date`, tanggal efektif tarif).
  2. **`TIMESTAMPTZ`** (`timestamp with time zone`, disimpan dalam UTC): Wajib digunakan untuk jejak audit sistem (`created_at`, `updated_at`, `deleted_at`, `expires_at`, `assigned_at`, `timestamp`).
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/01-conventions.md` Bagian 2.1)_.

---

### ADR-017: Model Otorisasi RBAC Multi-Role & Katalog Permission Bersumber Kode

- **Konteks**: Mengelola hak akses dinamis bagi 7 tingkatan peran pengurus yayasan tanpa mengorbankan type-safety kode aplikasi.
- **Opsi**:
  1. Role tunggal statis pada tabel user (`users.role enum`).
  2. RBAC dinamis murni di mana permission dibuat bebas dari UI admin.
  3. RBAC Multi-Role dengan Katalog Izin Bersumber Kode (_Code-Sourced Permission Catalog_).
- **Trade-off**:
  Opsi 1 kaku (seseorang tidak bisa merangkap peran Pembina dan Pengawas). Opsi 2 rawan desinkronisasi saat kode memanggil `requirePermission('finance:post')` tetapi string tersebut terhapus di database. Opsi 3 memisahkan katalog izin yang stabil di kode dengan penugasan fleksibel banyak peran ke pengguna.
- **Rekomendasi Tegas**: Menggunakan **RBAC Multi-Role dengan Katalog Permission Bersumber Kode**:
  - Pengguna dapat memiliki banyak peran via tabel relasi `user_roles`.
  - Daftar permission (`PermissionKey`) didefinisikan secara tegas di kode TypeScript (`src/modules/auth/permissions.ts`), lalu disinkronkan ke tabel referensi `permissions` saat migrasi skema/seeding.
  - Pengecekan izin server (`requirePermission`) mengevaluasi gabungan (_union_) izin dari seluruh peran aktif pengguna.
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/01-identitas-dan-akses.md`)_.

---

### ADR-018: Pemisahan Transaksi Operasional Bisnis dari Jurnal Akuntansi

- **Konteks**: Memilih relasi antara pencatatan operasional (kuitansi kas, pencairan termin proyek, iuran anggota, setoran pajak) dengan penjurnalan akuntansi ISAK 35.
- **Opsi**:
  1. Jurnal tunggal: Seluruh transaksi operasional langsung dicatat pada tabel `journal_entries` dengan kolom kustom.
  2. Pemisahan entitas: Transaksi operasional bisnis dicatat pada tabel domain masing-masing, kemudian saat disahkan membentuk rekaman jurnal berimbang ganda di `journal_entries`.
- **Trade-off**:
  Opsi 1 mengotori tabel akuntansi dengan puluhan kolom khusus modul proyek atau anggota. Opsi 2 memisahkan _business transaction event_ dari _accounting ledger_, memungkinkan pembukuan otomatis tanpa membingungkan operator lapangan.
- **Rekomendasi Tegas**: **Transaksi Operasional Dipisah dari Jurnal Akuntansi**. Seluruh peristiwa bisnis (`transactions`, `project_disbursements`, `member_dues`) dicatat pada tabel modul domain, dan saat berstatus disahkan, memicu pembentukan `journal_entries` dan `journal_entry_lines` (debit == credit) yang mereferensikan sumbernya via `source_type` dan `source_id`.
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/04a-keuangan-inti-jurnal.md` & `05-proyek-dan-kegiatan.md`)_.

---

### ADR-019: Kebijakan Penghapusan Data (Soft vs Hard vs Append-Only) dan Enum vs Lookup

- **Konteks**: Standarisasi penanganan siklus hidup data dan pemilihan antara ENUM basis data versus tabel referensi (lookup table).
- **Opsi & Trade-off**:
  - Data finansial tidak boleh hilang untuk audit integritas.
  - Status alur kerja (_state machine_) yang terikat logika program memerlukan validasi tipe ketat di database.
  - Kategori bisnis yang dikelola mandiri oleh admin membutuhkan fleksibilitas penambahan tanpa rilis kode baru.
- **Rekomendasi Tegas**:
  1. **Klasifikasi Penghapusan**:
     - _Dilarang Dihapus Mutlak_: Transaksi keuangan `POSTED` dilarang dihapus baik soft maupun hard (hanya boleh melalui jurnal pembalik VOID).
     - _Append-Only_: Tabel log audit (`audit_logs`, `security_events`, `period_status_log`) tidak mengenal edit maupun delete (hak akses dicabut di level role database `db_app`).
     - _Soft Delete_: Entitas master (`members`, `projects`, `articles`, `users`) menggunakan kolom `deleted_at TIMESTAMPTZ NULL` untuk menjaga keutuhan relasi historis.
  2. **Enum vs Lookup Tables**:
     - _PostgreSQL ENUM / DB Check Constraint_: Digunakan untuk state machine sistem yang stabil (status jurnal `DRAFT, POSTED, VOID`, peran sistem bawaan, status offsite `NONE, PENDING, SUCCESS, FAILED`, backend `LOCAL, S3`).
     - _Lookup Tables_: Digunakan untuk entitas klasifikasi bisnis dinamis yang dapat ditambah pengurus dari UI admin (`member_categories`, `article_categories`, `tax_types`, `chart_of_accounts`).
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/01-conventions.md` Bagian 3)_.

---

### ADR-020: Skema Basis Data Multi-Berkas Prisma (`prismaSchemaFolder`)

- **Konteks**: Basis data yayasan terdiri dari 70 tabel terstruktur dalam 8 modul domain. Menggabungkan seluruh tabel ke dalam satu berkas `schema.prisma` monolitik akan menghasilkan ribuan baris kode yang melanggar standar clean code (maksimal 250 baris per berkas).
- **Opsi**:
  1. Berkas tunggal `schema.prisma` raksasa (>1.500 baris).
  2. Pemecahan skema multi-berkas menggunakan skrip penggabungan build manual.
  3. Fitur resmi Prisma Multi-File Schema via `prismaSchemaFolder` pada direktori `prisma/schema/`.
- **Trade-off**:
  Opsi 1 melanggar batasan ukuran berkas proyek dan menyulitkan pemeliharaan modular. Opsi 2 rapuh terhadap urutan konkatenasi. Opsi 3 adalah fitur resmi Prisma yang didukung penuh pada versi terpasang (`@prisma/client: 6.4.1` dan `prisma: 6.4.1`).
- **Rekomendasi Tegas**: Mengaktifkan **Prisma Multi-File Schema (`prismaSchemaFolder`)** pada folder `prisma/schema/*.prisma` saat memasuki Fase 1 nanti.
- **Status**: **DIPUTUSKAN**.

---

### ADR-021: Strategi Konkurensi, Optimistic Locking & Isolation Level Transaksi

- **Konteks**: Mencegah tabrakan pembaruan data bersamaan (_lost updates_) dan menjamin konsistensi saldo akuntansi saat penjurnalan paralel.
- **Opsi**:
  1. Default database `READ COMMITTED` tanpa locking eksplisit.
  2. Penguncian pesimistik menyeluruh atau tingkat isolasi `SERIALIZABLE` untuk seluruh operasi.
  3. Kombinasi terarah: Optimistic Locking (`version`) pada entitas bisnis, Pessimistic Row Lock pada penomoran urut, dan isolasi `REPEATABLE READ` pada pembukuan akuntansi.
- **Trade-off**:
  Opsi 1 rentan penomoran kembar dan penimpaan data draf. Opsi 2 menyebabkan deadlock massal dan degradasi performa transaksi. Opsi 3 menyeimbangkan integritas data dengan performa tinggi.
- **Rekomendasi Tegas**:
  1. **Optimistic Locking**: Seluruh entitas dokumen mutasi (`journal_entries`, `transactions`, `projects`) memuat kolom `version INT NOT NULL DEFAULT 1`. Pembaruan wajib memverifikasi `version` sama dan menaikkannya $+1$. Jika terjadi benturan konkurensi, sistem mengembalikan galat HTTP 409 Conflict.
  2. **Pessimistic Row Lock untuk Penomoran Dokumen**: Kueri alokasi nomor urut sequence wajib menggunakan `SELECT ... FOR UPDATE` dalam transaksi database terisolasi.
  3. **Tingkat Isolasi `REPEATABLE READ` untuk Posting Jurnal**: Eksekusi pembukuan status `POSTED` dan penutupan buku tahunan dijalankan pada tingkat isolasi `REPEATABLE READ` guna mencegah fenomena _phantom read_ atau pergeseran saldo di tengah agregasi.
- **Status**: **DIPUTUSKAN**. _(Rujukan: `docs/database/01-conventions.md` Bagian 5)_.

---

### ADR-022: Arsitektur Single-Tenant Sistem Kelembagaan Yayasan

- **Konteks**: Menentukan cakupan batasan organisasi pada struktur basis data dan aplikasi.
- **Opsi**:
  1. Multi-tenant (banyak entitas yayasan dalam satu basis data dengan kolom `tenant_id` di setiap tabel).
  2. Single-tenant (didedikasikan secara eksklusif hanya untuk satu entitas: Yayasan Nurjaman Bongas Purwakarta).
- **Trade-off**:
  Multi-tenant memperkenalkan risiko fatal kebocoran data antar-organisasi jika klausa `WHERE tenant_id = ?` terlewat di repository query, serta membatasi kustomisasi bagan akun (COA) spesifik nirlaba lokal. Sistem ini dibangun khusus untuk Yayasan Nurjaman Bongas Purwakarta sebagai platform institusional mandiri.
- **Rekomendasi Tegas**: Menerapkan **Arsitektur Single-Tenant**. Seluruh 70 tabel basis data tidak memuat kolom `tenant_id`. Struktur COA, aturan persetujuan, konfigurasi profil, dan domain dioptimasi penuh secara independen untuk Yayasan Nurjaman Bongas Purwakarta.
- **Status**: **DIPUTUSKAN**.

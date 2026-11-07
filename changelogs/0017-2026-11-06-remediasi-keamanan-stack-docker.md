# [ID: 0017] Remediasi Temuan Keamanan & Penguatan Stack Docker Fase 0.7

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.7 (Stack Docker Lengkap - Penguatan Keamanan)
- **Tipe Perubahan**: `security`, `config`, `docs`
- **Branch**: `feat/docker-stack`
- **Lingkup**: `docker/caddy/Caddyfile`, `docker/postgres/init/01-init-roles.sh`, `docker-compose.prod.yml`, `.env.example`, `docker/backup/`, `docs/architecture/`

---

### 1. Ringkasan Perubahan

1. **Kedaulatan & Kepemilikan Tunggal Header Keamanan (ADR-024)**:

   - Menghapus manipulasi CSP dan HSTS tingkat global pada reverse proxy Caddy (`docker/caddy/Caddyfile`) yang sebelumnya menimpa CSP dinamis berbasis nonce per-request milik aplikasi.
   - Menetapkan aplikasi (`src/middleware.ts`) sebagai pemilik tunggal CSP dinamis, HSTS (2 tahun = 63072000 detik), dan header keamanan halaman web.
   - Caddy secara independen mengelola proteksi rute direktori `/uploads/*` dengan `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, dan `Content-Disposition: attachment` untuk berkas non-gambar.
   - Terverifikasi: respons Next.js di lingkungan produksi bebas dari `'unsafe-eval'`.

2. **Penerapan Prinsip Hak Akses Minimal Basis Data (Least Privilege)**:

   - Menghapus seluruh kata sandi bernilai tetap dari `docker-compose.prod.yml` dan mewajibkan injeksi nilai via variabel lingkungan (`${VAR:?error}`).
   - Membuat skrip inisialisasi peran idempoten `docker/postgres/init/01-init-roles.sh`:
     - `db_migrator`: Pemilik skema `public`, memiliki hak DDL, dipakai oleh layanan `migrate` dan `restore-worker`.
     - `db_app`: Hak akses minimal DML (`SELECT, INSERT, UPDATE, DELETE`), dilarang keras melakukan DDL (`CREATE TABLE`), bukan superuser, dipakai oleh layanan aplikasi `app`.
     - `db_backup`: Hak akses baca `SELECT` untuk `pg_dump`, bukan superuser, dipakai oleh `backup-worker`.
   - Terverifikasi: eksekusi `CREATE TABLE` oleh `db_app` ditolak dengan `permission denied for schema public`.

3. **Pencadangan Terenkripsi Terautentikasi dengan Restic (ADR-025)**:

   - Menggantikan enkripsi OpenSSL AES-256-CBC dengan `restic` yang menyediakan enkripsi terautentikasi (AES-256 Poly1305 / ChaCha20-Poly1305).
   - Memasang utilitas `restic` dan `supercronic` pada `docker/backup/Dockerfile`.
   - Mengintegrasikan pemindaian integritas kriptografis penuh (`restic check --read-data-subset=100%`) sebelum proses pemulihan dieksekusi.
   - Terverifikasi: manipulasi 1 byte pada berkas data pack cadangan ditolak secara mutlak dengan pesan `ciphertext verification failed` dan pemulihan langsung dibatalkan.

4. **Uji Pemulihan Bencana Nyata (True Disaster Recovery Drill)**:

   - Membaca `schema_version` secara dinamis dari tabel `_prisma_migrations` (bernilai `"none"` bila skema belum bermigrasi).
   - Melakukan simulasi bencana: membuat tabel `test_disaster_recovery` beserta data dan berkas privat `dokumen_rahasia_yayasan.pdf`, mengekspor cadangan ke host, menghapus seluruh kontainer dan volume (`down -v`), menyalakan basis data kosong, lalu mengeksekusi pemulihan via `restore-worker`.
   - Terverifikasi: seluruh baris tabel dan berkas privat kembali dengan konten dan hash SHA-256 yang identik secara biner (`0d47092342708b8290ceb0782eb5866223d5cc2a31ef6e363e42e89aabc4e4f7`).
   - Klarifikasi tabel: "1 tabel" yang dihitung pada pengujian sebelumnya adalah tabel sistem penjejak Prisma `_prisma_migrations`.

5. **Pencadangan Terjadwal, Retensi Otomatis & Isolasi Volume**:
   - Memasang `supercronic` pada `backup-worker` dengan jadwal yang dapat dikonfigurasi melalui `BACKUP_CRON_SCHEDULE`.
   - Kebijakan retensi otomatis dijalankan via `restic forget --keep-daily ${RETENTION_DAYS} --keep-last ${RETENTION_KEEP} --prune`.
   - Memberikan peringatan peringatan keras ketika penyimpanan salinan offsite S3 belum dikonfigurasi.
   - Pemasangan volume unggahan bersifat _read-only_ (`:ro`) pada `backup-worker`, sementara pemulihan bencana dilakukan melalui jalur layanan terpisah (`restore-worker`).

---

### 2. Dokumen Terkait

- `docs/architecture/04a-adr-fondasi-dan-keamanan.md`: Menambahkan **ADR-024** (Penetapan Kepemilikan Tunggal Header Keamanan: Aplikasi vs Reverse Proxy).
- `docs/architecture/04c-adr-database-dan-sistem.md`: Menambahkan **ADR-025** (Pemilihan Restic untuk Enkripsi Cadangan Terautentikasi & Dukungan S3 Bawaan).
- `docs/architecture/00-index.md` & `docs/ARCHITECTURE.md`: Memperbarui indeks ADR arsitektur sistem.

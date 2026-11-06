# [ID: 0016] Stack Docker Lengkap untuk Lingkungan Pengembangan (Dev) dan Produksi (Prod)

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.7 (Stack Docker Lengkap)
- **Tipe Perubahan**: `chore`, `config`, `docs`
- **Branch**: `feat/docker-stack`
- **Lingkup**: `docker-compose.yml`, `docker-compose.prod.yml`, `Dockerfile`, `docker/caddy/Caddyfile`, `docker/backup/`, `docs/deploy/RUNBOOK.md`, `.env.example`

---

### 1. Ringkasan Perubahan

1. **Stack Pengembangan (`docker-compose.yml`)**:

   - Menambahkan layanan aplikasi Next.js (`app`) dengan target build `dev` untuk mendukung hot reloading secara langsung melalui sinkronisasi volume lokal.
   - Layanan basis data PostgreSQL menggunakan image resmi `postgres:17.2-bookworm` (Debian) sesuai ADR-023.
   - Binding port basis data PostgreSQL dibatasi **HANYA** ke antarmuka loopback lokal host (`127.0.0.1:5432:5432`), mencegah paparan port ke jaringan luar.
   - Pemeriksaan kesehatan (`healthcheck`) pada PostgreSQL terintegrasi dengan dependensi `service_healthy` pada layanan `app`.

2. **Stack Produksi Terisolasi Penuh (`docker-compose.prod.yml`)**:

   - **`reverse-proxy` (Caddy 2.9.1 Alpine)**: Menjadi **SATU-SATUNYA** layanan yang mempublikasikan port ke host publik (`80` dan `443`). Mengelola TLS otomatis, enkripsi transit, dan penyajian aset statis publik.
   - **`app` (Next.js Standalone Runner)**: Dijalankan dengan user non-root (`nextjs:nodejs` UID 1001), filesystem akar bersifat _read-only_ (`read_only: true`), `tmpfs` untuk direktori `/tmp` dan `/app/.next/cache`, serta **TIDAK** mempublikasikan port ke host publik.
   - **`postgres` (PostgreSQL 17.2 Debian Bookworm)**: Pinned image eksak, terhubung murni ke jaringan internal terisolasi `yayasan_internal`, tanpa paparan port ke host publik.
   - **`migrate` (Layanan Sekali Jalan)**: Layanan _ephemeral one-off_ (`restart: "no"`) yang menjalankan `npx prisma migrate deploy` sebelum aplikasi Next.js menerima trafik.
   - **`backup-worker` (Worker Cadangan Terpisah)**: Menggunakan base image Debian Bookworm dengan versi PostgreSQL client (`17.2`) yang identik secara biner dengan server database, tanpa paparan port ke host.
   - **Isolasi Volume Bernama**:
     - `uploads_private`: Berisi data sensitif privat (bukti kuitansi, scan KTA, bukti potong pajak) yang **TIDAK PERNAH** dimount ke container Caddy.
     - `uploads_public`: Dimount secara _read-only_ (`:ro`) ke reverse proxy Caddy untuk penyajian langsung via rute `/uploads/*`.
     - `postgres_data`, `backups_data`, `caddy_data`, `caddy_config`.

3. **Multi-Stage Dockerfile Multi-Platform (`Dockerfile`)**:

   - Mendukung arsitektur ganda `linux/amd64` (VPS produksi) dan `linux/arm64` (laptop pengembang ARM).
   - Menyediakan target modular: `deps` (pemasangan dependensi frozen lockfile), `dev` (server pengembangan hot reload), `builder` (kompilasi Next.js standalone), `migrator` (eksekusi migrasi DDL Prisma), dan `runner` (distribusi produksi standalone minimal).

4. **Konfigurasi Reverse Proxy (`docker/caddy/Caddyfile`)**:

   - Header keamanan baku OWASP ASVS L2: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy`, `X-XSS-Protection`, dan penghapusan header `Server`.
   - Penyajian direktori statis `/uploads/*` dari volume publik dan reverse proxy trafik dinamis ke `http://app:3000`.

5. **Otomasi Pencadangan & Pemulihan (`docker/backup/`)**:

   - `backup.sh`: Mengeksekusi dump logis `pg_dump -Fc`, mengarsipkan volume uploads, menghitung integritas SHA-256, mengenkripsi arsip menggunakan OpenSSL symmetric AES-256-CBC PBKDF2 salt, mencatat metadata lingkungan (`postgres_version`, `schema_version`, `app_version`, `checksums`) ke dalam `manifest.json`, serta menampilkan peringatan keras jika konfigurasi offsite S3 belum disetel.
   - `restore.sh`: Memvalidasi manifest, memeriksa versi server PostgreSQL target (menolak secara keras jika server target lebih tua dari versi cadangan), memvalidasi integritas biner SHA-256 berkas terdekripsi, menjalankan `pg_restore --clean --if-exists`, dan memulihkan volume unggahan.

6. **Panduan Operasional Standar (`docs/deploy/RUNBOOK.md`)**:

   - Menjelaskan tata cara deploy VPS pertama kali, mitigasi bahaya Docker mem-bypass firewall UFW di Linux, urutan sakral deployment 3 langkah, prosedur pemindahan mesin (_cross-machine transfer_) beserta kewajiban transfer seluruh kunci kriptografi identik, drill simulasi pemulihan berkala, dan perintah kompilasi Docker Buildx multi-arch.

7. **Templat Konfigurasi Lingkungan (`.env.example`)**:
   - Mencakup seluruh variabel wajib: kredensial basis data, `AUTH_SECRET`, key ring enkripsi aplikasi multi-kunci `ENCRYPTION_KEYS`, kunci HMAC blind index `BLIND_INDEX_SECRET`, kunci enkripsi cadangan `BACKUP_ENCRYPTION_KEY`, nama domain Caddy, dan konfigurasi offsite S3.

---

### 2. Hasil Verifikasi Pengujian

1. **Uji Validasi Sintaks Konfigurasi**:
   `docker compose -f docker-compose.prod.yml config` berhasil memvalidasi seluruh relasi layanan, volume, dan isolasi jaringan.
2. **Uji Stack Pengembangan (Dev)**:
   `docker compose up -d` -> `docker compose ps` -> `curl.exe http://localhost:3000/api/health` merespons status `200 OK` dengan status database `connected` (latensi 2ms). Stack dibersihkan dengan `docker compose down`.
3. **Uji Port Publikasi Produksi**:
   `docker compose -f docker-compose.prod.yml ps` membuktikan secara deterministik bahwa **HANYA** layanan `reverse-proxy` (Caddy) yang mempublikasikan port ke host (`0.0.0.0:80->80/tcp` dan `0.0.0.0:443->443/tcp`). Port aplikasi Next.js (`3000/tcp`) dan PostgreSQL (`5432/tcp`) berstatus murni internal.
4. **Uji Layanan Migrasi Sekali Jalan**:
   `docker compose -f docker-compose.prod.yml run --rm migrate` mengeksekusi Prisma migrate deploy dan menghasilkan output valid `No migration found in prisma/migrations. No pending migrations to apply` dengan exit code 0.
5. **Uji Pencadangan & Pemulihan (Disaster Recovery Drill)**:
   - `backup.sh` berhasil membuat cadangan terenkripsi `database.dump.enc`, `uploads.tar.gz.enc`, dan `manifest.json` disertai peringatan offsite S3.
   - `restore.sh` berhasil memverifikasi versi mesin target, memvalidasi checksum SHA-256 biner terdekripsi, memulihkan data, dan menampilkan jumlah tabel public schema.
   - Uji penolakan versi target lebih tua (`test_older`) berhasil menolak proses restorasi secara keras.
6. **Uji Penolakan Direct Commit ke Main**:
   Git hook `.husky/pre-commit` via `scripts/check-branch.mjs` terbukti menolak commit langsung pada branch `main` dengan pesan galat baku.
7. **Pemeriksaan Mutu Terpadu**:
   `pnpm check` (ESLint, TypeScript, Vitest, Prettier, Check Layers) dan `pnpm secrets:scan` lolos dengan status 100% bersih (0 galat, 0 rahasia bocor).

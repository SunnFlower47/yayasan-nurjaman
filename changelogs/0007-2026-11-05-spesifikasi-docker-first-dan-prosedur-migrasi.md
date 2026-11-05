# [0007] 2026-11-05 — Spesifikasi Arsitektur Docker-First, Prosedur Migrasi Basis Data dan Portabilitas Mesin

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Desain Docker-First)
- **Tipe Perubahan**: `docs`, `security`
- **Lingkup**: `docs/ARCHITECTURE.md`, `docs/11-migration-plan.md`, `docs/MASTER-PLAN.md`, `docs/SECURITY.md`

---

### 1. Ringkasan Perubahan

Mendokumentasikan paradigma arsitektur **Docker-First** yang menjamin portabilitas menyeluruh (server VPS produksi $\leftrightarrow$ laptop pengembang) murni menggunakan Docker Compose v2. Menyusun dokumen panduan migrasi basis data komprehensif `docs/11-migration-plan.md`, merancang model data `backup_jobs` bervalidasi versi, menetapkan prosedur resmi pemindahan mesin berbasis dump logis dan replikasi kunci enkripsi `ENCRYPTION_SECRET`, serta mendaftarkan tugas implementasi pada "Fase 0.7" di `MASTER-PLAN.md`.

---

### 2. Rincian Implementasi & Kebijakan Teknis

1. **Catatan Keputusan Arsitektur ADR-008 (`docs/ARCHITECTURE.md`)**:

   - Menetapkan katalog 5 layanan: `app` (Next.js Node runtime), `postgres` (PostgreSQL 17 Alpine), `reverse-proxy` (Caddy dengan otomatisasi TLS Let's Encrypt / ZeroSSL), `migrate` (container sekali jalan `prisma migrate deploy`), dan `backup-worker` (worker terpisah dengan `postgresql-client` versi 17 berizin _least privilege_).
   - Menetapkan 3 volume bernama (_named volumes_): `postgres_data`, `uploads_private` (dokumen kuitansi/KTA), dan `uploads_public` (foto dokumentasi kegiatan publik).
   - **Isolasi Jaringan & Mitigasi Firewall UFW Bypass**:
     - Mengidentifikasi bahwa manipulasi rantai `PREROUTING` iptables oleh Docker di Linux mem-bypass aturan firewall `ufw` secara default.
     - Menetapkan larangan keras publikasi port untuk `postgres` dan `app` di produksi. Keduanya hanya beroperasi di bridge network tertutup `yayasan_internal`.
     - HANYA layanan `reverse-proxy` yang diizinkan mempublikasikan port host `80` (HTTP) dan `443` (HTTPS).
   - **Nol Kunci Rahasia Dibakar (_Zero Baked Secrets_)**: Rahasia (`DATABASE_URL`, `POSTGRES_PASSWORD`, `ENCRYPTION_SECRET`, `NEXTAUTH_SECRET`) tidak pernah dibakar ke image layer; disuntikkan secara dinamis melalui environment host berizin `chmod 600`.
   - Menetapkan kebijakan restart (`unless-stopped` untuk daemon, `restart: "no"` untuk migrate), healthcheck terukur, pematrian (_pinning_) versi image eksak (tanpa tag `:latest`), sintaks baku `docker compose` (v2), dan build multi-arsitektur (`linux/amd64` & `linux/arm64`).

2. **Penerbitan Panduan Migrasi & SOP Pemindahan Mesin (`docs/11-migration-plan.md`)**:

   - **Eksekusi Migrasi Sekali Jalan**: Migrasi basis data dieksekusi sebagai layanan ephemeral terpisah sebelum container aplikasi diperbarui, bukan otomatis saat app start.
   - **Urutan Sakral 3 Langkah Deployment**:
     1. Langkah 1: Snapshot cadangan otomatis pre-deploy via `backup-worker`.
     2. Langkah 2: Eksekusi migrasi skema `docker compose run --rm migrate`.
     3. Langkah 3: Start/rolling restart aplikasi `docker compose up -d --no-deps app`.
   - **Perilaku Bila Migrasi Gagal**: Deployment dibatalkan seketika (_fail-fast & abort_). Container aplikasi lama tetap melayani pengguna tanpa gangguan, operator mendapat laporan log galat, dan skema dapat di-rollback menggunakan snapshot Langkah 1.
   - **Desain Model Data `backup_jobs` yang Diperluas**:
     - Menambahkan kolom pelacak kompatibilitas: `postgres_version` (misal `"17.2"`), `schema_version` (nama migrasi terakhir), dan `app_version` (versi rilis / commit SHA).
     - Menetapkan validasi pre-restore: proses restore otomatis ditolak jika versi PostgreSQL mesin target lebih tua dari mesin pembuat backup atau skema tidak kompatibel.
   - **Prosedur Resmi Pindah Mesin (VPS $\leftrightarrow$ Laptop)**:
     - Larangan mutlak memindahkan direktori data fisik `/var/lib/postgresql/data` mentah antar-mesin karena risiko ketidakcocokan arsitektur CPU dan versi biner.
     - Mensyaratkan 4 komponen pemindahan wajib: dump logis (`pg_dump -Fc`), arsip tar volume uploads, berkas `.env`, dan **KUNCI ENKRIPSI (`ENCRYPTION_SECRET`)**.
     - Penegasan bahwa tanpa `ENCRYPTION_SECRET` yang identik, kolom data terenkripsi (NIK anggota, nomor rekening bank, secret 2FA) tidak akan bisa dibaca selamanya (_permanent data loss_).
     - Menyusun panduan langkah demi langkah pemulihan di mesin target.

3. **Pembaruan Rencana Induk (`docs/MASTER-PLAN.md`)**:

   - Mendaftarkan tugas baru **"Fase 0.7 — Stack Docker Lengkap (Dev dan Prod)"** sebelum Fase 1.
   - Memperbarui diagram alur Mermaid dan tabel status fase.

4. **Pembaruan Kebijakan Keamanan (`docs/SECURITY.md`)**:
   - Menambahkan pasal mitigasi Docker UFW bypass pada kontrol akses jaringan.
   - Menambahkan penegasan perlindungan master key enkripsi saat migrasi sistem antar-mesin.

---

### 3. Berkas yang Ditambahkan & Dimodifikasi

- `docs/11-migration-plan.md`: Dokumen SOP migrasi basis data, deployment, dan pemindahan mesin.
- `docs/ARCHITECTURE.md`: Penambahan Bagian 6 (Arsitektur Docker-First) dan ADR-008.
- `docs/MASTER-PLAN.md`: Penambahan Fase 0.7 pada roadmap, rincian fase, dan tabel status.
- `docs/SECURITY.md`: Penambahan mitigasi UFW bypass dan invarian enkripsi saat migrasi mesin.
- `changelogs/0007-2026-11-05-spesifikasi-docker-first-dan-prosedur-migrasi.md`: Entri changelog resmi perubahan ini.

---

### 4. Cara Memverifikasi

1. Periksa konsistensi ADR-008 di `docs/ARCHITECTURE.md` dan pastikan selaras dengan `docs/11-migration-plan.md`.
2. Pastikan `docs/MASTER-PLAN.md` memuat Fase 0.7 pada diagram dan tabel.
3. Jalankan `pnpm check` untuk memastikan tidak ada pelanggaran format atau linting pada repositori.

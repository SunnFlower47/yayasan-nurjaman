# [0005] 2026-11-05 — CI/CD Pipeline, Docker Production Baseline dan Supply Chain Security

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Fondasi Keamanan)
- **Tipe Perubahan**: `ci`, `chore`, `security`
- **Lingkup**: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.dockerignore`, `docker-compose.prod.example.yml`, `scripts/scan-secrets.mjs`, `scripts/check-changelog.mjs`, `.husky/pre-commit`, `package.json`

---

### 1. Ringkasan Perubahan

Menyiapkan otomatisasi alur kerja CI/CD terintegrasi pada GitHub Actions, konfigurasi pembaharuan dependensi otomatis dengan batas pendinginan keamanan (_cooldown_), skrip pemindai kunci rahasia (_secret scanner_) pada git hook pre-commit, berkas `.dockerignore` komprehensif, serta contoh konfigurasi Docker Compose produksi yang terisolasi tanpa binding port basis data ke jaringan publik.

---

### 2. Rincian Implementasi

1. **Skrip Pemindai Rahasia & Kredensial Bocor (`scripts/scan-secrets.mjs`)**:

   - Menulis utilitas berbasis Node.js untuk mendeteksi pola:
     - Kunci privat PEM (RSA, OPENSSH, EC, DSA, PGP, PRIVATE KEY).
     - Token akses AWS (AKIA...).
     - Token GitHub (ghp*, gho*, github*pat*...).
     - Kunci Stripe Live (`sk_live_...`).
     - Token Slack (`xoxb-`, `xoxp-...`).
     - Kredensial dan API key yang di-hardcode ke variabel kode.
     - Penahanan commit berkas `.env` atau `.env.local` yang tidak di-ignore.
   - Mendukung opsi `--staged` untuk memindai berkas staged secara cepat saat pre-commit hook berjalan.
   - Didaftarkan sebagai script CLI `pnpm secrets:scan` pada `package.json`.

2. **Pembaruan Git Pre-Commit Hook (`.husky/pre-commit`)**:

   - Menambahkan urutan penegakan otomatis sebelum commit diizinkan:
     1. `node scripts/check-changelog.mjs` (memastikan entri changelog tersedia).
     2. `node scripts/scan-secrets.mjs --staged` (memastikan tidak ada kunci rahasia yang di-stage).
     3. `node scripts/check-layers.mjs` (memastikan tidak ada pelanggaran batas layer).
     4. `pnpm exec lint-staged` (pemformatan Prettier otomatis).

3. **Pembaruan Pemantauan Changelog (`scripts/check-changelog.mjs`)**:

   - Memperluas pola regex deteksi perubahan agar mewajibkan entri changelog untuk perubahan pada folder dokumen `docs/`, konfigurasi alur kerja `.github/`, dan skrip `.husky/`.

4. **Konfigurasi Lingkungan Docker Produksi**:

   - Membuat `.dockerignore` komprehensif guna memastikan berkas `.git`, `.env*` lokal, dump database, modul pengujian, dokumen, dan log tidak pernah tersalin ke dalam container image.
   - Membuat `docker-compose.prod.example.yml`:
     - Container `app` berjalan dengan user non-root dan batasan alokasi CPU (2.0 vCPU) serta memori (2048 MB).
     - Container `postgres` **TIDAK MENGEKSPOS PORT KE HOST SAMA SEKALI** (sepenuhnya tertutup di dalam bridge network internal Docker `yayasan_internal`).
     - Fitur _healthcheck_ otomatis pada PostgreSQL sebelum aplikasi dimulai.
     - Pengaturan `no-new-privileges: true` pada seluruh service.

5. **Alur Kerja CI Pipeline (`.github/workflows/ci.yml`)**:

   - Berjalan pada setiap `push` dan `pull_request` ke cabang `main`.
   - Menggunakan Node.js 22 dan pnpm dengan pemasangan dependensi terkunci `--frozen-lockfile`.
   - Menjalankan urutan verifikasi mutu lengkap:
     1. `node scripts/scan-secrets.mjs`
     2. `node scripts/check-layers.mjs`
     3. `pnpm lint`
     4. `pnpm typecheck`
     5. `pnpm test`
     6. `pnpm format:check`
     7. `pnpm prisma generate`
     8. `pnpm build` (kompilasi Next.js produksi).

6. **Konfigurasi Dependabot (`.github/dependabot.yml`)**:
   - Menjadwalkan pemeriksaan dependensi npm secara mingguan setiap hari Senin pukul 03:00 WIB.
   - Membatasi maksimal 5 pull request terbuka secara bersamaan guna mencegah banjir PR.
   - Menjadwalkan pemeriksaan aksi GitHub Actions bulanan.

---

### 3. Berkas yang Ditambahkan & Dimodifikasi

- `scripts/scan-secrets.mjs`: Utilitas pendeteksi kunci rahasia.
- `scripts/check-changelog.mjs`: Pola pemantauan diperluas ke `docs/` dan `.github/`.
- `.husky/pre-commit`: Hook penegak tiga lapis (changelog, secrets, layers, lint-staged).
- `.dockerignore`: Pengabaian berkas build Docker.
- `docker-compose.prod.example.yml`: Templat compose produksi aman.
- `.github/workflows/ci.yml`: Pipeline otomatisasi GitHub Actions.
- `.github/dependabot.yml`: Konfigurasi dependabot mingguan.
- `package.json`: Script baru `check`, `security:audit`, `secrets:scan`.

---

### 4. Cara Memverifikasi

1. Jalankan `pnpm secrets:scan` dan pastikan memindai seluruh berkas tanpa mendeteksi rahasia bocor.
2. Jalankan `pnpm check` dan pastikan seluruh 5 tahapan lolos tanpa error.

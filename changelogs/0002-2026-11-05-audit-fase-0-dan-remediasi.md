# [0002] 2026-11-05 — Audit Hasil Fase 0 dan Remediasi Keamanan Baseline

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Fondasi Keamanan)
- **Tipe Perubahan**: `security`, `fix`, `chore`
- **Lingkup**: Root configurations, `.gitignore`, `docker-compose.yml`, `package.json`, `pnpm-workspace.yaml`, `src/lib/db.ts`

---

### 1. Ringkasan Perubahan

Melakukan audit independen yang menyeluruh dan jujur terhadap artefak hasil pengerjaan Fase 0, mengidentifikasi potensi celah keamanan serta kerentanan dependensi, dan mengeksekusi langkah perbaikan cepat (_remediation_) pada konfigurasi sistem.

---

### 2. Temuan Audit Lengkap & Hasil Inspeksi

1. **Inspeksi Pelacakan Berkas Sensitif (`.env`, database dump, folder `uploads/` dan `backups/`)**:

   - **Hasil Pemeriksaan Git Index & Git History**: Berkas `.env` diperiksa pada seluruh riwayat commit (`git log --all --full-history -- "**.env*"`). Dipastikan bahwa `.env` **TIDAK PERNAH** ter-track atau ter-commit ke dalam repositori. Hanya `.env.example` yang tersimpan.
   - **Folder & Dump Database**: Ditemukan bahwa pola `*.dump`, `*.sql`, `/backups`, dan `/backups/*` belum didefinisikan secara eksplisit di `.gitignore`.
   - **Tindakan Remediasi**: Memperbarui `.gitignore` dengan menambahkan pola pengabaian ketat untuk seluruh file cadangan, dump database, dan direktori `/backups/`.

2. **Evaluasi Mekanisme Pemeriksaan Basis Data pada `src/lib/db.ts`**:

   - **Analisis Cara Kerja**: Pada Fase 0, `prisma/schema.prisma` hanya memuat blok `datasource` dan `generator` tanpa model entitas domain (karena larangan membuat model sebelum Fase 1). Oleh karena itu, Prisma Client belum memiliki entitas yang dapat di-generate.
   - **Library yang Digunakan**: Menggunakan modul bawaan (_native core module_) Node.js yaitu `node:net` untuk membuka soket TCP ke host dan port PostgreSQL yang diparsing dari `DATABASE_URL` dengan batas waktu timeout 2000ms.
   - **Kesesuaian Dependensi**: Tidak ada penambahan pustaka eksternal di luar daftar rencana (`net` adalah modul bawaan Node.js).
   - **Tingkat Kerapuhan & Usulan Perbaikan**: Pengecekan via soket TCP hanya membuktikan port database terbuka dan menerima koneksi; cara ini belum memvalidasi kredensial pengguna atau izin skema (bisa lolos meskipun kata sandi salah). **Rekomendasi**: Pada Fase 1, segera setelah model User/Session dimigrasikan, fallback TCP soket ini wajib digantikan dengan kueri otentikasi nyata Prisma (`prisma.$queryRaw` atau `prisma.user.count()`).

3. **Pemeriksaan Versi Dependensi & Hasil `pnpm audit`**:

   - Seluruh dependensi pada `package.json` telah dipin pada versi eksak (tanpa `^` atau `~`).
   - Hasil eksekusi `pnpm audit` mengidentifikasi **10 kerentanan** (3 Critical, 2 High, 4 Moderate, 1 Low) yang terutama bersumber dari:
     - `next@15.2.1`: Memiliki celah keamanan SSR Flight Remote Code Execution dan Middleware Route Bypass (GHSA-f82v-jwr5-mffw).
     - `postcss@8.5.1`: Kerentanan path traversal pada penanganan source map.
     - Pustaka dev tooling (`vitest@3.0.7`, `tinypool@2.1.0`, `playwright@1.50.1`, `zod@3.24.2`).
   - **Tindakan Remediasi Langsung**:
     - Memperbarui `next` dan `eslint-config-next` dari `15.2.1` ke versi rilis stabil `15.5.28` (rilis > 14 hari yang lalu, aman dari CVE di atas).
     - Menambahkan override `postcss: 8.5.23` pada `pnpm-workspace.yaml`.

4. **Pemeriksaan Port PostgreSQL pada `docker-compose.yml`**:
   - **Kondisi Awal**: Port PostgreSQL sebelumnya terikat ke semua antarmuka jaringan host (`${POSTGRES_PORT:-5432}:5432` setara dengan `0.0.0.0`).
   - **Tindakan Remediasi**: Mengubah binding port menjadi terikat secara ketat dan eksklusif ke antarmuka loopback lokal `127.0.0.1:${POSTGRES_PORT:-5432}:5432`.
   - **Pemeriksaan Dockerfile Runner**: Memverifikasi bahwa multi-stage `Dockerfile` untuk produksi telah menjalankan aplikasi menggunakan user non-root `nextjs` (UID 1001) dan grup `nodejs` (GID 1001).

---

### 3. Berkas yang Diubah

- `.gitignore`: Penambahan pola pengabaian file dump SQL, backup, dan artefak sensitif.
- `docker-compose.yml`: Penguncian binding port PostgreSQL hanya ke `127.0.0.1`.
- `package.json`: Upgrade versi eksak `next` dan `eslint-config-next` ke `15.5.28`.
- `pnpm-workspace.yaml`: Penambahan override resolusi `postcss: 8.5.23`.
- `pnpm-lock.yaml`: Pembaharuan checksum kunci integritas paket dependensi.

---

### 4. Cara Memverifikasi

1. Periksa port binding PostgreSQL: Jalankan `docker compose ps` dan pastikan port tertera `127.0.0.1:5432->5432/tcp`.
2. Verifikasi .gitignore: Jalankan `git status` dan pastikan file backup atau dump tidak terdeteksi.
3. Verifikasi dependensi: Jalankan `pnpm list next postcss` untuk memastikan versi `15.5.28` dan `8.5.23` terpasang.

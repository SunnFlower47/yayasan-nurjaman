# Arsitektur Sistem (Architecture Specification)

## Yayasan Nurjaman Bongas Purwakarta

Dokumen ini adalah cetak biru arsitektur teknis sistem web resmi dan panel admin terpadu Yayasan Nurjaman Bongas Purwakarta. Dokumen ini menjadi pedoman desain tingkat tinggi yang memandu struktur modul, keamanan berlapis, topologi Docker-first, dan catatan keputusan arsitektur (ADR). Rincian teknis lengkap terorganisasi secara modular di [`docs/architecture/`](file:///docs/architecture/00-index.md).

---

## 1. Stack Teknologi & Versi Eksak Terpasang

Seluruh dependensi dipin pada versi eksak (Next.js `15.5.28`, React `19.0.0`, TypeScript `5.7.3`, Tailwind `3.4.17`, Prisma `6.4.1`, PostgreSQL `17-alpine`, Zod `3.24.2`, Vitest `3.0.7`, Playwright `1.50.1`, Lucide `0.475.0`, ESLint `9.21.0`, Prettier `3.5.2`, Husky `9.1.7`, pnpm `12.16.1`).
👉 _Rincian spesifikasi lengkap dan alasan pemilihan: [`docs/architecture/01-stack-dan-struktur.md`](file:///docs/architecture/01-stack-dan-struktur.md#1-stack-teknologi--versi-eksak-terpasang)_

---

## 2. Struktur Direktori & Tanggung Jawab Lapisan

Sistem menggunakan pola **Modular Monolith** berbasis domain di dalam `src/modules/` dengan pemisahan komponen bersama di `src/components/`, konfigurasi keamanan di `src/middleware.ts`, serta desain token di `src/styles/`.
👉 _Pohon direktori lengkap: [`docs/architecture/01-stack-dan-struktur.md`](file:///docs/architecture/01-stack-dan-struktur.md#2-struktur-direktori--tanggung-jawab-lapisan)_

### Tanggung Jawab Lapisan per Modul Domain (`src/modules/<domain>/`)

Setiap modul mengisolasi tanggung jawab secara ketat: `actions/` (autentikasi, otorisasi, Zod), `services/` (logika bisnis & invarian), `repositories/` (akses Prisma ORM), `schemas/` (validasi), `components/` (antarmuka lokal), dan `index.ts` (API publik modul).
👉 _Rincian isolasi lapisan: [`docs/architecture/01-stack-dan-struktur.md`](file:///docs/architecture/01-stack-dan-struktur.md#tanggung-jawab-lapisan-per-modul-domain-srcmodulesdomain)_

---

## 3. Alur Permintaan (Request Flow)

Alur eksekusi data berjalan searah dari Pengguna → UI → Server Action (`requireUser` & `requirePermission`) → Zod Schema Parse → Domain Service (Validasi Invarian) → Repository (Prisma Transaction) → DB PostgreSQL → Audit Log Append-Only → UI Feedback.
👉 _Diagram sequence Mermaid lengkap: [`docs/architecture/02-alur-dan-keamanan.md`](file:///docs/architecture/02-alur-dan-keamanan.md#3-alur-permintaan-request-flow)_

---

## 4. Arsitektur Keamanan Siber & Pertahanan Berlapis (_Defense in Depth_)

Pertahanan berlapis mengombinasikan 9 lapisan proteksi: Security Headers & Nonce CSP → Middleware UX Redirect → Server Action Authentication → Server Action RBAC → Zod Validation → Domain Invariants → Scoped Repository → AES-256-GCM Encryption (PII) → Immutable Audit Trail.
👉 _Diagram arsitektur pertahanan lengkap: [`docs/architecture/02-alur-dan-keamanan.md`](file:///docs/architecture/02-alur-dan-keamanan.md#4-arsitektur-keamanan-siber--pertahanan-berlapis-defense-in-depth)_

### Prinsip Pertahanan Berlapis Utama

Pengecekan izin otoritatif wajib di server layer (`requirePermission`), sandi di-hash Argon2id, cookie sesi `__Host-` HttpOnly, TOTP 2FA untuk peran sensitif, enkripsi NIK AES-256-GCM + blind index HMAC, dan header CSP/HSTS ketat.
👉 _Rincian prinsip keamanan: [`docs/architecture/02-alur-dan-keamanan.md`](file:///docs/architecture/02-alur-dan-keamanan.md#prinsip-pertahanan-berlapis-utama)_

---

## 5. Model Entitas Basis Data Konseptual

Model entitas relasional mencakup 70 tabel dalam 8 modul domain didefinisikan secara komprehensif pada [`docs/database/02-erd-overview.md`](file:///docs/database/02-erd-overview.md) dan masing-masing berkas spesifikasi teknis modul domain di [`docs/database/00-README.md`](file:///docs/database/00-README.md).
👉 _Rincian relasi model data: [`docs/architecture/02-alur-dan-keamanan.md`](file:///docs/architecture/02-alur-dan-keamanan.md#5-model-entitas-basis-data-konseptual)_

---

## 6. Arsitektur Docker-First & Ekosistem Layanan

Sistem dirancang mandiri menggunakan Docker Compose v2 untuk portabilitas penuh laptop $\leftrightarrow$ VPS produksi.

### 6.1 Topologi Layanan (_Service Catalog_)

Daftar 5 layanan terisolasi: `app` (Next.js non-root), `postgres` (PostgreSQL 17), `reverse-proxy` (Caddy TLS otomatis), `migrate` (one-off Prisma deploy), dan `backup-worker` (Postgres 17 client).
👉 _Rincian katalog layanan: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#61-topologi-layanan-service-catalog)_

### 6.2 Volume Bernama (_Named Volumes_)

Pemisahan volume persistensi: `postgres_data`, `uploads_private` (bukti kas, KTA, lampiran), dan `uploads_public` (foto kegiatan, warta, brand).
👉 _Rincian volume: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#62-volume-bernama-named-volumes)_

### 6.3 Isolasi Jaringan & Catatan Keamanan Kritis Firewall (UFW Bypass)

Mitigasi celah bypass firewall UFW di Linux VPS: port DB dan app DILARANG dipublikasikan ke host (`ports:` dilarang). Hanya `reverse-proxy` yang mempublikasikan port 80/443 pada bridge network `yayasan_internal`.
👉 _Diagram jaringan & peringatan keamanan: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#63-isolasi-jaringan--catatan-keamanan-kritis-firewall-ufw-bypass)_

### 6.4 Pengelolaan Environment Variables, Rahasia & Key Ring Kriptografi (_Zero Baked Secrets_)

Kunci rahasia kredensial, key ring enkripsi multi-kunci, dan kunci blind index HMAC disuntikkan secara dinamis saat runtime, dilarang dibakar ke image layer.
👉 _Aturan key ring & rahasia: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#64-pengelolaan-environment-variables-rahasia--key-ring-kriptografi-zero-baked-secrets)_

### 6.5 Pemeriksaan Kesehatan (_Healthcheck_) & Versi Image Eksak

Container wajib memiliki uji `healthcheck` mandiri dan seluruh tag image Docker dipin pada versi numerik eksak tanpa tag `:latest`.
👉 _Konfigurasi healthcheck: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#65-pemeriksaan-kesehatan-healthcheck--versi-image-eksak)_

### 6.6 Dukungan Multi-Arsitektur (_Multi-Platform Build_)

Image mendukung arsitektur ganda via Docker Buildx: `linux/amd64` (VPS produksi) dan `linux/arm64` (laptop pengembang).
👉 _Panduan build multi-platform: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#66-dukungan-multi-arsitektur-multi-platform-build)_

### 6.7 Kebijakan Toleransi Restart, Henti Singkat & Pola Migrasi Expand-Contract

Henti singkat terukur (2–5 detik) saat restart aplikasi diterima demi kesederhanaan single-host. Perubahan skema wajib mengikuti pola non-breaking expand-contract.
👉 _Prosedur migrasi & toleransi: [`docs/architecture/03-docker-first.md`](file:///docs/architecture/03-docker-first.md#67-kebijakan-toleransi-restart-henti-singkat--pola-migrasi-expand-contract)_

---

## 7. Catatan Keputusan Arsitektur (Architectural Decision Records / ADR)

Seluruh keputusan arsitektur sistem terdokumentasi terinci pada berkas modular [`docs/architecture/04a-adr-fondasi-dan-keamanan.md`](file:///docs/architecture/04a-adr-fondasi-dan-keamanan.md), [`docs/architecture/04b-adr-auth-dan-storage.md`](file:///docs/architecture/04b-adr-auth-dan-storage.md), dan [`docs/architecture/04c-adr-database-dan-sistem.md`](file:///docs/architecture/04c-adr-database-dan-sistem.md).

### Matriks Status ADR Lengkap (ADR-001 s.d. ADR-022)

| ID ADR      | Tanggal    | Topik Keputusan                 | Ringkasan Pilihan yang Ditetapkan                                                                  | Status         |
| :---------- | :--------- | :------------------------------ | :------------------------------------------------------------------------------------------------- | :------------- |
| **ADR-001** | 2026-11-04 | **Arsitektur Aplikasi**         | Next.js App Router + Modular Monolith di `src/modules/`                                            | **DIPUTUSKAN** |
| **ADR-002** | 2026-11-04 | **Manajemen Basis Data**        | PostgreSQL + Prisma Migration Only (dilarang `db push`)                                            | **DIPUTUSKAN** |
| **ADR-003** | 2026-11-05 | **Prioritas Roadmap**           | Admin Panel Terlebih Dahulu (Fase 1-8), Situs Publik Terakhir (Fase 9)                             | **DIPUTUSKAN** |
| **ADR-004** | 2026-11-05 | **Model Otorisasi Aman**        | Pengecekan Otoritatif di Server Action (`requirePermission`)                                       | **DIPUTUSKAN** |
| **ADR-005** | 2026-11-04 | **Presisi Finansial**           | `BIGINT` Integer Rupiah & Invarian Keseimbangan Jurnal                                             | **DIPUTUSKAN** |
| **ADR-006** | 2026-11-04 | **Konfigurasi Tarif Pajak**     | Master Data Tarif Berversi Tanggal Efektif (`valid_range`)                                         | **DIPUTUSKAN** |
| **ADR-007** | 2026-11-05 | **Header Keamanan & CSP**       | Nonce-based CSP, Strict HSTS 2 Tahun, X-Frame-Options DENY                                         | **DIPUTUSKAN** |
| **ADR-008** | 2026-11-05 | **Ekosistem Docker-First**      | Docker Compose v2 Multi-Service & Jaringan Internal Anti-UFW Bypass                                | **DIPUTUSKAN** |
| **ADR-009** | 2026-11-05 | **Kriptografi & Migrasi**       | Key Ring + Blind Index Terpisah & Pola Migrasi Expand-Contract                                     | **DIPUTUSKAN** |
| **ADR-010** | 2026-11-06 | **Resolusi Nama Akun**          | Bagan Akun `chart_of_accounts`, Kas/Bank `cash_bank_accounts`                                      | **DIPUTUSKAN** |
| **ADR-011** | 2026-11-06 | **Pola Library Autentikasi**    | Auth Tipis Buatan Sendiri (Argon2id, Session Token 256-bit, TOTP Replay Prevention, DB Rate Limit) | **DIPUTUSKAN** |
| **ADR-012** | 2026-11-06 | **Model Backup Offsite**        | Kolom Langsung di `backup_jobs` (`offsite_status`, `offsite_storage_key`)                          | **DIPUTUSKAN** |
| **ADR-013** | 2026-11-06 | **Abstraksi Storage Media**     | Interface `StorageProvider` (Default `LocalStorageProvider` Volume Docker)                         | **DIPUTUSKAN** |
| **ADR-014** | 2026-11-06 | **Strategi Primary Key**        | Primary Key UUID Acak/Unguessable & Nomor Dokumen Kolom Terpisah Gapless Sequence                  | **DIPUTUSKAN** |
| **ADR-015** | 2026-11-06 | **Pembakuan Tipe Uang**         | SATU Tipe Data: `BIGINT` Integer Rupiah untuk Seluruh Nilai Finansial                              | **DIPUTUSKAN** |
| **ADR-016** | 2026-11-06 | **Standarisasi Tanggal**        | `DATE` untuk Peristiwa Bisnis, `TIMESTAMPTZ` untuk Jejak Audit Sistem                              | **DIPUTUSKAN** |
| **ADR-017** | 2026-11-06 | **Model Otorisasi RBAC**        | RBAC Multi-Role dengan Katalog Permission Bersumber Kode                                           | **DIPUTUSKAN** |
| **ADR-018** | 2026-11-06 | **Pemisahan Jurnal Akuntansi**  | Transaksi Bisnis Operasional Dipisahkan dari Jurnal Akuntansi Ganda                                | **DIPUTUSKAN** |
| **ADR-019** | 2026-11-06 | **Penghapusan & Enum/Lookup**   | Imutabel (Posted), Append-Only (Audit), Soft Delete (Master) & Enum vs Lookup                      | **DIPUTUSKAN** |
| **ADR-020** | 2026-11-06 | **Skema Multi-Berkas Prisma**   | Prisma Multi-File Schema (`prismaSchemaFolder` pada Prisma 6.4.1)                                  | **DIPUTUSKAN** |
| **ADR-021** | 2026-11-06 | **Konkurensi & Locking**        | Optimistic Locking (`version`), Pessimistic Row Lock (`FOR UPDATE`), `REPEATABLE READ`             | **DIPUTUSKAN** |
| **ADR-022** | 2026-11-06 | **Arsitektur Single-Tenant**    | Single-Tenant Eksklusif untuk Yayasan Nurjaman (Tanpa `tenant_id`)                                 | **DIPUTUSKAN** |
| **ADR-023** | 2026-11-06 | **Image Basis PostgreSQL Prod** | `postgres:17.2-bookworm` (Official Debian) Demi Stabilitas Glibc & Collation                       | **DIPUTUSKAN** |
| **ADR-024** | 2026-11-06 | **Kepemilikan Header Keamanan** | Aplikasi (`src/middleware.ts`) Pemilik Tunggal CSP & HSTS; Caddy Hanya Mengatur `/uploads/*`       | **DIPUTUSKAN** |
| **ADR-025** | 2026-11-06 | **Enkripsi Cadangan Restic**    | Restic (AES-256 Poly1305) untuk Backup Terautentikasi, Retensi Prune, dan Kompatibilitas S3        | **DIPUTUSKAN** |

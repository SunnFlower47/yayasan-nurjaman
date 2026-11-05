# [0004] 2026-11-05 — Standar Keamanan Siber OWASP ASVS L2 dan Baseline Konfigurasi

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Fondasi Keamanan)
- **Tipe Perubahan**: `security`, `feat`, `test`
- **Lingkup**: `docs/SECURITY.md`, `src/middleware.ts`, `src/app/robots.ts`, `tests/e2e/security-headers.spec.ts`

---

### 1. Ringkasan Perubahan

Menyusun dokumen panduan keamanan komprehensif `docs/SECURITY.md` berbasis pemodelan ancaman (_threat modeling_) dan kerangka kerja OWASP ASVS L2. Menerapkan _baseline_ proteksi jaringan dan header HTTP ketat melalui Next.js middleware, konfigurasi _indexing policy_ untuk mesin pencari, serta melengkapi pengujian otomatis E2E Playwright.

---

### 2. Rincian Implementasi & Kebijakan Keamanan

1. **Penerbitan `docs/SECURITY.md`**:

   - Mendefinisikan aset kritis yang dilindungi: Catatan Keuangan ISAK 35, Data Pribadi (NIK) UU PDP, data perpajakan, kunci sesi, dan log audit.
   - Menyusun matriks pemetaan risiko terhadap 10 kategori OWASP Top 10 (2021).
   - Menetapkan kebijakan autentikasi: Hashing sandi menggunakan Argon2id (atau bcrypt cost 12+), panjang minimal 12 karakter berkombinasi, rate limiting maks 5 kegagalan per 15 menit dengan _progressive delay_, dan 2FA TOTP wajib untuk peran Super Admin, Ketua, dan Bendahara.
   - Menetapkan batas sesi: _Idle timeout_ 30 menit, batas mutlak 8 jam, dan revokasi instan saat pergantian kredensial.
   - **Arsitektur Otorisasi Sisi Server**: Menegaskan bahwa Next.js Middleware HANYA digunakan untuk kenyamanan navigasi/redirect; otorisasi otoritatif (`requirePermission`) wajib dijalankan di sisi server pada setiap Server Action atau Route Handler untuk menangkal celah rute bypass.
   - Perlindungan data sensitif: Enkripsi at-rest menggunakan **AES-256-GCM** untuk NIK anggota dan penyamaran data (_data masking_) pada antarmuka pengguna (`3201************`).
   - Jejak audit (_audit trail_): Tabel `audit_logs` append-only yang merekam aktor, aksi, entitas, diff JSON, alamat IP, dan waktu.
   - Validasi berkas unggahan: Pemeriksaan tiga lapis (ekstensi, MIME type, dan _binary magic bytes_), pembersihan nama berkas dengan UUIDv4 acak, serta larangan eksekusi skrip.

2. **Middleware Keamanan & Header HTTP (`src/middleware.ts`)**:

   - Menghasilkan cryptographic nonce acak per request menggunakan Web Crypto API (`crypto.getRandomValues`).
   - Menyematkan header keamanan HTTP secara global:
     - `Content-Security-Policy`: Kebijakan ketat dengan `script-src` berbasis nonce, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, dan `form-action 'self'`.
     - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (durasi 2 tahun).
     - `X-Frame-Options`: `DENY` (mencegah serangan clickjacking).
     - `X-Content-Type-Options`: `nosniff` (mencegah MIME type sniffing).
     - `Referrer-Policy`: `strict-origin-when-cross-origin`.
     - `Permissions-Policy`: Menonaktifkan akses sensor perangkat berbahaya (`camera=(), microphone=(), geolocation=(), browsing-topics=()`).
     - `X-Permitted-Cross-Domain-Policies`: `none`.
     - `X-DNS-Prefetch-Control`: `off`.
   - Menyematkan header `X-Robots-Tag: noindex, nofollow, noarchive` pada rute `/admin/*`, `/api/*`, dan `/dev/*`.

3. **Pengaturan Mesin Pencari (`src/app/robots.ts`)**:

   - Menyediakan berkas `robots.txt` dinamis menggunakan Next.js Metadata Route.
   - Mengizinkan crawling halaman publik (`/`) dan melarang secara tegas perayapan direktori `/admin/`, `/api/`, dan `/dev/`.

4. **Pengujian Keamanan E2E Playwright (`tests/e2e/security-headers.spec.ts`)**:
   - Menambahkan skenario uji browser otomatis untuk memverifikasi kehadiran seluruh header keamanan HTTP pada halaman utama `/`.
   - Menguji bahwa header `X-Robots-Tag` aktif menyertakan `noindex, nofollow, noarchive` pada respons rute API.

---

### 3. Berkas yang Ditambahkan & Dimodifikasi

- `docs/SECURITY.md`: Dokumen kebijakan & arsitektur keamanan siber.
- `src/middleware.ts`: Implementasi header keamanan dan CSP nonce.
- `src/app/robots.ts`: Rute `robots.txt` dinamis.
- `tests/e2e/security-headers.spec.ts`: Spesifikasi pengujian E2E security headers.

---

### 4. Cara Memverifikasi

1. Jalankan `pnpm build` untuk memvalidasi kompilasi middleware dan rute robots.
2. Jalankan `pnpm test:e2e` (atau inspeksi respons curl/header) untuk memastikan seluruh security headers hadir pada respons server.

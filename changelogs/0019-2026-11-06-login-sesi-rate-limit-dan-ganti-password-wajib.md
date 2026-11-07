# [ID: 0019] Login Pengurus, Manajemen Sesi, Rate Limit, dan Ganti Sandi Wajib (Fase 1B)

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 1B (Autentikasi Pengurus, Sesi, Rate Limit, dan Ganti Password Wajib)
- **Tipe Perubahan**: `feat`, `db`, `sec`, `test`, `ui`
- **Branch**: `feat/fase-1b-login-sesi`
- **Lingkup**: `src/modules/auth/`, `src/components/shared/`, `src/app/`, `src/middleware.ts`, `prisma/migrations/`, `tests/`

---

### 1. Perbaikan Fondasi dari Fase 1A (Langkah 0)

1. **Foreign Key RESTRICT & Hak Akses Minimal**:

   - Menambahkan migrasi baru `20261106123800_restrict_audit_security_and_revoke_user_delete`.
   - Mengubah foreign key `audit_logs.actor_user_id` dan `security_events.user_id` menjadi `ON DELETE RESTRICT` (menggantikan `SET NULL`).
   - Mencabut hak `DELETE` pada tabel `users` dari role `db_app`. Pengguna hanya boleh di-soft-delete (`deleted_at`).
   - Menyesuaikan `ALTER DEFAULT PRIVILEGES` pada skrip inisialisasi agar role `db_app` hanya memperoleh `SELECT, INSERT, UPDATE` secara default, tanpa hak `DELETE` otomatis pada tabel masa depan.
   - Menambahkan pengujian integrasi yang membuktikan role `db_app` gagal mengeksekusi `DELETE` pada `users`.

2. **Mitigasi SQL Injection & Aturan ESLint**:

   - Mengganti `$queryRawUnsafe` pada `src/lib/db.ts` dengan `$queryRaw` bertemplat (`$queryRaw\`SELECT 1\``).
   - Menambahkan aturan ESLint `no-restricted-properties` yang melarang keras penggunaan `$queryRawUnsafe` dan `$executeRawUnsafe` di seluruh basis kode aplikasi.

3. **Audit Ketergantungan Prisma**:
   - Menjalankan `pnpm outdated prisma @prisma/client` dan `pnpm audit`.
   - Ditemukan 0 advisory keamanan pada pustaka Prisma v6.4.1. Mempertahankan Prisma 6.4.1 stabil yang telah mendukung multi-file schema (`prismaSchemaFolder`).

---

### 2. Fitur Modul Autentikasi (`src/modules/auth`)

1. **Arsitektur Berlapis Bersih (Clean Layered Architecture)**:

   - Mengisolasi seluruh logika ke dalam `src/modules/auth/` (services, repositories, schemas, actions, components, helpers).
   - Akses lintas-modul murni melalui public API `src/modules/auth/index.ts`. Bebas deep import dan mematuhi batas arsitektur berlapis (0 pelanggaran pada `check-layers.mjs`).

2. **Verifikasi Kata Sandi & Mitigasi Timing Attack**:

   - Menggunakan hashing **Argon2id** (`@node-rs/argon2`, memory 64MB, time 3, parallelism 4).
   - Saat pengguna tidak ditemukan atau akun berstatus `DISABLED`, sistem menjalankan komputasi verifikasi terhadap hash dummy Argon2id prekomputasi agar durasi respons identik.
   - Pesan kesalahan login tunggal dan generik: `"Username atau password salah"`. Mencegah enumerasi akun.

3. **Manajemen Sesi Kriptografis**:

   - Token sesi berentropi 256-bit (32 byte acak). Nilai yang disimpan pada kolom `sessions.token_hash` hanyalah hash SHA-256 heksadesimal 64 karakter.
   - Cookie berkonfigurasi aman: `httpOnly: true, sameSite: "lax", path: "/"`, tanpa atribut `Domain`. Di produksi bernama `__Host-session` dengan `Secure: true`, di lingkungan dev bernama `session`.
   - Idle timeout 30 menit (diperbarui maksimal 1x per menit), batas absolut 8 jam yang tidak dapat diperpanjang.
   - Logout mencabut sesi di database dan menghapus cookie secara instan.

4. **Pembatasan Laju Percobaan (Rate Limiting di Database)**:

   - Pelacak persisten pada tabel `rate_limit_counters` berbasis jendela waktu 15 menit per username dan per IP.
   - Normalisasi alamat IPv6 ke prefiks subnet `/64` untuk mencegah penghindaran via rotasi alamat antarmuka.
   - Header proxy (`x-forwarded-for`, `x-real-ip`) hanya dipercaya bila `TRUSTED_PROXY=true` di lingkungan server.
   - Setelah 5 kali percobaan gagal berturut-turut, akun dan IP dikenai penguncian (lockout) selama 15 menit.

5. **Alur Ganti Kata Sandi Wajib**:

   - Jika `must_change_password = true`, seluruh rute admin dialihkan secara otomatis ke `/ganti-password`.
   - Kebijakan sandi: minimal 12 karakter, dilarang memuat/sama dengan username atau email, dan dilarang terdapat pada daftar lokal 10.000 kata sandi pasaran (`common-passwords.txt`).
   - Keberhasilan pembaruan memperbarui `password_changed_at`, menonaktifkan `must_change_password`, dan mencabut seluruh sesi aktif lainnya milik pengguna tersebut.

6. **Pencatatan Peristiwa Keamanan (`security_events`)**:

   - Menulis rekaman `LOGIN_SUCCESS`, `LOGIN_FAILED`, dan `LOCKOUT` ke tabel `security_events`.
   - Kolom `details` disanitasi mutlak: bebas dari kata sandi, token mentah, maupun data sensitif.

7. **Keamanan Permintaan & Pengalihan**:

   - Server Actions (`loginAction`, `logoutAction`, `changePasswordAction`) memvalidasi header Origin terhadap daftar domain resmi yang diizinkan.
   - Parameter redirect `next` disanitasi ketat: hanya mengizinkan path relatif internal dan menolak open redirect eksternal (`//`, `http://`, escape character).
   - Otorisasi server otoritatif ditegakkan oleh helper `requireUser()`. Middleware hanya bertindak sebagai pengarah UX (ADR-004).

8. **Antarmuka Pengguna Sesuai UI-UX-RULES.md**:
   - Halaman `/masuk`: menampilkan logo resmi yayasan dari `public/brand/logo-yayasan-nurjaman.png`, formulir ramah aksesibilitas, dan indikator loading state. Bebas gaya AI-slop dan menggunakan palet warm stone & primary green.
   - Halaman `/ganti-password`: formulir pembaruan sandi dengan validasi interaktif.
   - Halaman `/admin`: menampilkan sapaan nama pengurus, ringkasan sesi, dan tombol keluar.
   - Rute `/admin` dan `/ganti-password` menyematkan header `X-Robots-Tag: noindex, nofollow, noarchive` serta metadata `robots: { index: false, follow: false }`.
   - Komponen formulir bersama yang dapat digunakan ulang dimuat pada `src/components/shared/` (`Button`, `Input`, `Alert`).

---

### 3. Rangkaian Pengujian Mutu Terpadu

- **Unit Tests (14 passed)**: normalisasi IPv6 `/64`, pembuatan & hashing token sesi SHA-256, validasi kebijakan sandi (panjang, username/email, daftar pasaran), sanitasi path redirect.
- **Integration Tests (12 passed)**: pembuktian hak akses role `db_app` ditolak `DELETE` pada users, token_hash disimpan sebagai SHA-256 bukan token mentah, pesan login identik, lockout setelah 5x gagal, penolakan akun DISABLED, kedaluwarsa idle & absolut, pencabutan sesi lain saat ganti sandi, penolakan open redirect.
- **E2E Playwright Tests (7 passed)**: pengalihan akses `/admin` tanpa sesi ke `/masuk`, nol pelanggaran CSP pada seluruh halaman, penolakan login salah password, alur lengkap login awal -> verifikasi cookie `httpOnly & SameSite` -> ganti sandi wajib -> dashboard admin -> logout.

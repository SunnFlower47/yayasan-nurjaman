# [ID: 0022] Pemberlakuan Konstanta Tunggal Kebijakan Password dan Batas 128 Karakter

- **Tanggal & Waktu**: 2026-11-07 15:07 WIB (Asia/Jakarta)
- **Tipe Perubahan**: security | refactor | docs | config
- **Fase / Modul**: Fase 1b (Identitas & Akses — Login & Manajemen Sesi)
- **Penulis / Agent**: Senior Full-Stack Engineer

---

## 1. Ringkasan Perubahan

Menyatukan seluruh penegakan kebijakan panjang kata sandi ke dalam konstanta tunggal terpusat `PASSWORD_MIN_LENGTH = 8` dan menambahkan batas maksimum yang didukung `PASSWORD_MAX_LENGTH = 128` di `src/modules/auth/constants.ts`. Konstanta ini digunakan secara seragam di komponen form ganti password, skema Zod, fungsi validator, skrip seed basis data, dan seluruh suite pengujian (unit, integrasi PostgreSQL asli, dan E2E Playwright). Seluruh syarat pengimbang keamanan dipertahankan secara utuh sesuai arahan pemilik yayasan.

## 2. Latar Belakang & Alasan

1. **Keputusan Pemilik**: Menetapkan batas panjang minimal kata sandi menjadi 8 karakter agar ramah pengguna internal tanpa mengurangi postur keamanan kelembagaan.
2. **Single Source of Truth**: Menghilangkan seluruh teks hardcoded di komponen antarmuka pengguna (`ChangePasswordForm.tsx`), pesan skema Zod, dan pengujian dengan mengaitkannya langsung ke konstanta `PASSWORD_MIN_LENGTH`.
3. **Dukungan Passphrase Panjang**: Menetapkan `PASSWORD_MAX_LENGTH = 128` (standar rekomendasi NIST SP 800-63B / OWASP) agar pengguna dapat memakai kalimat sandi panjang (_passphrase_) tanpa dipotong oleh batasan sistem yang terlalu sempit.
4. **Konsistensi Lintas Dokumen & Kode**: Memperbarui `docs/SECURITY.md` untuk mencatat keputusan pemilik beserta seluruh syarat pengimbang yang wajib dipatuhi.

## 3. Rincian File yang Berubah

- **Diubah**:
  - `src/modules/auth/constants.ts`: Menetapkan `PASSWORD_MIN_LENGTH = 8` dan `PASSWORD_MAX_LENGTH = 128`.
  - `src/modules/auth/index.ts`: Mengekspor `PASSWORD_MAX_LENGTH` bersama `PASSWORD_MIN_LENGTH`.
  - `src/modules/auth/schemas/change-password.schema.ts`: Menambahkan validasi batas atas `.max(PASSWORD_MAX_LENGTH, ...)` pada `newPassword`.
  - `src/modules/auth/helpers/password-validator.ts`: Menambahkan pemeriksaan `> PASSWORD_MAX_LENGTH` pada `validatePasswordPolicy`.
  - `src/modules/auth/components/ChangePasswordForm.tsx`: Menggunakan template literal dinamis dari konstanta `PASSWORD_MIN_LENGTH` untuk atribut `placeholder` dan `helperText`.
  - `prisma/seed.ts`: Mengimpor `PASSWORD_MIN_LENGTH` dan menyertakannya dalam pesan kegagalan validasi seed.
  - `docs/SECURITY.md`: Mencatat keputusan resmi pemilik mengenai panjang minimal 8 karakter dan batas atas passphrase 128 karakter beserta 4 syarat pengimbang keamanan.
  - `tests/unit/auth.test.ts`: Menambahkan pengujian dinamis batas minimum `PASSWORD_MIN_LENGTH`, batas tepat 8 karakter, passphrase hingga 128 karakter, dan penolakan > 128 karakter.
  - `tests/integration/auth.test.ts`: Menambahkan pengujian penolakan ganti sandi di bawah `PASSWORD_MIN_LENGTH` pada layanan `authService.changePassword` dan merapikan baris berkas (< 250 baris).
  - `tests/e2e/auth.spec.ts`: Memvalidasi atribut placeholder input form secara dinamis mengacu pada `PASSWORD_MIN_LENGTH`.
- **Ditambah**:
  - `changelogs/0022-2026-11-07-pemberlakuan-konstanta-tunggal-kebijakan-password-dan-batas-128-karakter.md`

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None`
- **Dampak Data**: Tidak ada perubahan struktur tabel basis data.

## 5. Perubahan Dependensi (Dependencies)

- Tidak ada penambahan atau penghapusan paket dependensi.

## 6. Dampak & Syarat Keamanan yang Dipertahankan

Sesuai instruksi dan keputusan pemilik, syarat-syarat keamanan berikut **dipertahankan mutlak**:

1. **Daftar Kata Sandi Pasaran Lokal**: Penolakan terhadap ~10.000 kata sandi umum (`common-passwords.txt`).
2. **Anti-Identity Collision**: Larangan kata sandi memuat atau sama dengan `username`.
3. **Anti-Email Collision**: Larangan kata sandi memuat atau sama dengan alamat atau prefix `email` (min. 3 karakter).
4. **Batas Maksimum Passphrase**: Batas atas minimal 128 karakter (`PASSWORD_MAX_LENGTH = 128`) untuk mendukung passphrase panjang.
5. **Rate Limiting & Anti-Enumeration**: Batas 5 kegagalan per 15 menit dengan lockout progresif dan pesan kesalahan generik.

## 7. Prosedur Verifikasi

1. Eksekusi pengujian otomatis terpadu: `pnpm test` (32 tests lulus).
2. Eksekusi pengujian E2E Playwright: `pnpm test:e2e` (7 tests lulus).
3. Pemeriksaan mutu linting, tipe, format, dan arsitektur: `pnpm check`.
4. Pemindaian kunci rahasia: `pnpm secrets:scan` (0 rahasia).

## 8. Prosedur Rollback

1. `git revert <commit-hash>`

## 9. Status Pengujian

- [x] Linting bersih (`pnpm lint`)
- [x] Typecheck bersih (`pnpm typecheck`)
- [x] Test unit & integrasi lulus (`pnpm test` — 32 tests)
- [x] Test E2E Playwright lulus (`pnpm test:e2e` — 7 tests)
- [x] Format bersih (`pnpm format:check`)
- [x] Arsitektur bersih (`node scripts/check-layers.mjs`)
- [x] Pemindaian rahasia bersih (`pnpm secrets:scan`)

## 10. Tautan Terkait & Catatan Keamanan

- Dokumen Terkait: `docs/SECURITY.md` §2.1
- Catatan Keamanan: Kebijakan kata sandi telah memenuhi kaidah OWASP ASVS L2 dan rekomendasi NIST SP 800-63B mengenai memorized secrets.

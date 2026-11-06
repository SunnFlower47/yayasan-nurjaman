# [ID: 0021] Turunkan Batas Minimal Kata Sandi dari 12 ke 8 Karakter

- **Tanggal & Waktu**: 2026-11-06 20:52 WIB (Asia/Jakarta)
- **Tipe Perubahan**: config | security | docs
- **Fase / Modul**: Fase 1b (Identitas & Akses — Login & Manajemen Sesi)
- **Penulis / Agent**: Senior Full-Stack Engineer

---

## 1. Ringkasan Perubahan

Menurunkan batas panjang minimal kata sandi dari 12 karakter menjadi 8 karakter atas keputusan pemilik. Perubahan diterapkan di konstanta kode, dokumentasi keamanan, template lingkungan, komponen UI, dan pengujian unit.

## 2. Latar Belakang & Alasan

Pemilik memutuskan bahwa 12 karakter terlalu panjang untuk konteks pengguna internal yayasan. Batas 8 karakter dianggap memadai, didukung oleh kebijakan penolakan kata sandi pasaran (10.000 daftar hitam), larangan memuat username/email, dan rate limiting (maks 5 gagal per 15 menit).

## 3. Rincian File yang Berubah

- **Diubah**:
  - `src/modules/auth/constants.ts`: `PASSWORD_MIN_LENGTH` diubah dari `12` ke `8`.
  - `src/modules/auth/helpers/password-validator.ts`: JSDoc "Minimal 12" → "Minimal 8".
  - `src/modules/auth/components/ChangePasswordForm.tsx`: Placeholder & helperText disesuaikan.
  - `docs/SECURITY.md`: Kebijakan panjang minimal diubah menjadi 8 karakter.
  - `.env.example`: Komentar dokumentasi disesuaikan.
  - `tests/unit/auth.test.ts`: Deskripsi dan input tes disesuaikan.
- **Ditambah**:
  - `changelogs/0021-2026-11-06-turunkan-batas-minimal-kata-sandi-dari-12-ke-8-karakter.md`

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None`
- **Dampak Data**: Tidak ada. Kebijakan panjang minimal hanya diterapkan di lapisan aplikasi.

## 5. Perubahan Dependensi (Dependencies)

- Tidak ada.

## 6. Dampak & Risiko

- **Dampak**: Pengguna kini dapat menetapkan kata sandi minimal 8 karakter. Kebijakan penolakan lainnya (daftar hitam, username/email collision) tetap aktif.
- **Risiko**: Permukaan serangan brute-force sedikit lebih lebar; dimitigasi oleh rate limiting dan Argon2id yang lambat.

## 7. Prosedur Verifikasi

1. `pnpm check` (lint, typecheck, 29 test lulus, format, arsitektur).
2. Verifikasi kata sandi 8 karakter diterima dan 7 karakter ditolak.

## 8. Prosedur Rollback

1. `git revert <commit-hash>`

## 9. Status Pengujian

- [x] Linting bersih (`pnpm lint`)
- [x] Typecheck bersih (`pnpm typecheck`)
- [x] Test unit & integrasi lulus (`pnpm test` — 29 tests)
- [x] Format bersih (`pnpm format:check`)
- [x] Arsitektur bersih (`node scripts/check-layers.mjs`)

## 10. Tautan Terkait & Catatan Keamanan

- Keputusan Terkait: `docs/SECURITY.md` §2.1
- Catatan Keamanan: Batas diturunkan atas keputusan eksplisit pemilik. Mitigasi sisanya (daftar hitam, rate limit, Argon2id) tetap berlaku.

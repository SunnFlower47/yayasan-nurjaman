# [ID: 0024] implementasi 2fa totp wajib recovery codes enkripsi kolom dan break glass cli

- **Tanggal & Waktu**: 2026-11-07 22.10.00 WIB (Asia/Jakarta)
- **Tipe Perubahan**: feat | security | db | ui | docs
- **Fase / Modul**: Fase 1d (Identitas dan Akses: 2FA TOTP Wajib, Recovery Codes, Enkripsi Kolom, & Prosedur Darurat)
- **Penulis / Agent**: Senior Full-Stack Engineer / Pair Programming Assistant

---

## 1. Ringkasan Perubahan

Menuntaskan implementasi Fase 1d secara menyeluruh:

1. Penegakan 2FA TOTP wajib untuk seluruh akun pengurus (keputusan pemilik) dengan Base32 secret terenkripsi AES-256-GCM.
2. Modul enkripsi kolom terotasi (`src/lib/crypto`) dengan key ring AAD yang mengikat nama tabel, kolom, dan baris.
3. Mesin TOTP berbasis RFC 6238 dengan SHA-1, step 30 detik, kode 6 digit, toleransi ±1 window step, dan pencegahan replay via `last_used_step`.
4. Pembangkitan kode pemulihan darurat (10 kode pemulihan format `XXXX-XXXX-XXXX`), disimpan sebagai hash SHA-256.
5. Pendaftaran awal di `/2fa/setup` dengan QR Code offline (data URL lokal tanpa pihak ketiga/CDN), form verifikasi `/verifikasi-2fa`, dan rotasi sesi berstatus `mfa_verified_at`.
6. Helper re-autentikasi (step-up authentication) dengan jendela batas waktu 15 menit (`requireRecentReauth`).
7. Halaman pengaturan keamanan mandiri pengurus di `/admin/keamanan` dengan validasi password sebelum menghasilkan recovery code baru.
8. Skrip CLI pemulihan darurat `pnpm admin:reset-2fa -- --username <u>` (break-glass CLI) dengan jejak audit dan pencatatan peristiwa keamanan.

## 2. Latar Belakang & Alasan

1. **Keputusan Pemilik & Akuntabilitas Standar Keamanan**: Mengacu pada keputusan pemilik mengenai kebijakan kata sandi minimal 8 karakter, sistem wajib memberlakukan 2FA TOTP bagi seluruh akun pengurus sebelum dioperasikan di lingkungan produksi.
2. **Kerahasiaan Kunci Kriptografi (NIST SP 800-63B)**: Kunci rahasia TOTP disimpan terenkripsi di database menggunakan algoritma AES-256-GCM dan key ring ber-ID agar tidak dapat dieksfiltrasi jika database bocor.
3. **Pemisahan Jalur dan Prosedur Darurat**: Penyediaan recovery code dan CLI break-glass offline memastikan yayasan tidak terkunci dari akses sistem apabila terjadi kehilangan gawai atau kegagalan perangkat TOTP pengurus.

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `prisma/migrations/20261107212500_mfa_totp_enforcement/migration.sql`: Migrasi penambahan kolom `mfa_verified_at` dan nilai enum `security_event_type`.
  - `src/lib/crypto/types.ts`: Tipe data key ring, AAD, ciphertext, dan dekripsi.
  - `src/lib/crypto/keyring.ts`: Parser key ring rotasi format `id:base64` dengan validasi ukuran 32-byte (256-bit).
  - `src/lib/crypto/column.ts`: Enkripsi & dekripsi kolom AES-256-GCM dengan AAD terikat.
  - `src/lib/crypto/index.ts`: Ekspor publik fungsionalitas kriptografi.
  - `src/modules/auth/helpers/totp.ts`: Mesin RFC 6238 TOTP, Base32 encoding/decoding, dan QR code data URL.
  - `src/modules/auth/helpers/recovery-codes.ts`: Pembangkitan dan validasi hashing recovery code.
  - `src/modules/auth/helpers/require-recent-reauth.ts`: Helper step-up otentikasi jendela 15 menit.
  - `src/modules/auth/repositories/two-factor.repository.ts`: Repository CRUD rahasia TOTP dan tabel recovery code.
  - `src/modules/auth/services/two-factor.service.ts`: Layanan bisnis 2FA lengkap terintegrasi jejak audit.
  - `src/modules/auth/actions/setup-2fa.action.ts`: Server action konfirmasi registrasi TOTP awal.
  - `src/modules/auth/actions/verify-2fa.action.ts`: Server action verifikasi login TOTP / recovery code dengan rate limit kegagalan.
  - `src/modules/auth/actions/regenerate-recovery.action.ts`: Server action pembuatan ulang 10 kode pemulihan baru.
  - `src/modules/auth/components/TwoFactorSetupForm.tsx`: Komponen antarmuka registrasi TOTP & penayangan kode pemulihan.
  - `src/modules/auth/components/TwoFactorVerifyForm.tsx`: Komponen antarmuka verifikasi tantangan langkah kedua.
  - `src/modules/auth/components/SecuritySettingsView.tsx`: Komponen pengaturan mandiri 2FA pengurus.
  - `src/app/(public)/2fa/setup/page.tsx`: Halaman penyiapan 2FA TOTP wajib.
  - `src/app/(public)/verifikasi-2fa/page.tsx`: Halaman tantangan verifikasi langkah kedua.
  - `src/app/(admin)/admin/keamanan/page.tsx`: Halaman pengelolaan 2FA & regenerasi kode pemulihan di panel admin.
  - `scripts/reset-2fa.ts`: Skrip CLI darurat break-glass untuk reset 2FA.
  - `tests/unit/crypto.test.ts`: Pengujian unit enkripsi-dekripsi AES-256-GCM, AAD tampering, dan kegagalan startup bila kunci kosong.
  - `tests/unit/totp.test.ts`: Pengujian unit RFC 6238 TOTP vektor uji resmi, window tolerance, dan replay protection.
  - `tests/integration/two-factor.test.ts`: Pengujian integrasi alur 2FA TOTP, enkripsi secret di DB, recovery code, re-autentikasi, dan lockout kegagalan.
- **Diubah**:
  - `docs/database/01-identitas-dan-akses.md`: Penambahan spesifikasi kolom `sessions.mfa_verified_at` dan event tipe MFA.
  - `docs/database/15-diff-vs-draf.md`: Pencatatan rekonsiliasi spesifikasi 2FA yang disetujui pemilik.
  - `docs/deploy/RUNBOOK.md`: Panduan SOP pengoperasian skrip break-glass reset 2FA CLI.
  - `prisma/schema/01-identity.prisma`: Penambahan kolom `mfaVerifiedAt` pada model `Session`.
  - `src/lib/env.ts`: Validasi Zod variabel lingkungan `ENCRYPTION_KEY_ACTIVE_ID` dan `ENCRYPTION_KEYS`.
  - `src/modules/auth/helpers/require-user.ts`: Penegakan otorisasi bahwa sesi aktif wajib memiliki `mfaVerifiedAt IS NOT NULL`.
  - `src/modules/auth/services/session.service.ts`: Dukungan parameter `markMfaVerified` saat rotasi token sesi.
  - `src/modules/auth/index.ts`: Ekspor publik untuk modul 2FA dan komponen keamanan.
  - `tests/e2e/auth.spec.ts`: Penambahan skenario lengkap Playwright E2E untuk login pertama, ganti sandi, penyiapan 2FA, verifikasi TOTP, dan login jalur recovery code.
  - `package.json`: Pendaftaran script `"admin:reset-2fa": "tsx scripts/reset-2fa.ts"`.

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `20261107212500_mfa_totp_enforcement`
- **Dampak Data**:
  - Penambahan kolom `mfa_verified_at TIMESTAMPTZ NULL` pada tabel `sessions`.
  - Penambahan 5 nilai baru pada enum `security_event_type`: `MFA_CHALLENGE`, `MFA_VERIFIED`, `MFA_FAILED`, `MFA_RECOVERY_USED`, `MFA_RESET`.

## 5. Dampak Terhadap Konfigurasi Lingkungan (.env)

- `ENCRYPTION_KEY_ACTIVE_ID`: ID kunci aktif saat ini (mis. `k1`).
- `ENCRYPTION_KEYS`: Pasangan kunci enkripsi terotasi format `k1:<base64-32bytes>,k2:<base64-32bytes>`. Aplikasi menolak start jika kosong.

## 6. Verifikasi Mutu & Hasil Pengujian

1. **Unit & Integration Tests**: 59 tes lulus (`pnpm test`):
   - Unit tests: `crypto.test.ts` (6 tes), `totp.test.ts` (6 tes), `auth.test.ts` (17 tes), `rbac-audit.test.ts` (4 tes), `health.test.ts` (3 tes).
   - Integration tests: `two-factor.test.ts` (7 tes), `auth.test.ts` (7 tes), `database-identity.test.ts` (5 tes), `rbac-audit.test.ts` (4 tes).
2. **E2E Tests**: 7 skenario Playwright lulus (`pnpm test:e2e`).
3. **Pemeriksaan Lintas Lapis**: 0 pelanggaran arsitektur (`node scripts/check-layers.mjs`).
4. **Pemindaian Kunci Rahasia**: 0 rahasia terdeteksi dalam 148 berkas (`pnpm secrets:scan`).
5. **Lint & Typecheck**: 0 warning, 0 error (`pnpm lint`, `pnpm typecheck`).

# [ID: 0027] migrasi eslint cli dan flat config

- **Tanggal & Waktu**: 2026-11-08 03.56.00 WIB (Asia/Jakarta)
- **Tipe Perubahan**: refactor | security | chore
- **Fase / Modul**: Tooling & Standar Kode (Fase 1c/1d)
- **Penulis / Agent**: SunnFlower47 / Pair Programming Assistant

---

## 1. Ringkasan Perubahan

1. **Migrasi dari `next lint` ke ESLint CLI Resmi**:
   - Memperbarui skrip `"lint"` pada `package.json` menjadi `"eslint . --max-warnings 0"`.
   - Menggantikan berkas konfigurasi lama `.eslintrc.json` dengan konfigurasi flat format modern `eslint.config.mjs` menggunakan `@eslint/eslintrc` `FlatCompat`.
2. **Peningkatan Versi ESLint & Penambalan Dependensi**:
   - Meningkatkan `eslint` ke `9.39.5`, `eslint-config-next` ke `15.5.29`, dan menambahkan `typescript-eslint` `8.26.0`.
   - Menambahkan override `@eslint/plugin-kit: ">=0.3.4"` di `pnpm-workspace.yaml`.
   - Kerentanan ReDoS `@eslint/plugin-kit` (GHSA-xffm-g5w8-qvg7) dan `minimatch` (GHSA-g3hv-75wg-m249) berhasil ditambal sepenuhnya.
   - Hasil audit menyeluruh (`pnpm audit` dan `pnpm audit --audit-level high`): **0 kerentanan (No known vulnerabilities found)**.
3. **Verifikasi Keberlakuan Aturan Proyek**:
   - Seluruh aturan wajib proyek tetap berjalan ketat: larangan `$queryRawUnsafe` dan `$executeRawUnsafe`, batas baris berkas (`max-lines: 250`), larangan impor database/repository pada komponen UI, batas kompleksitas (`complexity: 10`), dan larangan `console.log` di kode aplikasi.
   - Telah dibuktikan dengan injeksi pelanggaran contoh sementara (`$queryRawUnsafe` dan file > 250 baris) yang langsung terdeteksi dan digagalkan oleh ESLint CLI.
4. **Pembersihan Kode Mati**:
   - Menghapus impor `fs` yang tidak digunakan pada `scripts/check-branch.mjs`.

## 2. Latar Belakang & Alasan

- Memenuhi deprecation warning Next.js 15 yang akan menghapus `next lint` di versi 16, serta menambal celah keamanan dev tooling.

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `eslint.config.mjs`: Konfigurasi flat modern ESLint 9 untuk proyek.
- **Dihapus**:
  - `.eslintrc.json`: Konfigurasi legacy yang telah digantikan oleh `eslint.config.mjs`.
- **Diubah**:
  - `package.json` & `pnpm-lock.yaml`: Pembaruan skrip lint dan paket ESLint.
  - `pnpm-workspace.yaml`: Penambahan override `@eslint/plugin-kit`.
  - `scripts/check-branch.mjs`: Penghapusan impor modul tak terpakai.

## 4. Pemeriksaan Mutu (Quality Gates)

- **pnpm lint**: Lolos bersih (0 warning, 0 error).
- **pnpm audit**: 0 kerentanan (No known vulnerabilities found).

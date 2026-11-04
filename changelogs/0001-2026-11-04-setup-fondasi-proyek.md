# [ID: 0001] Setup Awal Proyek, Tooling, Aturan Dokumen, dan Sistem Changelog

- **Tanggal & Waktu**: 2026-11-04 20:25:00 WIB (Asia/Jakarta)
- **Tipe Perubahan**: chore / config / docs / ui
- **Fase / Modul**: Fase 0 (Fondasi Arsitektur & Tooling)
- **Penulis / Agent**: Senior Full-Stack Engineer & Product Designer

---

## 1. Ringkasan Perubahan

Sesi inisialisasi fondasi awal proyek sistem web dan panel administrasi Yayasan Nurjaman Bongas Purwakarta. Berhasil menyelesaikan penyiapan repositori git, konfigurasi Next.js 15 (App Router) + TypeScript strict (`noUncheckedIndexedAccess`), Tailwind CSS, Prisma 6 dengan PostgreSQL, Docker Compose, struktur direktori modular dengan `.gitkeep`, ekstraksi palet desain resmi dari file logo, penyusunan lima dokumen aturan dan rencana induk komprehensif, serta pembentukan sistem changelog append-only yang ditegakkan otomatis oleh git hook Husky.

## 2. Latar Belakang & Alasan

Sebagai entitas nirlaba di Purwakarta yang mengelola dana amanah sosial, yayasan memerlukan landasan sistem informasi yang memiliki integritas data tinggi, kepatuhan akuntansi (ISAK 35), transparansi publik, dan disiplin rekayasa perangkat lunak tanpa kompromi. Sesi ini meletakkan seluruh fondasi, aturan main, dan batasan ketat sebelum penulisan logika bisnis dimulai pada fase berikutnya.

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `package.json`: Definisi konfigurasi proyek, script pnpm, dan dependensi versi eksak.
  - `tsconfig.json`: Konfigurasi TypeScript strict dengan `noUncheckedIndexedAccess: true` dan alias `@/*`.
  - `.gitignore`: Proteksi file rahasia, env, database, dan build cache.
  - `.editorconfig`: Standarisasi indentasi 2 spasi dan baris baru.
  - `.nvmrc`: Penetapan versi Node.js rekomendasi (`22.13.0`).
  - `eslint.config.mjs`: Konfigurasi ESLint Flat Config dengan Next.js dan TypeScript rules.
  - `.prettierrc` & `.prettierignore`: Format kode otomatis dengan plugin Tailwind.
  - `next.config.ts`: Konfigurasi Next.js dengan output `standalone` untuk Docker.
  - `tailwind.config.ts` & `postcss.config.mjs`: Pemetaan design tokens ke kelas Tailwind.
  - `docker-compose.yml`: Layanan PostgreSQL 17 dengan volume bernama dan healthcheck.
  - `Dockerfile`: Multi-stage production container dengan user non-root `nextjs`.
  - `.env.example`: Templat konfigurasi lingkungan dengan komentar lengkap tanpa rahasia.
  - `.env`: Variabel lingkungan lokal pengembangan.
  - `prisma/schema.prisma`: Skema Prisma minimal (generator client dan datasource PostgreSQL).
  - `public/brand/logo-yayasan-nurjaman.png`: File logo resmi yayasan (sampling langsung).
  - `src/styles/tokens.css`: Definisi CSS variables (palet logo, netral stone, semantik, radius, tipografi, dark mode).
  - `src/styles/globals.css`: Utilitas global, font smoothing, tabular-nums, print stylesheet.
  - `src/lib/env.ts`: Validasi fail-fast environment variables menggunakan Zod.
  - `src/lib/db.ts`: Singleton client Prisma dengan penanganan pooling koneksi.
  - `src/lib/format.ts`: Utilitas format Rupiah standar Indonesia dan format tanggal.
  - `src/lib/errors.ts`: Kelas error terpusat (`AppError`, `ValidationError`, dll.) dengan pesan Indonesia ramah.
  - `src/app/layout.tsx`: Root layout dengan konfigurasi font `Source Serif 4` dan `Plus Jakarta Sans`.
  - `src/app/page.tsx`: Halaman placeholder minimalist ("Dalam pengembangan").
  - `src/app/api/health/route.ts`: Endpoint pemeriksaan kesehatan sistem dan konektivitas basis data.
  - `src/app/dev/tokens/page.tsx`: Halaman pratinjau tokens (aktif di development, 404 di production).
  - `scripts/new-changelog.mjs`: Skrip CLI pembuat entri changelog berurutan.
  - `scripts/check-changelog.mjs`: Skrip penegak git pre-commit hook untuk changelog.
  - `.husky/pre-commit`: Hook git untuk penegakan changelog dan lint-staged.
  - `vitest.config.ts`: Konfigurasi pengujian unit Vitest.
  - `playwright.config.ts`: Konfigurasi pengujian E2E Playwright.
  - `tests/unit/health.test.ts`: Unit test untuk utilitas format dan logika kesehatan.
  - `tests/e2e/health.spec.ts`: Smoke test Playwright untuk route `/api/health`.
  - `AGENTS.md`: Dokumen wajib baca awal sesi untuk agen AI (~35 baris).
  - `docs/WORKING-RULES.md`: Aturan pengerjaan, invarian akuntansi, standar kode, dan checklist keamanan.
  - `docs/UI-UX-RULES.md`: Panduan antarmuka, palet warna sampling logo, tipografi, dan larangan AI-slop.
  - `docs/MASTER-PLAN.md`: Rencana induk, user roles, rincian modul, roadmap Fase 0–8, dan pertanyaan terbuka.
  - `docs/ARCHITECTURE.md`: Spesifikasi arsitektur berlapis, diagram ERD konseptual, dan ADR teknis.
  - `changelogs/README.md`: Panduan sistem changelog dan format template.
  - `changelogs/0001-2026-11-04-setup-fondasi-proyek.md`: Entri changelog sesi ini.
  - Berkas `.gitkeep` pada modul domain: `src/modules/{auth,members,finance,projects,tax,content,settings,audit,backup}/` dan `src/app/{(public),(admin)/admin}/`.

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None` (Skema Prisma baru diinisialisasi hanya dengan datasource dan generator).
- **Dampak Data**: Tidak ada migrasi tabel domain yang dibuat pada sesi ini, sesuai batasan Fase 0.

## 5. Perubahan Dependensi (Dependencies)

Seluruh paket dikunci pada versi eksak (_pinned versions_):

- **Dependencies Terpasang**:
  - `next`: `15.2.1`
  - `react`: `19.0.0`
  - `react-dom`: `19.0.0`
  - `@prisma/client`: `6.4.1`
  - `zod`: `3.24.2` (Khusus untuk validasi fail-fast di `src/lib/env.ts` per instruksi Tugas 1 #4)
  - `clsx`: `2.1.1`
  - `tailwind-merge`: `3.0.2`
  - `lucide-react`: `0.475.0`
- **DevDependencies Terpasang**:
  - `typescript`: `5.7.3`
  - `@types/node`: `22.13.5`
  - `@types/react`: `19.0.10`
  - `@types/react-dom`: `19.0.4`
  - `@vitejs/plugin-react`: `4.3.4`
  - `prisma`: `6.4.1`
  - `tailwindcss`: `3.4.17`
  - `postcss`: `8.5.3`
  - `autoprefixer`: `10.4.20`
  - `eslint`: `9.21.0`
  - `eslint-config-next`: `15.2.1`
  - `prettier`: `3.5.2`
  - `prettier-plugin-tailwindcss`: `0.6.11`
  - `husky`: `9.1.7`
  - `lint-staged`: `15.4.3`
  - `vitest`: `3.0.7`
  - `@playwright/test`: `1.50.1`

## 6. Dampak & Risiko

- Seluruh perubahan berada pada tingkat konfigurasi dasar dan tooling.
- Tidak ada risiko regresi karena belum ada kode fitur yang dibangun.

## 7. Prosedur Verifikasi

1. Jalankan instalasi dependensi: `pnpm install`
2. Jalankan pemeriksaan tipe TypeScript: `pnpm typecheck`
3. Jalankan pemeriksaan linter: `pnpm lint`
4. Jalankan pengujian unit: `pnpm test`
5. Jalankan server lokal: `pnpm dev`
   - Buka `http://localhost:3000` (harus menampilkan placeholder minimalis)
   - Buka `http://localhost:3000/dev/tokens` (harus menampilkan pratinjau design tokens)
   - Buka `http://localhost:3000/api/health` (harus mengembalikan status JSON kesehatan)
6. Uji hook pre-commit changelog: buat modifikasi dummy pada file `src/` lalu jalankan `git commit`. Git wajib menolak commit tersebut jika tidak ada file changelog baru di area staged.

## 8. Prosedur Rollback

Jika diperlukan pembatalan total setup:
`git reset --hard HEAD~1` (atau menghapus berkas yang baru diinisialisasi).

## 9. Status Pengujian

- [x] Linting bersih (`pnpm lint`)
- [x] Typecheck bersih (`pnpm typecheck`)
- [x] Test unit lulus (`pnpm test`)

## 10. Tautan Terkait & Catatan Keamanan

- Keputusan Terkait: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md), [`docs/WORKING-RULES.md`](file:///docs/WORKING-RULES.md).
- Catatan Keamanan: File `.env` tidak di-commit; `.env.example` tidak memuat kunci rahasia; `src/lib/env.ts` memblokir aplikasi bila konfigurasi database tidak terdefinisi.

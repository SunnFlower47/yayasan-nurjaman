# [0003] 2026-11-05 — Standar Kode Mutu Tinggi, Batas Ukuran dan Penegakan Batas Lapisan

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Fondasi Keamanan)
- **Tipe Perubahan**: `docs`, `refactor`, `chore`
- **Lingkup**: `docs/CODE-STANDARDS.md`, `.eslintrc.json`, `scripts/check-layers.mjs`, `src/app/dev/tokens/`, `src/components/`

---

### 1. Ringkasan Perubahan

Menuliskan dokumen standar rekayasa komprehensif `docs/CODE-STANDARDS.md` yang menetapkan filosofi kode berstandar produksi, batasan ukuran terukur, pemisahan lapisan arsitektur bersih (_Clean Architecture_), serta menegakkannya secara otomatis melalui linter ESLint dan skrip verifikasi arsitektur mandiri `scripts/check-layers.mjs`.

---

### 2. Rincian Implementasi & Aturan Baru

1. **Penerbitan `docs/CODE-STANDARDS.md`**:

   - Menetapkan prinsip: _production-ready from day one_, nol kode mati (_zero dead code_), nol `console.log` (menggunakan logger terstruktur), dan kewajiban menautkan `TODO` ke nomor fase `MASTER-PLAN.md`.
   - Menetapkan batas ukuran:
     - Maksimal 250 baris per berkas (peringatan di 250, error di 300).
     - Maksimal 50 baris per fungsi/metode.
     - Kompleksitas siklomatis maksimal 10.
     - Maksimal 4 parameter fungsi (lebih dari itu wajib memakai objek bertipe).
     - Maksimal 150 baris per komponen React (.tsx).
     - 1 berkas hanya mengekspor 1 komponen utama.
   - Menetapkan pohon direktori modular `src/modules/<domain>/` yang seragam: `actions/`, `services/`, `repositories/`, `schemas/`, `components/`, `hooks/`, `types/`, `constants/`, `lib/`, `index.ts`.
   - Mengatur subdomain service (misal: `finance/services/journal/`, `finance/services/reporting/`) untuk mencegah _god service file_.
   - Menetapkan aturan lapisan (_layered boundaries_): UI dilarang akses database/repository, Server Action tipis, Service murni logika domain, dan Repository satu-satunya layer Prisma.
   - Menetapkan larangan _deep import_ antar-modul domain; akses lintas-modul hanya sah melalui file `index.ts` modul.

2. **Penegakan Otomatis Linter (`.eslintrc.json`)**:

   - Menambahkan aturan:
     - `max-lines`: `["error", { "max": 250, "skipBlankLines": true, "skipComments": true }]`
     - `complexity`: `["error", 10]`
     - `max-params`: `["error", 4]`
     - `no-console`: `["error", { "allow": ["warn", "error"] }]`
     - `@typescript-eslint/no-explicit-any`: `"error"`
     - `@typescript-eslint/no-non-null-assertion`: `"error"`
     - `no-restricted-imports`: Memblokir komponen UI dari pengimporan `@prisma/client`, `@/lib/db`, atau berkas repositori.

3. **Skrip Pengecekan Batas Arsitektur (`scripts/check-layers.mjs`)**:

   - Menulis skrip berbasis Node.js yang memindai seluruh berkas sumber di `src/` untuk:
     1. Memastikan tidak ada komponen UI di `src/components/`, `src/app/`, atau `src/modules/*/components/` yang mengimpor modul basis data atau repository.
     2. Memastikan tidak ada modul domain yang melakukan _deep import_ ke internal subdirektori modul domain lain.
   - Diintegrasikan ke dalam perintah `pnpm check` dan git hook pre-commit.

4. **Refactoring Halaman Dev Tokens (`src/app/dev/tokens/`)**:

   - Memecah berkas tunggal awal `page.tsx` (yang sebelumnya 391 baris) menjadi 4 subkomponen terpisah yang ringkas di `src/app/dev/tokens/components/`:
     - `color-palette-section.tsx` (~130 baris)
     - `typography-section.tsx` (~35 baris)
     - `spacing-radius-section.tsx` (~55 baris)
     - `contrast-matrix-section.tsx` (~65 baris)
   - Mengurangi berkas utama `page.tsx` menjadi hanya 35 baris, patuh penuh pada batas 150 baris komponen dan 250 baris berkas.

5. **Struktur Direktori Komponen Bersama**:
   - Menginisialisasi direktori `src/components/ui/`, `src/components/shared/`, dan `src/components/layout/` dengan penanda `.gitkeep`.

---

### 3. Berkas yang Ditambahkan & Dimodifikasi

- `docs/CODE-STANDARDS.md`: Dokumen standar kode baru.
- `.eslintrc.json`: Konfigurasi linter dengan batas ukuran dan larangan impor.
- `scripts/check-layers.mjs`: Skrip penegak batas lapisan arsitektur.
- `src/app/dev/tokens/page.tsx`: Refactoring ke komponen modular.
- `src/app/dev/tokens/components/*`: Subkomponen pratinjau token.
- `src/components/ui/.gitkeep`, `src/components/shared/.gitkeep`, `src/components/layout/.gitkeep`: Folder komponen bersama.

---

### 4. Cara Memverifikasi

1. Jalankan `pnpm lint` dan pastikan lulus tanpa peringatan atau galat ukuran berkas.
2. Jalankan `node scripts/check-layers.mjs` dan pastikan tertera `0 pelanggaran`.

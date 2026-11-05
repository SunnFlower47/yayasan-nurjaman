# [0006] 2026-11-05 — Penyelarasan Dokumen Rencana Induk, Aturan Kerja, Arsitektur dan UI/UX

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.5 (Pengetatan Aturan & Fondasi Keamanan)
- **Tipe Perubahan**: `docs`
- **Lingkup**: `AGENTS.md`, `docs/MASTER-PLAN.md`, `docs/WORKING-RULES.md`, `docs/ARCHITECTURE.md`, `docs/UI-UX-RULES.md`

---

### 1. Ringkasan Perubahan

Memperbarui seluruh dokumen panduan sistem yang ada agar selaras dengan pengetatan aturan baru pada Fase 0.5. Mengubah peta jalan (_roadmap_) pada `MASTER-PLAN.md` menjadi 11 fase terurut dengan prioritas strategis: **Panel Admin Terlebih Dahulu, Situs Publik Terakhir**, serta menyematkan checklist keamanan spesifik dan checklist pengujian kasus negatif pada setiap fase.

---

### 2. Rincian Pembaruan Dokumen

1. **`AGENTS.md`**:

   - Memperbarui urutan wajib baca dokumen dengan memasukkan `docs/CODE-STANDARDS.md` dan `docs/SECURITY.md`.
   - Memperketat 10 Aturan Inti: menambahkan batas ukuran berkas/fungsi, pertahanan otorisasi server-side, larangan deep-import modul, dan kebijakan nol kunci rahasia (_zero leaked secrets_).
   - Menambahkan daftar perintah CLI penting: `pnpm check`, `pnpm security:audit`, `pnpm secrets:scan`, dan verifikasi batas lapisan `check-layers.mjs`.

2. **`docs/WORKING-RULES.md`**:

   - Menyelaraskan urutan membaca dokumen kerja.
   - Menambahkan prinsip roadmap: Panel Admin dikerjakan terlebih dahulu (Fase 1 s.d. 8), disusul Situs Publik (Fase 9).
   - Memperbarui Definisi Selesai (_Definition of Done_) dengan kewajiban kelulusan script terpadu `pnpm check`, pemindaian rahasia `pnpm secrets:scan`, dan verifikasi pengujian kasus negatif.
   - Memperluas daftar merah terlarang: melarang _deep-import_ antar-modul, melarang ketergantungan otorisasi semata pada middleware, dan melarang kebocoran kunci rahasia.

3. **`docs/MASTER-PLAN.md`**:

   - Merombak peta jalan menjadi **11 Fase Terstruktur**:
     - **Fase 0**: Setup Fondasi Proyek, Tooling & Design Tokens _(Selesai)_.
     - **Fase 0.5**: Memperketat Aturan, Standar Kode & Fondasi Keamanan _(Aktif)_.
     - **Fase 1**: Fondasi Admin: Auth, 2FA, RBAC, Layout & Audit Log.
     - **Fase 2**: Pengaturan Sistem, Profil Admin & Manajemen User.
     - **Fase 3**: Manajemen Anggota & Data Masking (Enkripsi NIK).
     - **Fase 4**: Keuangan Inti & Akuntansi Nirlaba ISAK 35 (Jurnal Seimbang, Maker-Checker).
     - **Fase 5**: Proyek, Anggaran & Keterkaitan Keuangan (Pagu vs Realisasi).
     - **Fase 6**: Perpajakan Berkonfigurasi Dinamis (Master Tarif Berversi Tanggal).
     - **Fase 7**: Pelaporan ISAK 35, Dashboard & Ekspor Dokumen.
     - **Fase 8**: Manajemen Konten Admin (CMS Berita/Galeri) & Backup/Restore Sistem.
     - **Fase 9**: Website Publik, Transparansi & SEO (Mengonsumsi data CMS admin).
     - **Fase 10**: Hardening Akhir, Pentest Independen & Rilis Produksi.
   - Menyematkan **Checklist Keamanan** dan **Checklist Pengujian Kasus Negatif** (_negative test checklist_) pada setiap fase tanpa terkecuali.
   - Mencatat temuan audit dari Fase 0 pada bagian Catatan Audit.

4. **`docs/ARCHITECTURE.md`**:

   - Memperbarui tabel stack teknologi (Next.js 15.5.28 dan PostCSS 8.5.23).
   - Menyelaraskan pohon direktori proyek dengan struktur komponen bersama `src/components/` dan modul domain `src/modules/`.
   - Menambahkan bab khusus: Arsitektur Keamanan Siber & Pertahanan Berlapis (_Defense in Depth_).
   - Mendokumentasikan Architectural Decision Records (ADR-001 hingga ADR-007):
     - ADR-001: Next.js App Router + Modular Monolith.
     - ADR-002: PostgreSQL + Prisma Migration Only.
     - ADR-003: Prioritas Roadmap: Admin Panel Terlebih Dahulu, Situs Publik Terakhir.
     - ADR-004: Defense in Depth Server-Side Authorization.
     - ADR-005: Presisi Finansial BigInt/Decimal & Keseimbangan Jurnal.
     - ADR-006: Konfigurasi Tarif Pajak Berversi Tanggal.
     - ADR-007: Nonce-based CSP & Strict HTTP Security Headers.

5. **`docs/UI-UX-RULES.md`**:
   - Menambahkan bab Pustaka Komponen Antarmuka Bersama (`src/components/shared/`): `DataTable`, `PageHeader`, `ConfirmDialog`, `MoneyInput`, `EmptyState`, `StatusBadge`, `FormField`.

---

### 3. Berkas yang Diubah

- `AGENTS.md`
- `docs/MASTER-PLAN.md`
- `docs/WORKING-RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/UI-UX-RULES.md`

---

### 4. Cara Memverifikasi

Periksa konsistensi seluruh dokumen panduan dengan membaca daftar isi dan memastikan tidak ada kontradiksi ketentuan teknis antar-dokumen.

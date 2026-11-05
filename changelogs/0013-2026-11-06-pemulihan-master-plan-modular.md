# [ID: 0013] Pemulihan Lengkap Rencana Induk Pengembangan dan Modularisasi Master Plan

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.6 (Pemulihan & Penyelarasan Rencana Induk)
- **Tipe Perubahan**: `docs`
- **Branch**: `docs/database-design`
- **Lingkup**: `docs/MASTER-PLAN.md`, `docs/master-plan/` (`00-index.md` s.d. `06-publik-dan-rilis.md`), `AGENTS.md`, `docs/ARCHITECTURE.md`

---

### 1. Ringkasan Perubahan

1. **Pemulihan Penuh Isi Rencana Induk (`docs/MASTER-PLAN.md`)**:

   - Memulihkan seluruh konten yang sebelumnya tereduksi demi batas baris kode:
     - Bagian A: Sub-bagian `1. Tujuan Sistem` dan `2. Prioritas Pengerjaan: Admin Panel Terlebih Dahulu, Situs Publik Terakhir`.
     - Bagian B: Deskripsi mendalam 7 peran pengguna kelembagaan dengan pemisahan tugas (_segregation of duties_).
     - Bagian C: Diagram roadmap Mermaid yang mencakup Fase 0.6 secara sekuensial.
     - Bagian D: Seluruh rincian fase (Fase 0 s.d. Fase 10), lengkap dengan Tujuan, Ruang Lingkup komprehensif, Checklist Keamanan terverifikasi, dan Checklist Pengujian Kasus Negatif.
     - Bagian E: Tabel status fase terpadu dengan penunjuk modul dan ID changelog.
     - Bagian F: 5 pertanyaan terbuka dan asumsi operasional untuk pemilik proyek.
     - Bagian G: 5 catatan audit dan remediasi keamanan lengkap.

2. **Organisasi Modular `docs/master-plan/`**:

   - Memecah rincian mendalam tiap fase ke dalam berkas modular di `docs/master-plan/` tanpa mereduksi atau meringkas satu pun butir persyaratan:
     - `00-index.md`: Indeks navigasi dan prinsip sekuensial admin-first.
     - `01-fondasi-dan-setup.md`: Spesifikasi Fase 0, Fase 0.5, Fase 0.6, dan Fase 0.7.
     - `02-admin-dan-kelembagaan.md`: Spesifikasi Fase 1 (Auth, 2FA, RBAC, Audit) dan Fase 2 (Profil & User Admin).
     - `03-anggota-dan-keuangan.md`: Spesifikasi Fase 3 (Anggota & Data Masking) dan Fase 4 (Keuangan Inti & ISAK 35).
     - `04-proyek-dan-pajak.md`: Spesifikasi Fase 5 (Proyek & Anggaran) dan Fase 6 (Perpajakan Dinamis).
     - `05-pelaporan-dan-cms.md`: Spesifikasi Fase 7 (Pelaporan ISAK 35 & Ekspor) dan Fase 8 (CMS Admin & Backup/Restore).
     - `06-publik-dan-rilis.md`: Spesifikasi Fase 9 (Website Publik & Transparansi) dan Fase 10 (Hardening, Pentest & Rilis).
   - Menjadikan `docs/MASTER-PLAN.md` sebagai berkas induk (_single source of truth_) yang memuat seluruh judul, ringkasan, dan penunjuk modular.

3. **Pembaruan Rujukan Dokumen**:
   - Memperbarui rujukan bacaan wajib pada `AGENTS.md` untuk mencakup indeks rincian modular `docs/master-plan/`.
   - Menyelaraskan pohon direktori pada `docs/ARCHITECTURE.md`.

---

### 2. Verifikasi Mutu & Kepatuhan Batas

- **Batas Ukuran Berkas**: Seluruh berkas di `docs/master-plan/` dan `docs/MASTER-PLAN.md` berada di bawah 250 baris per berkas.
- **Keterpeliharaan Data Domain**: Tidak ada berkas di `src/` atau `prisma/` yang diubah.
- **Pemeriksaan Lintas Lapis & Rahasia**: `pnpm check` dan `pnpm secrets:scan` lolos 100% tanpa galat.

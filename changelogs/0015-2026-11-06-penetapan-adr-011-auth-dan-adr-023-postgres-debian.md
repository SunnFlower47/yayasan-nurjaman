# [ID: 0015] Penetapan ADR-011 (Auth Tipis Mandiri), ADR-023 (PostgreSQL Debian), dan Penyelarasan Master Plan

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.7 (Transisi dari Fase 0.6 ke Stack Docker Lengkap)
- **Tipe Perubahan**: `docs`
- **Branch**: `feat/docker-stack`
- **Lingkup**: `docs/architecture/`, `docs/database/15-diff-vs-draf.md`, `docs/MASTER-PLAN.md`, `docs/master-plan/`, `docs/WORKING-RULES.md`, `.husky/pre-commit`, `scripts/check-branch.mjs`

---

### 1. Ringkasan Perubahan

1. **Penetapan Final ADR-011 (Auth Tipis Buatan Sendiri)**:

   - Pemilik memutuskan **Jalan 2: Auth Tipis Buatan Sendiri (Lightweight In-House Auth)** berstatus **DIPUTUSKAN** dengan 9 syarat ketat:
     1. Algoritma hash kata sandi: Argon2id (`@node-rs/argon2`, memory 64MB, time 3, parallelism 4).
     2. Token sesi acak berentropi tinggi (minimal 256-bit kriptografis), disimpan hanya dalam bentuk hash SHA-256 di kolom `sessions.token_hash`.
     3. Rotasi token sesi instan saat login berhasil dan saat terjadi perubahan peran/hak akses pengguna.
     4. TOTP RFC 6238 dengan pencegahan replay token (`last_used_step` atau pelacakan timestamp counter).
     5. Pembatasan laju (_rate limiting_) berbasis tabel `rate_limit_counters` dengan normalisasi alamat IPv6 ke blok subnet `/64`.
     6. Bebas dari registrasi publik, OAuth pihak ketiga, maupun magic link (hanya login pengurus internal).
     7. Seluruh alur autentikasi dan otorisasi terpusat di satu modul domain `src/modules/auth` dengan pengujian kasus negatif.
     8. Wajib diaudit secara independen saat uji penetrasi (_pentest_) Fase 10.
     9. Ditinjau ulang apabila di masa depan kebutuhan sistem bertambah.
   - Status di `docs/database/15-diff-vs-draf.md` diperbarui dari "diubah, MENUNGGU PERSETUJUAN" menjadi "dibatalkan, draf dipertahankan", membuktikan 12 tabel Modul 1 identitas dan akses 100% mematuhi draf asli pemilik.

2. **Perumusan ADR-023 (Pemilihan Varian Image PostgreSQL Produksi: Debian vs Alpine)**:

   - Menetapkan penggunaan **`postgres:17.2-bookworm` (Official Debian-based)** untuk seluruh container basis data dan worker pencadangan produksi dengan status **DIPUTUSKAN**.
   - Alasan: GNU C Library (glibc) standar industri menjamin stabilitas collation string teks yang teruji, mencegah risiko korupsi indeks B-tree saat update container libc, mendukung penuh locale Indonesia (`id_ID.UTF-8`), serta menjamin kompatibilitas biner mutlak antara server PostgreSQL dan perkakas `pg_dump`/`pg_restore`.

3. **Penyelarasan Status Fase Master Plan**:

   - Status **Fase 0.6** ditandai sebagai **"Selesai dengan catatan"** di `docs/MASTER-PLAN.md` dan `docs/master-plan/`.
   - Tugas-tugas sisa Fase 0.6 didelegasikan ke fase terkait sebagai tugas bercentang:
     - Implementasi 10 kueri laporan keuangan ISAK 35 (`12-reporting-queries.md`) dipindahkan ke Fase 7.
     - Validasi 8 skenario keuangan operasional (`13-scenarios.md`) dipindahkan ke Fase 4.
     - Pengujian otomatis invarian DDL dengan nama tabel asli skema basis data dipindahkan ke Fase 4 (sebagai unit/integration test).
     - Pemetaan dan implementasi auth tipis mandiri dipindahkan ke awal Fase 1.
   - Status **Fase 0.7** resmi ditandai sebagai **"Berjalan"**.

4. **Proteksi Branch Utama pada Git Hook Husky & Aturan Kerja**:
   - Menambahkan skrip `scripts/check-branch.mjs` yang diintegrasikan ke `.husky/pre-commit` untuk menolak commit langsung pada branch `main` atau `master` (merge commit tetap diizinkan).
   - Menambahkan catatan penegasan di `docs/WORKING-RULES.md` bahwa hook lokal dapat dilewati pengembang via `--no-verify`, sehingga branch protection rules pada remote Git hosting wajib diaktifkan segera setelah repositori terhubung.

---

### 2. Verifikasi Mutu & Batas Ukuran

- Seluruh berkas dokumentasi (`docs/`) tetap berada di bawah batas 250 baris per berkas.
- Tidak ada kode fitur domain yang dibuat di luar konfigurasi tooling dan dokumentasi.

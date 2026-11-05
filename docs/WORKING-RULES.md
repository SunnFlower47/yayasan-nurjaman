# Aturan Kerja Pengembangan (Working Rules)

## Yayasan Nurjaman Bongas Purwakarta

Dokumen ini mendefinisikan standar teknis, alur operasional, dan pedoman kepatuhan yang mengikat untuk seluruh tim pengembang dan AI agent dalam membangun sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen ini wajib ditaati tanpa kompromi.

---

## A. Alur Kerja (Workflow)

1. **Membaca Dokumen Sebelum Mulai**:
   Setiap sesi atau tugas baru dimulai dengan membaca urutan dokumen: [`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md) → [`WORKING-RULES.md`](file:///docs/WORKING-RULES.md) → [`CODE-STANDARDS.md`](file:///docs/CODE-STANDARDS.md) → [`SECURITY.md`](file:///docs/SECURITY.md) → [`UI-UX-RULES.md`](file:///docs/UI-UX-RULES.md) → [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).
2. **Prioritas Alur: Panel Admin Utama Dahulu, Situs Publik Terakhir**:
   Sistem memprioritaskan penyelesaian fondasi administratif, manajemen anggota, tata kelola keuangan ISAK 35, proyek, pajak, dan CMS internal terlebih dahulu (Fase 1 hingga Fase 8) sebelum membangun situs web publik (Fase 9). Hal ini memastikan situs publik mengonsumsi data riil yang telah terkelola dengan baik.
3. **Satu Fase/Tugas dalam Satu Waktu**:
   Pengerjaan dilakukan secara sekuensial berdasarkan roadmap fase pada [`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md). Setelah seluruh kriteria selesai terpenuhi, pengembang/agent **wajib berhenti**, memberikan laporan akhir sesuai format bagian J, dan menunggu konfirmasi sebelum melangkah ke fase berikutnya.
4. **Penanganan Ambiguitas**:
   - **Ambiguitas Berdampak Besar** (skema entitas database, aturan akuntansi, regulasi perpajakan, model izin keamanan): **Wajib bertanya terlebih dahulu** kepada pemilik proyek. Jangan berasumsi.
   - **Ambiguitas Kecil** (penamaan utilitas internal, tata letak sekunder non-kritis): Ambil keputusan logis yang paling konservatif, lalu dokumentasikan secara transparan pada [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md) dan entri changelog.
5. **Disiplin Lingkup (Scope Discipline)**:
   - Kerjakan **hanya** yang diminta pada ruang lingkup tugas aktif.
   - **Dilarang melakukan refactoring "sekalian"**, menata ulang modul lain, atau menambahkan fitur di luar lingkup.
   - Jika menemukan cacat kode, celah potensial, atau peluang optimasi di luar tugas aktif, catat temuan tersebut di bagian **"Temuan & Pertanyaan Terbuka"** pada [`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md). Jangan langsung dikerjakan.

---

## B. Aturan Ketat Changelog

Sistem pencatatan perubahan berpegang pada panduan [`changelogs/README.md`](file:///changelogs/README.md).

1. **Kewajiban Mutlak**: Setiap perubahan logis (fitur baru, perbaikan bug, refactor, migrasi DB, dependensi, konfigurasi, dokumen aturan, patch keamanan) wajib memiliki tepat satu file entri di `changelogs/` sebelum tugas dinyatakan selesai dan sebelum di-commit.
2. **Sifat Append-Only**: File changelog lama tidak boleh diedit atau dihapus. Kesalahan atau pembatalan dicatat sebagai entri baru yang merujuk pada ID changelog sebelumnya.
3. **Penamaan File**: `NNNN-YYYY-MM-DD-slug.md` (misal: `0001-2026-11-04-setup-fondasi-proyek.md`). Dibuat menggunakan `pnpm changelog:new "judul"`.
4. **Commit Message**: Wajib menyertakan ID changelog terkait, misal: `feat(finance): implementasi jurnal umum [ID: 0012]`.
5. **Penegakan Otomatis (Husky Pre-commit)**:
   Git hook secara otomatis memblokir commit jika ada perubahan pada `src/`, `prisma/`, `scripts/`, `docs/`, `.github/`, atau konfigurasi root tanpa menyertakan file entri di `changelogs/`, jika terdapat rahasia bocor via `scan-secrets.mjs`, atau jika terjadi pelanggaran layer via `check-layers.mjs`.

---

## C. Manajemen Git & Percabangan

1. **Branching Model**:
   - `main`: Branch stabil production-ready.
   - `feat/<nama-fase-atau-fitur>`: Pengembangan fitur baru (contoh: `feat/finance-journal`).
   - `fix/<isu>`: Perbaikan bug spesifik (contoh: `fix/tax-rate-lookup`).
   - `chore/<tugas>`: Pemeliharaan dependensi, konfigurasi, atau tooling (contoh: `chore/vitest-upgrade`).
   - `docs/<dokumen>`: Pembaruan murni dokumentasi aturan dan panduan.
2. **Conventional Commits**:
   Gunakan struktur baku: `<type>(<scope>): <deskripsi singkat> [ID: NNNN]`.
   Tipe yang valid: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `build`, `ci`.
3. **Commit Atomik**: Setiap commit menyelesaikan satu unit pekerjaan yang koheren.
4. **Proteksi File Sensitif**: Dilarang keras melakukan commit terhadap `.env`, credentials, secret keys, dump SQL, database binary, atau berkas unggahan publik.

---

## D. Standar Kode, Kualitas & Batas Ukuran

Sesuai dengan ketentuan rinci pada [`docs/CODE-STANDARDS.md`](file:///docs/CODE-STANDARDS.md):

1. **Batas Ukuran yang Ditegakkan Linter**:
   - Berkas sumber: maksimal 250 baris (error di 300 baris).
   - Fungsi / Metode: maksimal 50 baris; kompleksitas siklomatis maksimal 10; parameter maksimal 4.
   - Komponen React: maksimal 150 baris.
   - 1 berkas hanya mengekspor 1 komponen utama.
2. **Arsitektur Berlapis Bersih (`src/modules/<domain>/`)**:
   - **Route / Server Action** (`actions/` atau route handlers): Tipis, hanya otentikasi → otorisasi → validasi Zod → panggil service → kembalikan hasil bertipe.
   - **Service Layer** (`services/`): Logika bisnis, kalkulasi finansial, transaksi DB, dan orkestrasi. Bebas dari ketergantungan objek HTTP web.
   - **Repository Layer** (`repositories/`): Satu-satunya layer yang mengakses basis data Prisma.
   - **UI Components** (`components/`): Presentasional murni. **Dilarang keras memanggil query Prisma atau repositori langsung dari komponen UI.**
   - **Batas Antar-Modul**: Komunikasi lintas modul HANYA melalui `src/modules/<domain>/index.ts`. Dilarang keras melakukan deep import.
3. **Validasi Batas Sistem (Zod Validation)**:
   Setiap data eksternal wajib divalidasi dengan skema Zod di server sebelum diproses oleh layer service.
4. **Nol Kode Mati & Nol `console.log`**:
   Wajib menggunakan logger terstruktur. `TODO` wajib merujuk ke nomor fase `MASTER-PLAN.md`.
5. **Penanganan Error Terpusat**:
   - Menggunakan kelas `AppError` dari [`src/lib/errors.ts`](file:///src/lib/errors.ts) dengan kode galat terstruktur.

---

## E. Standar & Disiplin Database (Prisma & PostgreSQL)

1. **Hanya Melalui Prisma Migration**:
   - Gunakan `pnpm db:migrate` (`prisma migrate dev`).
   - **Dilarang keras menggunakan `prisma db push`** pada lingkungan pengembangan bersama atau produksi.
   - File migrasi yang sudah pernah diaplikasikan dan di-commit **tidak boleh diubah atau dihapus**.
2. **Penyimpanan Nilai Keuangan (Anti-Float)**:
   - **Dilarang keras menyimpan nilai uang dalam tipe float atau double!**
   - Nilai uang disimpan dalam **integer Rupiah terkecil** menggunakan tipe data `BigInt` (atau `Decimal(15, 2)`).
3. **Audit Jejak Waktu & Soft Delete**:
   - Seluruh tabel wajib memiliki kolom `created_at` dan `updated_at`.
   - Data keuangan tidak pernah dihapus fisik (hard delete). Pembatalan dilakukan via mekanisme `status: void` atau jurnal pembalik penyesuaian.

---

## F. Invarian Akuntansi (Prinsip Sakral Tanpa Kompromi)

1. **Keseimbangan Jurnal Ganda**:
   Total Debit WAJIB persis sama dengan total Kredit:
   $$\sum \text{Debit} = \sum \text{Kredit}$$
   Jika tidak seimbang, sistem wajib menolak transaksi pada layer service sebelum menyentuh database.
2. **Kekekalan Transaksi Posted (Immutability)**:
   Transaksi keuangan dengan status `POSTED` **tidak dapat diubah, diedit, atau dihapus**.
3. **Penutupan Buku (Closed Period Lock)**:
   Periode akuntansi yang telah berstatus `CLOSED` (Tutup Buku) terkunci permanen.
4. **Tarif Pajak Berversi**:
   Tarif pemotongan pajak (PPh 21, PPh 23, PPh Final 4(2), PPN) **tidak boleh di-hardcode**. Tarif wajib dibaca dari master data dengan tanggal efektif (`effective_date`).
5. **Jejak Audit Mutlak**:
   Setiap mutasi data keuangan wajib menghasilkan catatan jejak audit otomatis (`audit_logs`) append-only.

---

## G. Keamanan (Security Checklist per Perubahan)

Sesuai dengan ketentuan komprehensif pada [`docs/SECURITY.md`](file:///docs/SECURITY.md):

1. [ ] **Otorisasi di Sisi Server**: Izin (`requirePermission`) dicek langsung di server/action, bukan hanya di UI atau middleware.
2. [ ] **Proteksi IDOR**: Setiap kueri data memverifikasi kepemilikan dan batas hak akses pengguna.
3. [ ] **Nol Rahasia (Zero Secrets)**: Pemindaian rahasia lolos via `pnpm secrets:scan`.
4. [ ] **Sanitasi HTML**: Seluruh masukan teks kaya disaring dengan daftar putih ketat (DOMPurify).
5. [ ] **Validasi Berkas Unggahan**: Validasi ekstensi, MIME type, dan _magic bytes_. Nama berkas diacak dengan UUIDv4.
6. [ ] **Pencegahan Command & SQL Injection**: Parameterized queries 100% via Prisma; dilarang shell execution dari input pengguna.
7. [ ] **Header Keamanan & Larangan Pengindeksan Admin**: CSP nonce, HSTS, X-Frame-Options: DENY, dan X-Robots-Tag: noindex pada rute admin dan API.

---

## H. Standar Penambahan Dependensi (Third-Party Packages)

1. **Prinsip Minimalis**: Dependensi baru hanya jika esensial dan disetujui.
2. **Versi Eksak (Pinned Version)**: Dilarang menggunakan prefix range `^` atau `~` pada `package.json`.
3. **Jeda Rilis Minimal 14 Hari**: Dilarang memasang paket yang dirilis kurang dari 14 hari tanpa riwayat audit terbuka.
4. **Audit Kerentanan**: Wajib menjalankan `pnpm security:audit` dan memastikan tidak ada kerentanan High atau Critical.

---

## I. Testing & Definisi Selesai (Definition of Done)

Sebuah tugas atau fase pengerjaan dianggap **SELESAI (DONE)** hanya jika:

1. `pnpm check` berjalan sukses tanpa galat (lint, typecheck, test, format:check, check-layers).
2. Pemindaian rahasia `pnpm secrets:scan` bersih dari temuan (0 leaked secrets).
3. Batas ukuran berkas, fungsi, dan komponen mematuhi `CODE-STANDARDS.md`.
4. Seluruh uji negatif keamanan (_negative test cases_: 401 unauthenticated, 403 unauthorized, 422 malformed) terverifikasi.
5. Antarmuka UI telah lulus checklist review pada [`UI-UX-RULES.md`](file:///docs/UI-UX-RULES.md).
6. Seluruh dokumen aturan terkait ([`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md) dan [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md)) telah diperbarui sesuai status terbaru.
7. Entri changelog baru telah dibuat pada `changelogs/` dan dicantumkan pada commit message.

---

## J. Format Laporan Akhir Setiap Tugas

Setiap kali menyelesaikan sebuah fase atau tugas mandiri, agen/pengembang wajib menyusun laporan penutup dengan struktur berikut:

```markdown
### 1. Ringkasan Pekerjaan

Penjelasan ringkas pekerjaan yang berhasil diselesaikan pada sesi ini.

### 2. Daftar Berkas Penting yang Ditambahkan / Dimodifikasi

- `path/file1` - Penjelasan fungsi
- `path/file2` - Penjelasan fungsi

### 3. Cara Menjalankan & Memverifikasi

Perintah dan skenario langkah demi langkah untuk menguji hasil pengerjaan.

### 4. Keputusan Arsitektur / Teknis yang Diambil

Pilihan desain atau teknologi yang ditetapkan beserta alasannya.

### 5. Hal yang Belum Selesai / Pertanyaan Terbuka

Catatan yang memerlukan persetujuan pemilik proyek sebelum fase berikutnya.

### 6. Rujukan Changelog

ID Changelog yang mencatat perubahan ini (contoh: `[ID: 0002]`).
```

---

## K. Larangan Eksplisit (Daftar Merah Terlarang)

- ❌ **Dilarang**: Mengedit transaksi keuangan berstatus `POSTED`.
- ❌ **Dilarang**: Melakukan transaksi jurnal tidak seimbang (Debit $\neq$ Kredit).
- ❌ **Dilarang**: Menyimpan nominal uang dalam tipe data floating point.
- ❌ **Dilarang**: Meng-hardcode tarif perpajakan di dalam kode program.
- ❌ **Dilarang**: Menghapus baris catatan keuangan secara fisik (hard delete).
- ❌ **Dilarang**: Menjalankan `prisma db push` di luar prosedur migrasi resmi.
- ❌ **Dilarang**: Menggunakan tipe data `any` tanpa penjelasan alasan teknis.
- ❌ **Dilarang**: Melakukan deep import antar-folder internal modul domain lain.
- ❌ **Dilarang**: Mengandalkan middleware saja untuk otorisasi tanpa verifikasi di server action.
- ❌ **Dilarang**: Melakukan commit tanpa entri baru di folder `changelogs/`.
- ❌ **Dilarang**: Menambahkan komponen dan layout berpenampilan "AI-slop".
- ❌ **Dilarang**: Melanjutkan ke fase berikutnya sebelum mendapat persetujuan laporan akhir.

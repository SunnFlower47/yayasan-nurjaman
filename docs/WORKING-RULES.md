# Aturan Kerja Pengembangan (Working Rules)

## Yayasan Nurjaman Bongas Purwakarta

Dokumen ini mendefinisikan standar teknis, alur operasional, dan pedoman kepatuhan yang mengikat untuk seluruh tim pengembang dan AI agent dalam membangun sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen ini wajib ditaati tanpa kompromi.

---

## A. Alur Kerja (Workflow)

1. **Membaca Dokumen Sebelum Mulai**:
   Setiap sesi atau tugas baru dimulai dengan membaca urutan dokumen: [`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md) → [`WORKING-RULES.md`](file:///docs/WORKING-RULES.md) → [`UI-UX-RULES.md`](file:///docs/UI-UX-RULES.md) → [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).
2. **Satu Fase/Tugas dalam Satu Waktu**:
   Pengerjaan dilakukan secara sekuensial berdasarkan roadmap fase pada [`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md). Setelah seluruh kriteria selesai terpenuhi, pengembang/agent **wajib berhenti**, memberikan laporan akhir sesuai format bagian J, dan menunggu konfirmasi sebelum melangkah ke fase berikutnya.
3. **Penanganan Ambiguitas**:
   - **Ambiguitas Berdampak Besar** (skema entitas database, aturan akuntansi, regulasi perpajakan, model izin keamanan): **Wajib bertanya terlebih dahulu** kepada pemilik proyek. Jangan berasumsi.
   - **Ambiguitas Kecil** (penamaan utilitas internal, tata letak sekunder non-kritis): Ambil keputusan logis yang paling konservatif, lalu dokumentasikan secara transparan pada [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md) dan entri changelog.
4. **Disiplin Lingkup (Scope Discipline)**:
   - Kerjakan **hanya** yang diminta pada ruang lingkup tugas aktif.
   - **Dilarang melakukan refactoring "sekalian"**, menata ulang modul lain, atau menambahkan fitur di luar lingkup.
   - Jika menemukan cacat kode, celah potensial, atau peluang optimasi di luar tugas aktif, catat temuan tersebut di bagian **"Temuan"** pada [`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md). Jangan langsung dikerjakan.

---

## B. Aturan Ketat Changelog

Sistem pencatatan perubahan berpegang pada panduan [`changelogs/README.md`](file:///changelogs/README.md).

1. **Kewajiban Mutlak**: Setiap perubahan logis (fitur baru, perbaikan bug, refactor, migrasi DB, dependensi, konfigurasi, dokumen aturan, patch keamanan) wajib memiliki tepat satu file entri di `changelogs/` sebelum tugas dinyatakan selesai dan sebelum di-commit.
2. **Sifat Append-Only**: File changelog lama tidak boleh diedit atau dihapus. Kesalahan atau pembatalan dicatat sebagai entri baru yang merujuk pada ID changelog sebelumnya.
3. **Penamaan File**: `NNNN-YYYY-MM-DD-slug.md` (misal: `0001-2026-11-04-setup-fondasi-proyek.md`). Dibuat menggunakan `pnpm changelog:new "judul"`.
4. **Commit Message**: Wajib menyertakan ID changelog terkait, misal: `feat(finance): implementasi jurnal umum [ID: 0012]`.
5. **Penegakan Otomatis (Husky Pre-commit)**:
   Git hook secara otomatis memblokir commit jika ada perubahan pada `src/`, `prisma/`, `scripts/`, atau konfigurasi root tanpa menyertakan file entri di `changelogs/`. Bypass darurat `SKIP_CHANGELOG_CHECK=1` hanya diizinkan untuk kegagalan fatal mendesak dan penggunaannya wajib dipertanggungjawabkan pada entri berikutnya.

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
4. **Proteksi File Sensitif**: Dilarang keras melakukan commit terhadap `.env`, credentials, secret keys, dump SQL, database binary, atau berkas unggahan publik (`/public/uploads`).

---

## D. Standar Kode & Kualitas

1. **TypeScript Strict**:
   - `noUncheckedIndexedAccess: true` wajib aktif.
   - **Dilarang menggunakan `any`**. Jika kondisi terpaksa menggunakan generic type atau unknown, sertakan komentar penjelasan alasan teknisnya.
   - Dilarang menggunakan non-null assertion operator (`!`) sembarangan. Gunakan optional chaining (`?.`) dan nullish coalescing (`??`) atau validasi eksplisit.
2. **Arsitektur Berlapis per Modul (`src/modules/<domain>/`)**:
   - **Route / Server Action** (`actions/` atau route handlers): Hanya menerima request, mengecek sesi/izin awal, memanggil service, dan mengembalikan respon.
   - **Service Layer** (`services/`): Tempat beradanya seluruh logika bisnis, kalkulasi keuangan, validasi proses, pemanggilan audit log, dan orkestrasi transaksi DB.
   - **Repository Layer** (`repositories/`): Mengabstraksi seluruh akses Prisma/database. Tidak boleh ada logika bisnis di layer ini.
   - **UI Components** (`components/`): Bersifat presentasional murni. **Dilarang keras memanggil query Prisma langsung dari komponen UI.**
3. **Validasi Batas Sistem (Zod Validation)**:
   Setiap data yang masuk dari luar sistem (request payload, query string, parameter route, form input, parsing file eksternal) **wajib divalidasi dengan skema Zod** di server sebelum diproses oleh layer service.
4. **Penanganan Error Terpusat**:
   - Error ditangani eksplisit menggunakan kelas turunan `AppError` dari [`src/lib/errors.ts`](file:///src/lib/errors.ts).
   - Pesan error untuk pengguna wajib menggunakan Bahasa Indonesia yang sopan, ramah, dan membantu pemecahan masalah tanpa menyalahkan pengguna.
   - Detail teknis, error code mendalam, dan stack trace **hanya dicatat pada log server**, tidak boleh bocor ke client demi keamanan.
5. **Anti Magic String / Magic Number**:
   Seluruh nilai konstanta bisnis, batas nilai, dan string status wajib didefinisikan dalam constant enum atau diambil dari konfigurasi environment (`src/lib/env.ts`) atau tabel pengaturan basis data.

---

## E. Standar & Disiplin Database (Prisma & PostgreSQL)

1. **Hanya Melalui Prisma Migration**:
   - Gunakan `pnpm db:migrate` (`prisma migrate dev`).
   - **Dilarang keras menggunakan `prisma db push`** pada lingkungan pengembangan bersama atau produksi.
   - File migrasi yang sudah pernah diaplikasikan dan di-commit **tidak boleh diubah atau dihapus**. Perubahan skema wajib dibuat melalui migrasi baru.
2. **Penyimpanan Nilai Keuangan (Anti-Float)**:
   - **Dilarang keras menyimpan nilai uang dalam tipe float atau double!**
   - Nilai uang disimpan dalam **integer Rupiah terkecil** menggunakan tipe data `BigInt` (atau `Decimal(15, 2)` untuk kepatuhan kalkulasi presisi tinggi) sesuai ketetapan arsitektur.
3. **Audit Jejak Waktu & Soft Delete**:
   - Seluruh tabel wajib memiliki kolom `created_at` dan `updated_at`.
   - Data keuangan (jurnal, transaksi, rincian biaya, bukti potong pajak, donasi) **tidak pernah dihapus fisik (hard delete)** demi integritas audit hukum. Pembatalan dilakukan melalui mekanisme `status: void` atau jurnal koreksi pembalik.

---

## F. Invarian Akuntansi (Prinsip Sakral Tanpa Kompromi)

Aturan berikut bersifat mutlak dan tidak boleh dilanggar dalam skenario apa pun:

1. **Keseimbangan Jurnal Ganda**:
   Setiap transaksi jurnal keuangan wajib memiliki total Debit yang persis sama dengan total Kredit:
   $$\sum \text{Debit} = \sum \text{Kredit}$$
   Jika tidak seimbang, sistem wajib menolak transaksi pada layer service sebelum menyentuh database.
2. **Kekekalan Transaksi Posted (Immutability)**:
   Transaksi keuangan dengan status `POSTED` **tidak dapat diubah, diedit, atau dihapus**.
   Koreksi atas kesalahan transaksi hanya dapat dilakukan dengan membuat transaksi pembatalan (`VOID`) dan/atau menerbitkan jurnal pembalik penyesuaian.
3. **Penutupan Buku (Closed Period Lock)**:
   Periode akuntansi yang telah berstatus `CLOSED` (Tutup Buku) terkunci secara permanen. Tidak boleh ada transaksi jurnal baru yang diposting ke dalam tanggal periode tersebut.
4. **Tarif Pajak Berversi**:
   Tarif pemotongan pajak (PPh Pasal 21, PPh Pasal 23, PPh Final Pasal 4 ayat 2, PPN) **tidak boleh di-hardcode** dalam kode sumber aplikasi. Tarif wajib dibaca dari master data perpajakan dengan batas tanggal berlaku efektif (`effective_date`).
5. **Jejak Audit Mutlak**:
   Setiap mutasi data keuangan wajib menghasilkan catatan jejak audit otomatis (`audit_logs`) yang merekam: siapa (`user_id`), kapan (`timestamp`), aksi apa (`event`), data sebelum (`old_values`), dan data sesudah (`new_values`).

---

## G. Keamanan (Security Checklist per Perubahan)

Setiap penambahan atau modifikasi kode wajib memenuhi checklist keamanan berikut:

1. [ ] **Otorisasi di Server**: Hak akses dan permission dicek langsung di server/action, bukan hanya mengandalkan logika penyembunyian tombol di antarmuka UI.
2. [ ] **Proteksi IDOR (Insecure Direct Object Reference)**: Setiap pengambilan atau pembaruan resource berbasis ID wajib memverifikasi kepemilikan atau hak otoritas pengguna terhadap resource tersebut.
3. [ ] **Nol Rahasia (Zero Secrets)**: Tidak ada token rahasia, kunci enkripsi, atau password yang tertulis di kode, repo, maupun log output server.
4. [ ] **Sanitasi Konten**: Seluruh input teks kaya (rich text) dari editor artikel/berita wajib disanitasi menggunakan pustaka HTML sanitizer sebelum dirender untuk mencegah Cross-Site Scripting (XSS).
5. [ ] **Validasi Berkas Unggahan**: Berkas yang diunggah wajib divalidasi MIME type asli, batas ukuran maksimal (misal: gambar maks 2MB, PDF maks 10MB), serta nama berkas di-hash/di-rename secara acak untuk mencegah eksekusi skrip berbahaya.
6. [ ] **Pencegahan Command Injection**: Dilarang mengeksekusi perintah shell dari string yang bersumber dari input pengguna.

---

## H. Standar Penambahan Dependensi (Third-Party Packages)

1. **Prinsip Minimalis**: Dependensi baru hanya boleh ditambahkan jika benar-benar esensial dan tidak dapat diimplementasikan secara efisien dengan kode internal.
2. **Persetujuan & Dokumentasi**: Setiap paket baru wajib dicatat nama, versi eksak, dan alasan teknisnya di changelog dan [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).
3. **Versi Eksak (Pinned Version)**: Dilarang menggunakan prefix range `^` atau `~` pada `package.json`. Kunci versi eksak demi stabilitas lingkungan pembangunan.
4. **Evaluasi Keamanan & Kematangan**: Periksa reputasi maintainer, lisensi open-source (MIT/Apache 2.0/BSD), riwayat CVE, dan hindari versi yang baru saja dirilis kurang dari 7 hari tanpa riwayat pengujian publik.

---

## I. Testing & Definisi Selesai (Definition of Done)

Sebuah tugas atau fase pengerjaan dianggap **SELESAI (DONE)** hanya jika:

1. `pnpm typecheck` berjalan sukses tanpa ada error tipe (`tsc --noEmit`).
2. `pnpm lint` bersih dari warning dan error ESLint.
3. `pnpm test` (Unit test) lulus 100%, khususnya pengujian terhadap utilitas perhitungan keuangan, pajak, dan validasi skema.
4. Migrasi Prisma berhasil diterapkan dari basis data kosong tanpa konflik.
5. Antarmuka UI yang dibangun telah lulus checklist review pada [`UI-UX-RULES.md`](file:///docs/UI-UX-RULES.md).
6. Dokumen aturan ([`MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md) dan [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md)) telah diperbarui sesuai status terbaru.
7. Entri changelog baru telah dibuat dan dicantumkan pada commit message.

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

ID Changelog yang mencatat perubahan ini (contoh: `[ID: 0001]`).
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
- ❌ **Dilarang**: Melakukan commit tanpa entri baru di folder `changelogs/`.
- ❌ **Dilarang**: Menambahkan komponen dan layout berpenampilan "AI-slop" (gradient ungu-pink, ilustrasi generic, emoji icon, shadow raksasa).
- ❌ **Dilarang**: Melanjutkan ke fase berikutnya sebelum mendapat persetujuan laporan akhir.

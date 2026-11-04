# Sistem Changelog — Yayasan Nurjaman Bongas Purwakarta

Sistem pencatatan riwayat perubahan arsitektur, kode, basis data, dan dokumentasi proyek. Sistem ini bersifat **append-only** (hanya tambah, dilarang mengedit atau menghapus riwayat lama) dan ditegakkan secara otomatis melalui git pre-commit hook.

---

## 1. Aturan Dasar

1. **Satu Perubahan Logis = Satu Entri Changelog**:
   Setiap fitur, perbaikan bug, refactoring, migrasi skema database, penambahan dependency, pembaruan konfigurasi, dokumen aturan, atau perbaikan keamanan WAJIB memiliki satu file entri di folder `changelogs/` sebelum perubahan dianggap selesai dan sebelum di-commit.
2. **Append-Only**:
   Dilarang keras mengubah atau menghapus file entri yang sudah di-commit sebelumnya. Jika ada kekeliruan atau koreksi, buat entri changelog baru yang merujuk pada ID entri sebelumnya.
3. **Format Penamaan File**:
   `NNNN-YYYY-MM-DD-slug.md`
   - `NNNN`: Nomor urut 4 digit (misal: `0001`, `0002`).
   - `YYYY-MM-DD`: Tanggal pembuatan (waktu lokal Indonesia `Asia/Jakarta`).
   - `slug`: Deskripsi ringkas dalam huruf kecil dan tanda hubung (kebab-case).
     Contoh: `0001-2026-11-04-setup-fondasi-proyek.md`
4. **Penyebutan dalam Commit Message**:
   Setiap commit message wajib mencantumkan ID changelog terkait:
   `chore(setup): inisialisasi fondasi proyek [ID: 0001]`

---

## 2. Cara Membuat Entri Baru

Gunakan perintah otomatis melalui pnpm:

```bash
pnpm changelog:new "judul singkat perubahan"
```

Skrip akan secara otomatis:

- Menghitung nomor urut `NNNN` berikutnya.
- Mengambil tanggal hari ini (WIB / `Asia/Jakarta`).
- Menghasilkan slug yang bersih.
- Membuat file baru dari template resmi.

---

## 3. Penegakan Otomatis (Pre-Commit Hook)

Git hook Husky (`.husky/pre-commit`) memeriksa setiap file yang berada dalam antrean commit (`git staged`).
Jika staged files menyentuh area inti:

- `src/`
- `prisma/`
- `scripts/`
- Berkas konfigurasi root (`package.json`, `tsconfig.json`, `docker-compose.yml`, dll.)

Maka commit **AKAN DITOLAK** kecuali ada file baru atau file yang diubah di folder `changelogs/`.

### Bypass Darurat

Dalam kondisi darurat kritis (misal: perbaikan hotfix cepat tanpa pengujian), pemeriksaan dapat dilewati dengan:

```bash
SKIP_CHANGELOG_CHECK=1 git commit -m "..."
```

> **PERINGATAN**: Penggunaan variabel bypass ini WAJIB dijelaskan dan dipertanggungjawabkan pada entri changelog berikutnya!

---

## 4. Template Resmi Entri Changelog

Setiap entri changelog wajib mengikuti struktur Markdown berikut:

```markdown
# [ID: NNNN] Judul Perubahan

- **Tanggal & Waktu**: YYYY-MM-DD HH:mm:ss WIB (Asia/Jakarta)
- **Tipe Perubahan**: feat | fix | refactor | docs | chore | db | deps | security | ui | config
- **Fase / Modul**: Fase X (nama-modul)
- **Penulis / Agent**: Senior Full-Stack Engineer

---

## 1. Ringkasan Perubahan

Penjelasan padat 2-4 kalimat mengenai apa yang dilakukan.

## 2. Latar Belakang & Alasan

Mengapa perubahan ini diperlukan? Masalah apa yang diselesaikan?

## 3. Rincian File yang Berubah

- **Ditambah**:
  - `path/to/file`
- **Diubah**:
  - `path/to/file`
- **Dihapus**:
  - `path/to/file`

## 4. Perubahan Basis Data (Database)

- **Nama Migrasi**: `None` | `YYYYMMDDHHMMSS_nama_migrasi`
- **Dampak Data**: Apakah ada tabel baru, pengubahan kolom, atau potensi kehilangan data?

## 5. Perubahan Dependensi (Dependencies)

- **Ditambah**: `nama-paket@versi` (Alasan: ...)
- **Diubah / Dihapus**: `nama-paket@versi` (Alasan: ...)

## 6. Dampak & Risiko

Analisis dampak terhadap modul lain, performa, atau kompatibilitas.

## 7. Prosedur Verifikasi

Langkah-langkah untuk menguji bahwa perubahan bekerja dengan benar:

1. `perintah 1`
2. `perintah 2`

## 8. Prosedur Rollback

Langkah-langkah untuk membatalkan perubahan bila terjadi kegagalan fatal:

1. `git revert ...`

## 9. Status Pengujian

- [x] Linting bersih (`pnpm lint`)
- [x] Typecheck bersih (`pnpm typecheck`)
- [x] Unit Test lulus (`pnpm test`)

## 10. Tautan Terkait & Catatan Keamanan

- Keputusan Terkait: ...
- Catatan Keamanan: ...
```

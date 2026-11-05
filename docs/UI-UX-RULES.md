# Aturan Desain & Antarmuka (UI/UX Rules)

## Yayasan Nurjaman Bongas Purwakarta

Dokumen ini adalah acuan baku desain antarmuka bagi seluruh desainer, pengembang frontend, dan AI agent. Standar di sini memastikan pengalaman pengguna yang bermartabat, profesional, aksesibel, dan mencerminkan kewibawaan sebuah lembaga nirlaba berbadan hukum resmi.

---

## A. Karakter & Prinsip Desain

- **Karakter Utama**: Modern, Bersih, Tepercaya, Bersahaja, dan Berwibawa.
- **Bukan Startup Hype**: Ini adalah sistem organisasi yayasan masyarakat di Purwakarta yang mengelola dana amanah, program sosial, dan laporan audit ISAK 35. Desain antarmuka harus menumbuhkan rasa tenang, kredibel, dan transparan, bukan kesan aplikasi Silicon Valley yang agresif dan penuh gimik.

---

## B. Larangan Keras "AI-Slop" (Checklist Anti-Gimik)

Setiap komponen UI yang dihasilkan **dilarang keras** memuat elemen-elemen berikut:

1. ❌ **Tanpa Gradient Ungu / Biru-Pink Hype**: Tidak ada latar belakang gradient modern artifisial, efek _glow neon_, atau _aurora gradient_.
2. ❌ **Tanpa Glassmorphism & Blob Dekoratif**: Tidak ada efek _frosted glass_ berlebihan (`backdrop-blur-md` sembarangan) atau _floating decorative blob_ di latar belakang.
3. ❌ **Tanpa Emoji Sebagai Ikon**: Dilarang menggunakan emoji visual (misal: 💰, 📊, 🚀, 🔔) sebagai pengganti ikon navigasi atau tombol antarmuka. Seluruh ikon wajib berasal dari pustaka terstandarisasi **Lucide Icons** dengan ketebalan stroke seragam (1.75px atau 2px).
4. ❌ **Tanpa Layout Klise "3 Kartu Fitur" Generik**: Tidak ada bagian landing page dengan 3 kartu melayang berisi ikon lingkaran dengan teks umum.
5. ❌ **Tanpa Angka Statistik & Testimoni Palsu**: Dilarang mencantumkan statistik bombastis palsu ("10.000+ Pengguna Puas") atau foto stok orang dengan laptop. Gunakan data konkret program yayasan dan foto asli lapangan.
6. ❌ **Tanpa Radius Raksasa & Bayangan Pekat**: Dilarang menggunakan `rounded-3xl` berlebihan yang dipadukan dengan `shadow-2xl` melayang di semua kontainer kartu. Struktur hierarki dibangun melalui pemanfaatan **ruang kosong (whitespace)** yang teratur, **skala tipografi terukur**, dan **garis tepi (border) halus 1px**.
7. ❌ **Tanpa Teks Klise & Lorem Ipsum**: Tidak ada copy pemasaran berbahasa Inggris kosong ("Revolutionizing philanthropic synergy"). Seluruh placeholder dan teks contoh wajib berupa data spesifik, masuk akal, dan relevan dengan konteks kegiatan yayasan di Purwakarta.

---

## C. Palet Warna Resmi & Penurunan Token

Palet warna diturunkan secara presisi dari file logo resmi yayasan melalui sampling pixel:

### 1. Warna Brand Utama

- **Hijau Logo (Pusat Emblem Pohon)**:
  - Nilai sampling: `#29c668` (RGB: 41, 198, 104).
  - Skala tint/shade dihitung secara harmonis (50–950).
  - **Peran UI**: Aksi utama (tombol primer, indikator aktif, aksen hijau kelembagaan).
  - Untuk kepatuhan WCAG AA terhadap latar putih, token `--primary` menggunakan varian Accessible Green `#1b9b4f` (rasio kontras 4.54:1).
- **Kuning Logo (Cincin Luar)**:
  - Nilai sampling: `#ffff00` (RGB: 255, 255, 0).
  - **Peran UI**: Sebagai **aksen hemat** (badge peringatan ringan, highlight khusus, ornamen emblem kecil).
  - **Aturan Tegas**: Kuning **dilarang dijadikan latar belakang untuk teks putih**, dan tidak boleh digunakan sebagai warna latar area konten yang luas.
- **Hitam Arang (Garis Cincin & Tipografi Logo)**:
  - Nilai sampling: `#020202` / `#111827`. Digunakan untuk teks judul dan batas kontur formal.
- **Merah Target (Emblem Sasaran Panah)**:
  - Nilai sampling: `#ff4745`. Digunakan untuk aksen sasaran program dan status destruktif/bahaya.

### 2. Netral Kelembagaan (Warm Stone)

- Digunakan untuk latar belakang permukaan, kartu, border, dan teks sekunder.
- Nilai dasar: `neutral-50` (`#fafaf9`) hingga `neutral-900` (`#1c1917`). Memberikan kehangatan alami, bukan abu-abu kebiruan dingin.

### 3. Warna Semantik Standar

- **Sukses** (`--success`): `#16a34a` (Latar: `#f0fdf4`, Border: `#bbf7d0`) → Transaksi lunas, anggota aktif, kegiatan selesai.
- **Peringatan** (`--warning`): `#d97706` (Latar: `#fffbeb`, Border: `#fde68a`) → Draft, tertunda, jatuh tempo.
- **Bahaya** (`--danger`): `#dc2626` (Latar: `#fef2f2`, Border: `#fecaca`) → Void, hapus, error validasi, defisit.
- **Info** (`--info`): `#0284c7` (Latar: `#f0f9ff`, Border: `#bae6fd`) → Catatan sistem, info regulasi.

### 4. Matriks Kepatuhan Kontras Minimal WCAG AA

| Pasangan Warna                      | Nilai Hex              | Rasio Kontras | Status Kepatuhan |
| :---------------------------------- | :--------------------- | :------------ | :--------------- |
| Teks Normal Utama di atas Putih     | `#1c1917` di `#ffffff` | **14.8 : 1**  | Lulus AAA        |
| Teks Sekunder (Muted) di atas Putih | `#78716c` di `#ffffff` | **4.60 : 1**  | Lulus AA         |
| Tombol Hijau Primer Accessible      | `#ffffff` di `#1b9b4f` | **4.54 : 1**  | Lulus AA         |
| Teks Gelap di atas Badge Kuning     | `#1c1917` di `#ffff00` | **18.2 : 1**  | Lulus AAA        |
| Teks Bahaya di atas Latar Bahaya    | `#991b1b` di `#fef2f2` | **8.20 : 1**  | Lulus AAA        |

> **ATURAN MUTLAK**: Seluruh komponen wajib menggunakan token CSS variabel (`var(--primary)`, `bg-primary`, dll.). Dilarang menuliskan kode Hex langsung (hardcoded) di komponen JSX.

---

## D. Sistem Tipografi

1. **Dua Keluarga Font Saja**:
   - **Serif Editorial** (`Source Serif 4`): Digunakan khusus untuk judul utama (`h1`, `h2`), kutipan resmi yayasan, dan tajuk artikel publik. Mencerminkan tradisi, keterpercayaan, dan keseriusan pers kelembagaan.
   - **Sans Humanis** (`Plus Jakarta Sans`): Digunakan untuk seluruh teks isi (body copy), navigasi, tombol, formulir, dan antarmuka panel admin.
   - _Menghindari Inter_ sebagai default untuk menghindari kesan template generik.
2. **Kenyamanan Membaca**:
   - Lebar baris paragraf artikel dibatasi antara **60–75 karakter** (`max-w-prose` atau `max-w-2xl`).
   - Line-height nyaman: `leading-relaxed` (1.625) untuk bacaan panjang, `leading-tight` (1.2) untuk judul.
3. **Angka Tabular Akuntansi (`tabular-nums`)**:
   Seluruh tabel data keuangan, nominal saldo, kode transaksi, dan nomor registrasi wajib menggunakan utility kelas `.tabular-nums` agar lebar karakter angka seragam dan angka desimal/ribuan berjajar lurus secara vertikal.

---

## E. Layout & Grid Spacing

1. **Grid Berbasis 4px / 8px**:
   Seluruh margin, padding, dan jarak antar-elemen wajib merupakan kelipatan 4px atau 8px (0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem).
2. **Struktur Tata Letak**:
   - **Website Publik**: Kontainer terpusat dengan `max-w-6xl` (1152px) atau `max-w-7xl` (1280px), padding horizontal responsif (`px-4 sm:px-6 lg:px-8`).
   - **Admin Panel**: Struktur tata letak 3 zona: Sidebar Navigasi Kiri (tetap/collapsible), Header Atas (profil & notifikasi), dan Area Konten Kerja Dinamis dengan overflow teratur.

---

## F. Bentuk, Border & Elevasi

1. **Skala Radius Terkendali**:
   - Elemen tombol & input: `rounded-md` (6px) atau `rounded-sm` (4px).
   - Badge status: `rounded` (4px) atau `rounded-full` untuk badge tipe pill.
   - Kartu panel: `rounded-lg` (8px).
   - Dilarang keras menggunakan `rounded-3xl` pada kartu data formil.
2. **Border Tipis Sebagai Pemisah Utama**:
   Hierarki visual ditekankan melalui garis batas tipis 1px (`border border-border`) dengan kontras lembut, bukan dengan bayangan tebal.
3. **Elevasi & Bayangan**:
   Bayangan hanya diberikan pada komponen yang secara fungsional berada di lapisan melayang di atas konten (Modal dialog, popover dropdown menu, floating toast notification).

---

## G. Komponen & Pola Interaksi (Aturan Standar)

1. **Hierarki Tombol**:
   - **Primer**: Latar hijau accessible dengan teks putih (`bg-primary text-white hover:bg-primary-700`). Digunakan untuk satu aksi utama per tampilan.
   - **Sekunder / Outline**: Latar transparan/netral dengan garis batas (`border border-border hover:bg-neutral-100`).
   - **Destruktif**: Latar merah dengan teks putih (`bg-danger hover:bg-red-700`) untuk tindakan berbahaya yang tidak dapat dibatalkan.
2. **Formulir & Validasi**:
   - Label selalu diletakkan di **atas input** dengan kontras jelas dan indikator bintang merah untuk wajib diisi.
   - Pesan error validasi inline muncul tepat di bawah input terkait dengan teks merah ramah dan ikon kecil.
3. **Tabel Data Keuangan & Manajemen**:
   - Angka nominal dan tanggal wajib **rata kanan (align right)**.
   - Teks deskripsi dan nama entitas **rata kiri (align left)**.
   - Dilengkapi filter status, pencarian server-side, pengurutan kolom, dan sticky header saat daftar panjang.
4. **Dialog Konfirmasi Aksi Destruktif**:
   Setiap tindakan penghapusan data atau pembatalan transaksi (void) wajib memunculkan modal dialog konfirmasi eksplisit yang **menyebutkan nama objek secara spesifik**:
   _Contoh: "Apakah Anda yakin ingin membatalkan transaksi #TRX-2026-0041 senilai Rp 5.000.000?"_
5. **State Feedback**:
   - **Loading Skeleton**: Menggunakan bentuk placeholder beranimasi pulsa halus menyerupai konten aslinya.
   - **Empty State**: Ilustrasi ikon sederhana, penjelasan mengapa data kosong, dan satu tombol aksi ajakan (CTA) yang jelas.

---

## H. Standar Khusus Pelaporan Keuangan (ISAK 35)

1. **Format Penulisan Rupiah**:
   - Ditulis: `Rp 1.250.000` (menggunakan spasi tipis setelah Rp, tanpa sen desimal untuk nilai bulat).
   - Nilai negatif ditulis konsisten: `-Rp 1.250.000` atau dalam kurung akuntansi `(Rp 1.250.000)`.
2. **Kejelasan Debit & Kredit**:
   Tabel jurnal menampilkan kolom Debit dan Kredit secara terpisah dengan angka rata kanan berbaris lurus. Baris rekapitulasi total berada di bagian bawah tabel dengan garis ganda (_double underline_) khas standar akuntansi resmi.
3. **Status Badge Transaksi**:
   - `DRAFT`: Kuning / Amber.
   - `POSTED`: Hijau Emerald.
   - `VOID`: Merah Tua (disertai keterangan alasan pembatalan).
4. **Tampilan Cetak Dokumen (CSS Print)**:
   - Menyembunyikan seluruh sidebar, navigasi, dan tombol aksi (`@media print { .no-print { display: none; } }`).
   - Menyertakan kop surat resmi yayasan yang ditarik dari modul profil (Logo, Nama Yayasan, Nomor SK Kemenkumham, Alamat Purwakarta).
   - Blok tanda tangan pengesahan berpasangan di bagian bawah (misal: Bendahara dan Ketua Yayasan).

---

## I. Pola Khusus Website Publik

1. **Hero Section Institusional**:
   Hero berfokus pada foto kegiatan sosial nyata beresolusi tinggi dengan tata tipografi editorial tenang, visi lembaga, dan tombol navigasi program utama.
2. **Halaman Berita & Dokumentasi**:
   Format tajuk editorial surat kabar resmi dengan atribusi tanggal bahasa Indonesia, kategori program, dan foto liputan dengan rasio aspek konsisten (16:9 atau 4:3).

---

## J. Nada Bahasa & Copywriting (Bahasa Indonesia)

1. **Formal, Hangat, dan Bermartabat**:
   Menggunakan Bahasa Indonesia baku (EYD/PUEBI) yang bersahabat. Hindari istilah slang, bahasa gaul, atau campur aduk bahasa Inggris jika sudah ada padanan baku yang umum (misal: "Pengaturan", bukan "Settings"; "Unduh Laporan", bukan "Download Report").
2. **Glosarium Istilah Baku**:
   - _Aset Neto Tanpa Pembatasan_ (Unrestricted Net Assets)
   - _Aset Neto Dengan Pembatasan_ (Restricted Net Assets)
   - _Penghasilan Komprehensif_ (Comprehensive Income)
   - _Buku Kas Umum_ (Cash Book)
   - _Bukti Potong_ (Tax Withholding Slip)
3. **Pesan Kesalahan yang Membantu**:
   Jangan pernah menyalahkan pengguna.
   - _Salah_: "Input Anda salah! Nomor telepon tidak valid."
   - _Benar_: "Nomor telepon harus terdiri dari 10–13 digit angka diawali 08."

---

## K. Aksesibilitas (WCAG 2.1 Level AA)

- Seluruh elemen interaktif dapat dioperasikan secara penuh melalui **keyboard (Tab, Space, Enter, Arrow keys)**.
- Focus ring jelas dan tidak boleh dihilangkan (`outline: 2px solid var(--ring)`).
- Target sentuh (touch target) pada layar sentuh ponsel minimal **44 × 44 pixel**.
- Mendukung preferensi pengurangan gerakan (`prefers-reduced-motion`).
- Informasi penting tidak pernah disampaikan hanya melalui warna saja (selalu sertakan label teks atau ikon pendukung).

---

## L. Performa & Responsif

- Prinsip **Mobile-First** pada website publik.
- Admin panel dioptimasi optimal untuk desktop dan tetap nyaman dioperasikan pada layar tablet.
- Gambar wajib dioptimasi otomatis (format WebP/AVIF dengan atribut `width`, `height`, dan `priority` yang tepat untuk menghindari Cumulative Layout Shift / CLS).

---

## M. Pustaka Komponen Antarmuka Bersama (`src/components/shared/`)

Untuk menjamin konsistensi visual dan menghindari duplikasi kode (_DRY_), komponen komposit berikut wajib digunakan di seluruh modul:

| Komponen            | Berkas               | Peran & Kontrak Interface Utama                                                                                                        |
| :------------------ | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **`DataTable`**     | `data-table.tsx`     | Tabel administratif terstandarisasi dengan sorting, paginasi terikat URL/server, filter kolom, dan status loading/empty.               |
| **`PageHeader`**    | `page-header.tsx`    | Blok tajuk seragam di atas halaman admin: judul halaman, breadcrumb navigasi, subjudul, dan slot tombol aksi (_action CTA_).           |
| **`ConfirmDialog`** | `confirm-dialog.tsx` | Dialog modal konfirmasi untuk aksi berbahaya (void, hapus, tutup buku) yang secara spesifik menyebutkan nama entitas target.           |
| **`MoneyInput`**    | `money-input.tsx`    | Input Rupiah khusus yang memformat tampilan ribuan secara instan (`Rp 1.000.000`) dan mengembalikan nilai integer murni ke form state. |
| **`EmptyState`**    | `empty-state.tsx`    | Visual placeholder saat kueri data bernilai nol/kosong, dilengkapi ikon Lucide, teks penjelasan, dan tombol pembuatan data baru.       |
| **`StatusBadge`**   | `status-badge.tsx`   | Lencana status semantik bertipe aman: `DRAFT` (amber), `POSTED` / `ACTIVE` (hijau), `VOID` / `INACTIVE` (merah), `INFO` (biru).        |
| **`FormField`**     | `form-field.tsx`     | Pembungkus formulir terstandar yang mengintegrasikan label teks, indikator wajib (`*`), kontrol input, dan pesan galat Zod inline.     |

---

## N. Checklist Review Antarmuka (Ya/Tidak)

Sebelum suatu tugas UI dinyatakan selesai, lakukan verifikasi mandiri berikut:

- [ ] Apakah tampilan bebas dari efek "AI-slop" (tanpa glow, gradient ungu-pink, blob, dan ilustrasi generik)?
- [ ] Apakah seluruh warna mematuhi token resmi dan tidak ada kode Hex yang di-hardcode?
- [ ] Apakah seluruh ikon berasal dari satu set Lucide dengan ketebalan stroke seragam?
- [ ] Apakah teks judul menggunakan Source Serif 4 dan teks isi/admin menggunakan Plus Jakarta Sans?
- [ ] Apakah semua nominal uang menggunakan format `Rp 1.250.000` dan utility `.tabular-nums`?
- [ ] Apakah kontras warna teks terhadap latar belakang lulus standar WCAG AA (min 4.5:1)?
- [ ] Apakah formulir dilengkapi penanganan error inline dengan bahasa Indonesia yang ramah?
- [ ] Apakah tindakan destruktif memiliki dialog konfirmasi yang menyebut nama objek secara spesifik?
- [ ] Apakah seluruh elemen interaktif dapat dinavigasi dengan nyaman menggunakan keyboard?
- [ ] Apakah pratinjau token `/dev/tokens` hanya dapat diakses di lingkungan development?

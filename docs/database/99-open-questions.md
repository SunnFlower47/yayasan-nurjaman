# Pertanyaan Terbuka & Catatan Kebijakan Basis Data

Dokumen ini mencatat pertanyaan terbuka, asumsi yang perlu diverifikasi dengan pihak berwenang (akuntan / konsultan pajak yayasan), serta kebijakan perlindungan data yang mengikat implementasi.

---

## 1. Kebijakan Data Anggota & Perlindungan Privasi (UU PDP No. 27/2022)

### 1.1 Sifat Kolom NIK (Nomor Induk Kependudukan)

- **Status Ketetapan**: NIK bersifat **opsional (nullable)** di tingkat skema basis data (`members.nik_encrypted NULL`).
- **Rasional**: Sebagai entitas nirlaba berbasis keagamaan dan sosial kemasyarakatan, yayasan melayani berbagai kalangan masyarakat. Tidak semua anggota memiliki kelengkapan adminduk atau bersedia menyerahkan NIK saat pendaftaran awal.
- **Standar Enkripsi**:
  - Kolom `nik_encrypted` wajib dienkripsi di level aplikasi menggunakan AES-256-GCM sebelum disimpan.
  - Kolom `nik_hash` menggunakan HMAC-SHA256 (blind index terisolasi) untuk pencarian cepat dan pencegahan duplikasi NIK unik tanpa mengekspos plaintext.
- **Prinsip Visibilitas Anggota (Default Private)**:
  - Seluruh data anggota secara bawaan berstatus non-publik (`show_public = false`).
  - Hanya anggota pengurus/dewan yang telah memberikan persetujuan tertulis yang datanya dapat dipublikasikan di halaman profil publik yayasan.

---

## 2. Asumsi Akuntansi & Keuangan (Perlu Verifikasi Akuntan Yayasan)

### 2.1 Prosedur Jurnal Penutup Akhir Tahun Buku (Closing Entries)

- **Pertanyaan**: Apakah penutupan buku tahunan dilakukan otomatis oleh sistem (menghasilkan jurnal sistem yang menutup seluruh akun pendapatan dan beban ke Aset Neto Tanpa Pembatasan / Dengan Pembatasan), atau dilakukan secara manual oleh staf keuangan dengan review bendahara?
- **Dampak Basis Data**: Status tabel `closing_entries` saat ini berada di "Usulan Tambahan". Jika manual, transaksi jurnal standar bertipe `CLOSING` sudah mencukupi tanpa tabel khusus.
- **Status**: Menunggu konfirmasi akuntan/bendahara.

### 2.2 Pemetaan Fungsi Beban & Arus Kas ISAK 35

- **Pertanyaan**: Standar ISAK 35 mewajibkan penyajian beban menurut fungsi (Program, Administrasi & Umum, serta Pengembangan Sumber Daya / Penggalangan Dana). Apakah pemetaan fungsi beban diikat langsung pada atribut akun (`accounts.is_active` dsb.) atau ditentukan per baris transaksi (`journal_entry_lines.project_id` / tracking category)?
- **Status**: Menunggu konfirmasi bagan akun resmi dari pengurus keuangan yayasan.

### 2.3 Standar Penilaian Donasi Barang / Jasa (In-Kind Donations)

- **Pertanyaan**: Ketika yayasan menerima donasi natura (sembako, material bangunan, tanah wakaf) atau jasa tenaga ahli:
  - Apa dasar nilai wajar yang diakui dalam jurnal debit aset/beban dan kredit pendapatan donasi?
  - Apakah diperlukan lampiran berita acara serah terima (BAST) dan taksiran harga pasar independen?
- **Status**: Menunggu SOP pengurus yayasan.

---

## 3. Asumsi Perpajakan (Perlu Verifikasi Konsultan Pajak)

### 3.1 Aturan Pembulatan Nilai Pemotongan Pajak

- **Pertanyaan**: Dalam penghitungan PPh Pasal 21, Pasal 23, dan PPh Final:
  - Apakah menggunakan pembulatan ke bawah (floor / truncation ke ribuan penuh sesuai ketentuan umum Ditjen Pajak) atau pembulatan matematis biasa (`round-half-up`)?
  - Dilarang keras menaruh logika pembulatan hardcoded di kode aplikasi; aturan pembulatan harus tersimpan pada parameter `tax_rates.rounding_rule`.
- **Status**: Menunggu rekomendasi tertulis dari konsultan pajak.

### 3.2 Pemenuhan Syarat Surplus Nirlaba Bebas PPh (Pasal 4 Ayat 3 UU PPh)

- **Pertanyaan**: Sisa lebih (surplus) yayasan yang ditanamkan kembali dalam bentuk sarana dan prasarana dalam jangka waktu paling lama 4 (empat) tahun dikecualikan dari objek PPh.
  - Apakah sistem perlu menyediakan penandaan akumulasi realisasi investasi sarana-prasarana per tahun anggaran untuk laporan audit pajak?
- **Status**: Perlu arahan teknis konsultan pajak.

---

## 4. Keputusan Arsitektur Pending

### 4.1 Pelacakan Salinan Backup Offsite (ADR-012)

- **Status**: Menunggu persetujuan tertulis pemilik yayasan:
  - Opsi A (Rekomendasi): Menambahkan kolom pelacakan offsite (`offsite_status`, `offsite_storage_key`, `offsite_copied_at`) pada tabel `backup_jobs`.
  - Opsi B: Membuat tabel terpisah `backup_copies` jika di masa depan yayasan menerapkan strategi multi-tujuan offsite (misal: S3 Wasabi + Google Cloud Storage sekaligus).

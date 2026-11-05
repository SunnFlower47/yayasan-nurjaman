# 4a. ADR: Fondasi, Keamanan, Migrasi & Konvensi Entitas

Dokumen ini memuat Architectural Decision Records (ADR) nomor 001 s.d. 010 untuk sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen induk: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).

---

### ADR-001: Arsitektur Aplikasi & Pola Struktur Kode

- **Konteks**: Memilih arsitektur aplikasi web resmi dan sistem manajemen internal yayasan.
- **Opsi**: (1) Microservices terdistribusi, (2) Monolit tradisional tanpa batas modul, (3) Next.js App Router + Modular Monolith.
- **Trade-off**: Microservices menimbulkan overhead operasional jaringan dan deployment yang berlebihan untuk satu yayasan. Monolit tanpa batas mudah berantakan (_spaghetti code_). Modular monolith memberikan kecepatan iterasi monolit dengan batas isolasi domain yang ketat di `src/modules/`.
- **Rekomendasi Tegas**: Menggunakan **Next.js App Router + Modular Monolith**.
- **Status**: **DIPUTUSKAN**.

---

### ADR-002: Manajemen Skema Basis Data & Migrasi

- **Konteks**: Memilih alur kerja evolusi skema basis data PostgreSQL.
- **Opsi**: (1) `prisma db push` (sinkronisasi langsung tanpa histori), (2) `prisma migrate` terstruktur, (3) Migrasi SQL manual mentah.
- **Trade-off**: `db push` berisiko tinggi merusak data produksi dan tidak meninggalkan jejak historis. SQL mentah kehilangan integrasi type-safety Prisma Client.
- **Rekomendasi Tegas**: Menggunakan **Prisma Migration Only (`prisma migrate dev/deploy`)**. Dilarang menggunakan `prisma db push` pada lingkungan pengembangan maupun produksi.
- **Status**: **DIPUTUSKAN**.

---

### ADR-003: Prioritas Urutan Roadmap Pengembangan

- **Konteks**: Menentukan fokus pengerjaan awal antara website profil publik atau panel administrasi internal.
- **Opsi**: (1) Situs publik terlebih dahulu, (2) Admin panel terlebih dahulu, (3) Paralel keduanya.
- **Trade-off**: Membangun situs publik terlebih dahulu menghasilkan tampilan statis tanpa data nyata. Membangun admin panel terlebih dahulu menjamin bahwa saat situs publik dibangun (Fase 9), seluruh data profil, pengurus, program, dan transparansi telah terkelola dan terverifikasi secara kredibel oleh pengurus.
- **Rekomendasi Tegas**: **Admin Panel Terlebih Dahulu (Fase 1 s.d. 8), Situs Publik Terakhir (Fase 9)**.
- **Status**: **DIPUTUSKAN**.

---

### ADR-004: Model Otorisasi Aman (Server-Side vs Middleware)

- **Konteks**: Mencegah potensi bypass otorisasi rute pada Next.js App Router.
- **Opsi**: (1) Otorisasi hanya di Next.js Middleware, (2) Otorisasi di komponen UI, (3) Otorisasi ganda: UX redirect di middleware dan otorisasi otoritatif di server action/service (`requirePermission`).
- **Trade-off**: Middleware rentan terhadap konfigurasi matcher yang terlewat (CVE Next.js). Komponen UI dapat dimanipulasi di sisi klien. Otorisasi server-side memberikan jaminan keamanan mutlak (_defense in depth_).
- **Rekomendasi Tegas**: **Pengecekan Otorisasi Otoritatif Wajib di Server Layer (`requirePermission`)**. Middleware hanya untuk _optimistic UX redirect_.
- **Status**: **DIPUTUSKAN**.

---

### ADR-005: Presisi Data Finansial & Invarian Keseimbangan Jurnal

- **Konteks**: Pemilihan representasi angka uang dan aturan integritas pembukuan ISAK 35. (Catatan: Mengoreksi ambiguitas teks awal "BigInt / Decimal").
- **Opsi**: (1) Tipe Float/Double, (2) Tipe Decimal/Numeric, (3) Tipe `BIGINT` integer rupiah.
- **Trade-off**: Float menimbulkan galat pembulatan biner IEEE-754. Decimal membutuhkan penanganan serialisasi string di JavaScript. Nilai mata uang Rupiah Indonesia (IDR) beroperasi pada satuan penuh (tanpa sen). `BIGINT` (64-bit signed integer) di PostgreSQL dan `BigInt` di JavaScript menjamin kalkulasi eksak, cepat, dan anti-galat.
- **Rekomendasi Tegas**: **BIGINT (Integer Rupiah) untuk Seluruh Nilai Uang**. Transaksi `POSTED` wajib seimbang: $\sum \text{Debit} == \sum \text{Kredit}$. (Dipertegas lebih lanjut di ADR-015).
- **Status**: **DIPUTUSKAN**.

---

### ADR-006: Konfigurasi Tarif Pajak Berversi Tanggal Efektif

- **Konteks**: Perhitungan pemotongan pajak (PPh 21, 23, Final) yang tarif dan ketentuannya dapat berubah sewaktu-waktu oleh regulasi pemerintah.
- **Opsi**: (1) Hardcode konstanta persentase di kode aplikasi, (2) Nilai tunggal di tabel database yang ditimpa saat ada aturan baru, (3) Master data tarif berversi rentang tanggal berlaku (`valid_range`).
- **Trade-off**: Opsi 1 dan 2 merusak kalkulasi historis saat mencetak ulang bukti potong masa lalu. Opsi 3 menjaga rekonsiliasi audit trail lampau tetap akurat.
- **Rekomendasi Tegas**: **Tarif Pajak Dilarang Di-Hardcode; Wajib Menggunakan Master Data Berversi Tanggal Efektif**.
- **Status**: **DIPUTUSKAN**.

---

### ADR-007: Header Keamanan HTTP & Content Security Policy (CSP)

- **Konteks**: Melindungi pengguna admin dan pengunjung publik dari serangan XSS, clickjacking, dan pencurian sesi.
- **Opsi**: (1) Header bawaan Next.js standar, (2) Nonce-based CSP dinamis dengan strict HTTP response headers.
- **Trade-off**: CSP statis `unsafe-inline` rentan XSS. Nonce-based CSP membutuhkan injeksi nonce per request pada SSR namun memberikan proteksi tingkat tertinggi.
- **Rekomendasi Tegas**: Menerapkan **Nonce-based CSP, HSTS 2 Tahun (`max-age=63072000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan `X-Robots-Tag: noindex, nofollow` pada rute admin/API**.
- **Status**: **DIPUTUSKAN**.

---

### ADR-008: Ekosistem Docker-First & Portabilitas Lintas Mesin

- **Konteks**: Kemudahan pengoperasian dan pemindahan sistem antara VPS Linux produksi dan laptop pengembang.
- **Opsi**: (1) Instalasi bare-metal manual di VPS, (2) Layanan PaaS terkelola cloud, (3) Orkestrasi Docker Compose v2 multi-service.
- **Trade-off**: Bare-metal rawan drift konfigurasi dan sulit dipulihkan. PaaS mengikat (_vendor lock-in_) dengan biaya bulanan membengkak. Docker Compose v2 memberikan portabilitas penuh laptop $\leftrightarrow$ VPS dengan isolasi bridge network `yayasan_internal` tanpa ekspos port DB/app ke host publik guna mencegah celah bypass UFW firewall di Linux.
- **Rekomendasi Tegas**: Menggunakan **Docker Compose v2 Multi-Service & Multi-Arch (`app`, `postgres`, `reverse-proxy`, `migrate`, `backup-worker`)**.
- **Status**: **DIPUTUSKAN**.

---

### ADR-009: Kriptografi Multi-Kunci & Pola Migrasi Expand-Contract

- **Konteks**: Manajemen kunci enkripsi data sensitif (NIK) dan kontinuitas layanan saat migrasi skema database.
- **Opsi**: (1) Kunci tunggal statis & zero-downtime mutlak, (2) Key ring multi-kunci ber-ID + blind index HMAC terpisah, henti singkat terukur saat deploy, dan pola migrasi expand-contract.
- **Trade-off**: Kunci tunggal tanpa ID menyulitkan rotasi kunci historis. Klaim zero-downtime tidak realistis pada arsitektur single-host Next.js restart. Pola expand-contract menjamin skema selalu non-breaking bagi aplikasi yang sedang berjalan.
- **Rekomendasi Tegas**: Menggunakan **Key Ring Multi-Kunci (`ENCRYPTION_KEY_ACTIVE_ID`, `ENCRYPTION_KEYS`), Blind Index HMAC Terpisah (`BLIND_INDEX_SECRET`), serta Pola Migrasi Expand-Contract**. Seluruh kunci wajib dipindahkan saat migrasi mesin.
- **Status**: **DIPUTUSKAN**.

---

### ADR-010: Resolusi Tabrakan Nama Entitas & Pemetaan Tabel Auth Domain

- **Konteks**: Tabrakan penamaan antara akun keuangan (Chart of Accounts) dengan akun pengguna (Better Auth/NextAuth account).
- **Opsi**: (1) Membiarkan nama `accounts` ambigu, (2) Menamai akun keuangan `chart_of_accounts` dan kas/bank `cash_bank_accounts`, serta merancang tabel autentikasi domain secara eksplisit.
- **Trade-off**: Nama generik `accounts` menimbulkan kebingungan fatal antara domain akuntansi dan autentikasi. Pembakuan nama spesifik mengeliminasi ambiguitas semantik.
- **Rekomendasi Tegas**: Membakukan nama bagan akun menjadi **`chart_of_accounts`**, rekening kas/bank menjadi **`cash_bank_accounts`**, dan merancang tabel identitas domain secara terisolasi.
- **Status**: **DIPUTUSKAN**.

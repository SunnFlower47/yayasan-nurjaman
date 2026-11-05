# SECURITY.md — Kebijakan & Arsitektur Keamanan Siber

> **Status Dokumen**: Wajib Dipatuhi (Normatif & Mengikat)  
> **Klasifikasi Keamanan**: Institusional Terbuka (Panduan Desain Aman)  
> **Sasaran**: Arsitektur, Pengembang, DevOps, dan Auditor Sistem Yayasan Nurjaman Bongas Purwakarta.

Dokumen ini memuat standar keamanan siber institusional, pemodelan ancaman (_threat modeling_), perlindungan data sensitif, mitigasi kerentanan berdasarkan kerangka kerja OWASP ASVS Level 2, serta protokol audit sistem.

---

## 1. Pemodelan Ancaman (_Threat Modeling_)

Sistem Yayasan Nurjaman mengelola aset publik dan catatan keuangan nirlaba yang memiliki implikasi hukum dan akuntabilitas sosial.

### 1.1 Aset Kritis yang Dilindungi

1. **Catatan Keuangan & Akuntansi (ISAK 35)**: Jurnal umum, saldo kas/bank, laporan realisasi dana terikat dan tidak terikat. Manipulasi data keuangan dapat memicu pelanggaran hukum yayasan.
2. **Data Pribadi (PII)**: Nomor Induk Kependudukan (NIK), alamat, nomor telepon, dan data keluarga anggota yayasan. Wajib mematuhi UU Pelindungan Data Pribadi (UU PDP).
3. **Data Perpajakan**: Konfigurasi tarif pajak, riwayat pemotongan PPh 21/23, dan arsip bukti potong.
4. **Kredensial & Kunci Sesi**: Kata sandi pengurus, kunci TOTP 2FA, token otentikasi, dan secret key lingkungan.
5. **Jejak Audit (_Audit Trail_)**: Log aktivitas sistem sebagai bukti integritas yang tidak boleh dapat diubah (_tamper-proof_).

### 1.2 Profil Pelaku Ancaman (_Threat Actors_)

- **Penyerang Luar Tidak Dikenal**: Mencoba eksploitasi celah otomatis, _credential stuffing_, serangan injeksi, atau _denial of service_ (DoS).
- **Pengguna Internal / Akun Terkompromi**: Akun pengurus/staf yang kata sandinya bocor atau disalahgunakan untuk manipulasi data atau penipuan finansial (_fraud_).
- **Serangan Rantai Pasok (_Supply Chain_)**: Paket pihak ketiga yang disusupi kode berbahaya (_dependency malware/prototype pollution_).

### 1.3 Matriks Penyelarasan OWASP Top 10 (2021) & ASVS L2

| Kategori OWASP                     | Risiko Utama pada Sistem                                        | Kontrol & Mitigasi Wajib                                                                               |
| :--------------------------------- | :-------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **A01: Broken Access Control**     | Manipulasi ID data (IDOR), pembajakan hak akses admin           | Pemeriksaan otorisasi server-side (`requirePermission`), pembatasan scope tenant/entitas di repository |
| **A02: Cryptographic Failures**    | Kebocoran data NIK atau password tersimpan teks polos           | Argon2id untuk hashing sandi, AES-256-GCM untuk data NIK, TLS 1.3 dan HSTS ketat                       |
| **A03: Injection**                 | SQL Injection, XSS pada berita/laporan, Shell Injection         | 100% kueri Prisma terparameter, Zod validation, sanitasi HTML ketat (DOMPurify), larangan shell exec   |
| **A04: Insecure Design**           | Pengurus memanipulasi kas tanpa persetujuan pihak kedua         | Pemisahan tugas (_Maker-Checker_), integritas jurnal seimbang debit=kredit                             |
| **A05: Security Misconfiguration** | Port DB terbuka publik, CORS permisif, header keamanan nihil    | Binding DB ke 127.0.0.1, Docker non-root, CSP ketat, HSTS, X-Frame-Options: DENY                       |
| **A06: Outdated Components**       | CVE pada framework atau dependensi npm                          | Audit `pnpm audit`, Dependabot berpendingin 14 hari, pembaruan versi pinned berkala                    |
| **A07: Identification Failures**   | Serangan brute force pada login admin                           | Rate limiting ketat, progressive lockout, 2FA TOTP wajib untuk pejabat kunci                           |
| **A08: Integrity Failures**        | Perubahan diam-diam pada riwayat transaksi posted               | Immutabilitas transaksi `posted` (hanya boleh void), jejak audit append-only                           |
| **A09: Logging Failures**          | Aksi berbahaya tidak terdeteksi                                 | Logging terstruktur dengan requestId, IP address, rekaman sebelum dan sesudah perubahan                |
| **A10: SSRF**                      | Eksploitasi webhook atau parser URL untuk memindai server lokal | Whitelist domain webhook eksternal, blokir seluruh rentang IP privat (RFC 1918) & metadata             |

---

## 2. Autentikasi & Manajemen Kredensial

### 2.1 Hashing & Kebijakan Kata Sandi

- **Algoritma**: Wajib menggunakan **Argon2id** (memory: 64MB / 65536 KB, iterations: 3, parallelism: 4) atau **bcrypt** dengan cost factor minimal 12.
- **Kekuatan Sandi**:
  - Panjang minimal: **12 karakter**.
  - Wajib kombinasi huruf besar, huruf kecil, angka, dan simbol khusus.
  - Pengecekan daftar hitam kata sandi umum (_common passwords blocklist_).

### 2.2 Perlindungan Terhadap Serangan _Brute Force_ & Rate Limiting

- **Ambang Batas**: Maksimal **5 kali kegagalan login** per alamat IP dan per akun email dalam rentang waktu **15 menit**.
- **Progressive Delay**: Penambahan penundaan respons (_exponential backoff_) setelah 3 kegagalan beruntun.
- **Lockout Akun**: Akun dibekukan sementara selama 30 menit jika gagal 5 kali berturut-turut, disertai pengiriman notifikasi email keamanan ke pemilik akun.

### 2.3 Pengelolaan Sesi (_Session Management_)

- **Cookie Sesi Aman**:
  - Wajib berflag `HttpOnly` (tidak dapat diakses oleh JavaScript browser).
  - Wajib berflag `Secure` (hanya dikirimkan melalui koneksi terenkripsi HTTPS).
  - Atribut `SameSite=Lax` (atau `Strict` untuk panel admin sensitif).
  - Wajib menggunakan prefiks `__Host-` di lingkungan produksi (`__Host-session-token`).
- **Masa Berlaku Sesi**:
  - _Idle Timeout_: Sesi otomatis berakhir setelah **30 menit tidak aktif**.
  - _Absolute Timeout_: Sesi kedaluwarsa mutlak setelah **8 jam**, mewajibkan login ulang.
- **Revokasi Sesi**:
  - Tombol logout langsung menghapus sesi dari database dan browser.
  - Perubahan kata sandi atau pencabutan izin secara otomatis mencabut (_revoke_) seluruh sesi aktif pengguna di perangkat lain.

### 2.4 Otentikasi Dua Faktor (2FA - TOTP)

- **Kewajiban Peran**: Wajib aktif untuk peran **Super Admin**, **Ketua Yayasan**, dan **Bendahara**.
- **Standar**: Berbasis waktu RFC 6238 (Google Authenticator, Microsoft Authenticator) dengan kunci rahasia minimal 160-bit.
- **Kode Cadangan (_Recovery Codes_)**: 8 kode cadangan sekali pakai yang di-hash di database dan hanya ditampilkan sekali saat pendaftaran 2FA.

### 2.5 Otentikasi Ulang (_Step-Up Re-Authentication_)

Pengguna wajib memasukkan kembali kata sandi atau kode TOTP jika melakukan tindakan berisiko tinggi berikut:

1. Membatalkan (_void_) transaksi keuangan yang sudah tercatat.
2. Mengubah nomor rekening bank lembaga atau data penerima dana.
3. Mengubah peran atau hak akses (_role & permission_) pengguna lain.
4. Melakukan ekspor massal data anggota atau laporan keuangan.

---

## 3. Otorisasi & Kontrol Akses (RBAC)

### 3.1 Prinsip _Deny-by-Default_

Seluruh Server Action dan API Route ditutup secara default. Akses hanya diberikan jika otorisasi dideklarasikan secara eksplisit.

### 3.2 Otorisasi Server-Side Mutlak & Pertahanan Middleware Bypass

> [!WARNING] **Peringatan Keamanan Next.js Middleware**
> Berdasarkan CVE-2024-34351 dan karakteristik Next.js App Router, middleware Next.js berjalan di Edge Runtime yang mengandalkan pencocokan rute (_URL pattern matching_). Middleware dapat terlewati (_bypass_) jika penyerang memanipulasi rute internal atau header RSC (`RSC: 1`).
> **ATURAN MUTLAK**: Next.js Middleware HANYA digunakan untuk kenyamanan pengalaman pengguna (pengalihan otomatis/redirect). Seluruh verifikasi izin otoritatif WAJIB dilakukan di sisi server pada setiap Server Action atau Route Handler:

```typescript
// CONTOH KODE RESMI OTORISASI SERVER ACTION
export async function voidJournalEntryAction(input: VoidJournalInput) {
  // 1. Verifikasi Autentikasi
  const session = await requireUser();

  // 2. Verifikasi Izin Spesifik di Server
  await requirePermission(session.userId, "finance:journal:void");

  // 3. Validasi Masukan
  const validated = VoidJournalSchema.parse(input);

  // 4. Eksekusi Layanan
  return await journalService.voidTransaction(validated, session.userId);
}
```

### 3.3 Pencegahan IDOR (_Insecure Direct Object Reference_)

Pencarian dan pembaruan data pada layer repository wajib selalu menyertakan batasan kepemilikan atau lingkup organisasi:

- Dilarang: `prisma.member.findUnique({ where: { id: memberId } })` tanpa validasi kepemilikan.
- Wajib: Kueri yang memvalidasi bahwa entitas yang diminta berada dalam ruang lingkup yang berhak diakses oleh pengguna.

### 3.4 Pemisahan Kewenangan (_Segregation of Duties / Maker-Checker_)

Untuk mencegah _fraud_ finansial:

- Staf / Petugas Lapangan berstatus sebagai **Maker** (hanya dapat menginput draf permohonan dana).
- Bendahara dan Ketua Yayasan bertindak sebagai **Checker & Approver** (menyetujui atau menolak).
- Pengguna yang membuat draf transaksi dilarang keras menyetujui transaksi tersebut sendiri (_anti-self-approval_).

---

## 4. Pencegahan Injeksi & Penanganan Masukan

1. **Validasi Masukan Server-Side**:
   - Seluruh data yang masuk ke server wajib divalidasi dengan skema Zod dengan opsi _strict stripping_ (membuang properti asing yang tidak terdaftar).
2. **Pencegahan SQL Injection**:
   - Seluruh interaksi basis data wajib melalui Prisma ORM dengan _parameterized queries_.
   - Dilarang keras melakukan konkatenasi string SQL pada `prisma.$queryRawUnsafe`.
3. **Pencegahan Cross-Site Scripting (XSS)**:
   - Teks biasa otomatis di-escape oleh React engine.
   - Konten HTML kaya dari editor Tiptap (berita, artikel publik) wajib disaring di sisi server menggunakan pustaka pembersih HTML dengan daftar putih ketat (_allowlist_ tag aman: `p`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `h2`, `h3`; larangan atribut `onerror`, `onload`, tag `script`, `iframe`, `object`).
4. **Pencegahan Shell Injection**:
   - Dilarang memanggil `child_process.exec` atau `eval` menggunakan masukan dari pengguna.
5. **Mitigasi SSRF (_Server-Side Request Forgery_)**:
   - Panggilan HTTP keluar (misalnya webhook atau notifikasi) hanya boleh diarahkan ke domain yang telah terdaftar dalam daftar putih (_whitelist_).
   - Seluruh IP privat dilarang keras diakses oleh server aplikasi:
     - `127.0.0.0/8` (Loopback)
     - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private Intranet)
     - `169.254.169.254` (Cloud Instance Metadata Service)

---

## 5. Header Keamanan & Kontrol Akses Jaringan

Sistem menyematkan header keamanan HTTP secara seragam melalui `src/middleware.ts`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
X-Permitted-Cross-Domain-Policies: none
X-DNS-Prefetch-Control: off
```

### Larangan Pengindeksan Panel Admin & API

Untuk mencegah paparan rute internal pada mesin pencari (_search engines_):

- Header respons HTTP untuk seluruh rute `/admin/*` dan `/api/*` menyematkan:
  `X-Robots-Tag: noindex, nofollow, noarchive`
- Berkas `robots.txt` melarang secara eksplisit pengindeksan direktori `/admin/` dan `/api/`.

---

## 6. Keamanan Pengunggahan Berkas (_File Upload Security_)

Pengunggahan berkas (bukti kas, kuitansi, foto program, foto identitas anggota) wajib mematuhi standar berikut:

1. **Validasi Tiga Lapis**:
   - Pemeriksaan ekstensi nama berkas (hanya `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`).
   - Pemeriksaan header MIME type dari klien.
   - **Verifikasi Magic Bytes (Tanda Tangan Biner)** di sisi server menggunakan _file signature buffer_ untuk memastikan berkas bukan kode eksekusi yang disamarkan.
2. **Pembersihan Nama Berkas**:
   - Nama berkas asli dibuang untuk mencegah serangan _path traversal_ atau eksekusi skrip.
   - Nama berkas baru dihasilkan menggunakan `crypto.randomUUID()`.
3. **Penyimpanan Terisolasi**:
   - Berkas diunggah di luar _web root_ atau disimpan dalam storage privat terisolasi.
   - Berkas dokumen sensitif (kuitansi keuangan, identitas) hanya dapat diakses melalui URL bertanda tangan (_presigned URL_) berbatas waktu kedaluwarsa maksimal 15 menit.
4. **Batas Ukuran**:
   - Foto profil & logo: maksimal 2 MB.
   - Dokumen lampiran keuangan & laporan: maksimal 10 MB.

---

## 7. Perlindungan Data Sensitif & Jejak Audit (_Audit Trail_)

### 7.1 Enkripsi Data Pribadi saat Istirahat (_Encryption at Rest_)

- Kolom basis data yang memuat identitas kependudukan (NIK anggota) wajib dienkripsi di level aplikasi sebelum disimpan ke PostgreSQL menggunakan algoritma **AES-256-GCM**.
- Kunci enkripsi aplikasi disimpan dalam variabel lingkungan `ENCRYPTION_SECRET` (32 bytes) dan tidak boleh tersimpan di dalam repositori kode.

### 7.2 Penyamaran Data Antarmuka (_Data Masking_)

- Pada tabel data dan tampilan administratif umum, data NIK ditampilkan tersamar: `3201************`.
- Data nomor rekening bank ditampilkan sebagian: `****5678`.
- Pembukaan data asli (_unmasking_) memerlukan hak akses khusus dan dicatat dalam audit log.

### 7.3 Jejak Audit Nirubah (_Immutable Audit Trail_)

- Setiap transaksi mutasi finansial, perubahan hak akses, login pejabat, dan perubahan konfigurasi wajib tercatat di tabel `audit_logs`.
- Struktur catatan audit:
  - `actorId`: ID pengguna pelaku tindakan.
  - `action`: Jenis tindakan (`CREATE`, `UPDATE`, `VOID`, `LOGIN`, `EXPORT`).
  - `resource`: Entitas sasaran (`JOURNAL_ENTRY`, `USER_ROLE`, `TAX_CONFIG`).
  - `resourceId`: Kunci primer entitas yang diubah.
  - `diff`: Objek JSON yang memuat nilai sebelum (_before_) dan sesudah (_after_).
  - `ipAddress`: Alamat IP klien (diminimalkan jika diperlukan regulasi).
  - `userAgent`: Pengenal browser/perangkat.
  - `timestamp`: Waktu pencatatan berbasis UTC.
- **Integritas Log**: Tabel `audit_logs` bersifat _append-only_. Dilarang menyediakan API atau fungsionalitas untuk mengedit atau menghapus rekaman log audit.

---

## 8. Manajemen Kunci Rahasia & Keamanan Rantai Pasok

1. **Nol Kunci Rahasia di Repositori**:
   - File `.env`, `.env.local`, file sertifikat `.pem`, dan kunci privat dilarang keras di-commit ke Git.
   - Skrip pemindaian otomatis `pnpm secrets:scan` terintegrasi dalam git hook `pre-commit` untuk menolak commit yang memuat pola kredensial atau _private key_.
2. **Pemasangan Dependensi Aman**:
   - Lingkungan CI/CD dan kontainer Docker wajib memasang dependensi dengan bendera `--frozen-lockfile` untuk menjamin integritas paket yang sama persis dengan `pnpm-lock.yaml`.
3. **Penyusutan Dependensi & Jeda Rilis (_Release Cooldown_)**:
   - Dilarang memasang pustaka baru yang belum memiliki reputasi mapan atau berumur rilis kurang dari **14 hari** untuk menghindari serangan _malicious package injection_.
   - Seluruh dependensi wajib dipin pada versi eksak (tanpa tanda kurva `^` atau tilde `~`).

---

## 9. Gerbang Pengujian Keamanan (_Security Gates_) & Uji Penetrasi

### 9.1 Gerbang Keamanan per Fase (_Per-Phase Verification Gate_)

Setiap fase pengembangan tidak boleh dinyatakan selesai sebelum memenuhi kriteria keamanan berikut:

- [ ] Pemeriksaan kerentanan otomatis: `pnpm audit` bebas dari kerentanan _Critical_ atau _High_.
- [ ] Pemindaian rahasia: `pnpm secrets:scan` bersih tanpa temuan.
- [ ] Pengujian kasus negatif (_negative security test cases_): pengujian rute dengan payload tanpa otentikasi, otorisasi salah peran, dan masukan malformasi menghasilkan galat yang semestinya (HTTP 401, 403, 422).
- [ ] Header keamanan aktif dan terverifikasi via uji E2E Playwright.

### 9.2 Milestone Uji Penetrasi Pre-Go-Live (Fase 10)

Sebelum sistem diluncurkan untuk operasional nyata yayasan, wajib dilakukan pengujian penetrasi independen (_simulated grey-box penetration testing_) yang menguji:

1. Skenario eskalasi hak akses antar role (Anggota -> Staf -> Bendahara -> Super Admin).
2. Skenario bypass Maker-Checker pada permohonan pencairan kas.
3. Uji injeksi dan fuzzing masukan formulir.
4. Uji kebocoran data NIK pada respons API dan log sistem.
5. Uji ketahanan DoS dan keandalan sistem pemulihan cadangan (_disaster recovery_).

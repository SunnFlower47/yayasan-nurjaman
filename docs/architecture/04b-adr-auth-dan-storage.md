# 4b. ADR: Autentikasi, Cadangan Offsite & Storage Media

Dokumen ini memuat Architectural Decision Records (ADR) nomor 011 s.d. 013 untuk sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen induk: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).

---

### ADR-011: Pemilihan Library Autentikasi, Pola Sesi & Pemetaan Skema Domain

- **Konteks**:
  Menetapkan arsitektur autentikasi internal panel admin. Keputusan pemilik:

  1. Mekanisme login **HANYA menggunakan username + password (+ 2FA TOTP)**.
  2. Alamat email **HANYA digunakan untuk pengiriman token reset password dan notifikasi**, bukan untuk login.
  3. Sistem hanya melayani 7 peran internal pengurus; **login sosial (Google, Facebook, GitHub, OAuth pihak ketiga) dilarang**.
  4. Sesi wajib aman (cookie `__Host-`, HttpOnly, SameSite=Lax, Secure), dapat dicabut seketika, dan mendukung verifikasi ulang aksi sensitif (`reauth_at`).

- **Analisis Kebutuhan Skema Better Auth vs Draf Pemilik**:
  Berdasarkan dokumentasi resmi Better Auth (`better-auth` v1.x), skema bawaan membutuhkan 4 tabel inti (`user`, `session`, `account`, `verification`) ditambah tabel/kolom dari plugin `username` dan `twoFactor`:

  1. **Penyimpanan Password Hash**: Better Auth menyimpan password hash pada tabel **`account`** (kolom `password` pada baris dengan `providerId = "credential"`), **BUKAN** di tabel `users`.
  2. **Dukungan Login Username**: Disediakan melalui plugin resmi `username()` dari `better-auth/plugins`. Plugin ini menambahkan kolom `username` pada tabel `user` dan menyediakan endpoint klien `authClient.signIn.username({ username, password })`.
  3. **Reset Password**: Menggunakan tabel generik **`verification`** (`identifier` = email, `value` = token hash terenkripsi, `expiresAt`), dipicu melalui `auth.api.forgetPassword` dan `auth.api.resetPassword`.
  4. **Penyimpanan Secret TOTP & Pemulihan**: Disediakan oleh plugin `twoFactor()` dari `better-auth/plugins`. Plugin menambahkan tabel **`twoFactor`** (`userId`, `secret` terenkripsi, `backupCodes` hash JSON), serta kolom `twoFactorEnabled` pada tabel `user`.
  5. **Pencabutan Sesi & Re-Autentikasi**: Pencabutan sesi diwujudkan dengan menghapus baris sesi pada tabel `session` via `auth.api.revokeSession({ headers, body: { token } })` atau `revokeAllSessions()`. Re-autentikasi aksi sensitif dilakukan melalui `auth.api.verifyPassword()` sebelum mengeksekusi aksi administratif.

- **Tabel Pemetaan Eksplisit (Jika Menggunakan Better Auth)**:

| Model Better Auth           | Field Better Auth                        | Tabel Draf Kita                         | Kolom Draf Kita                                | Catatan Adaptasi / Penyesuaian                                                   |
| :-------------------------- | :--------------------------------------- | :-------------------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------- |
| `user`                      | `id`                                     | `users`                                 | `id`                                           | Identik (UUID)                                                                   |
| `user`                      | `name`                                   | `users`                                 | `name`                                         | Identik                                                                          |
| `user`                      | `email`                                  | `users`                                 | `email`                                        | Identik (Unique, hanya untuk notifikasi/reset)                                   |
| `user`                      | `emailVerified`                          | `users`                                 | -                                              | _Baru_ (Boolean, default true oleh admin)                                        |
| `user`                      | `image`                                  | `users`                                 | -                                              | Opsional (nullable)                                                              |
| `user` (plugin `username`)  | `username`                               | `users`                                 | `username`                                     | Identik (Unique, kunci login utama)                                              |
| `user` (plugin `twoFactor`) | `twoFactorEnabled`                       | `users`                                 | -                                              | _Baru_ (Boolean, penanda status aktif 2FA)                                       |
| `account`                   | `id`                                     | `auth_accounts`                         | `id`                                           | _Tabel Baru_ di luar draf pemilik                                                |
| `account`                   | `userId`                                 | `auth_accounts`                         | `user_id`                                      | FK ke `users(id)` ON DELETE CASCADE                                              |
| `account`                   | `accountId`                              | `auth_accounts`                         | `account_id`                                   | Diisi string username / user ID                                                  |
| `account`                   | `providerId`                             | `auth_accounts`                         | `provider_id`                                  | Nilai statis `"credential"`                                                      |
| `account`                   | `password`                               | `auth_accounts`                         | `password`                                     | **Tempat penyimpanan password hash Argon2id** (di draf di `users.password_hash`) |
| `session`                   | `id`                                     | `sessions`                              | `id`                                           | Identik (UUID)                                                                   |
| `session`                   | `userId`                                 | `sessions`                              | `user_id`                                      | FK ke `users(id)` ON DELETE CASCADE                                              |
| `session`                   | `token`                                  | `sessions`                              | `token_hash`                                   | Token sesi unik ter-hash                                                         |
| `session`                   | `expiresAt`                              | `sessions`                              | `expires_at`                                   | Identik (`TIMESTAMPTZ`)                                                          |
| `session`                   | `ipAddress`                              | `sessions`                              | `ip_address`                                   | Identik                                                                          |
| `session`                   | `userAgent`                              | `sessions`                              | `user_agent`                                   | Identik                                                                          |
| `verification`              | `id`, `identifier`, `value`, `expiresAt` | `verification_tokens`                   | `id`, `identifier`, `token_hash`, `expires_at` | _Pengganti_ tabel `password_reset_tokens`                                        |
| `twoFactor` (plugin)        | `id`, `userId`, `secret`, `backupCodes`  | `two_factor_secrets` & `recovery_codes` | -                                              | _Konsolidasi_ dua tabel draf menjadi satu entitas plugin                         |

- **Perbandingan Dua Jalan**:

  1. **Jalan 1: Mengadopsi Skema Better Auth** (Pemetaan via `modelName` & `fields`):
     - _Kelebihan_: Ekosistem library siap pakai, endpoint autentikasi otomatis di-handle.
     - _Dampak/Kekurangan_: Mengubah draf struktur pemilik: menambah tabel `auth_accounts` dan `verification_tokens`, memindahkan `password_hash` keluar dari `users`, serta mengonsolidasikan `two_factor_secrets` dan `two_factor_recovery_codes`. Seluruh perubahan ini wajib dicatat di `15-diff-vs-draf.md` sebagai perubahan yang menunggu persetujuan.
  2. **Jalan 2: Auth Tipis Buatan Sendiri (_Lightweight In-House Auth_)**:
     - _Kelebihan_:
       - **100% Preservasi Draf Pemilik**: Mempertahankan seluruh 12 tabel Modul 1 persis sesuai draf tanpa penambahan tabel asing (`account`, `verification`).
       - **Nol Overhead & Beban Eksternal**: Sistem hanya memerlukan login username + sandi + 2FA untuk internal yayasan. Implementasi tipis di `src/modules/auth/` menggunakan pustaka resmi `@node-rs/argon2`, `@oslojs/otp` (TOTP), dan enkripsi AES-256-GCM.
       - **Kendali Penuh Sesi**: Kolom `reauth_at`, `is_revoked`, dan `last_active_at` beroperasi murni tanpa lapisan abstraksi adapter pihak ketiga.
     - _Kekurangan_: Staf engineer menulis logika endpoint login, verifikasi TOTP, dan reset sandi secara manual (teruji unit test).

- **Rekomendasi Tegas**:
  Tim rekayasa merekomendasikan **Jalan 2 (Auth Tipis Buatan Sendiri)** karena sistem bersifat tertutup (hanya pengurus yayasan, tanpa login sosial pihak ketiga) dan menjaga integritas 70 tabel draf pemilik 100% tanpa kompromi. Apabila pemilik tetap menghendaki Better Auth (Jalan 1), spesifikasi pemetaan tabel di atas siap diterapkan dengan mencatat deviasi pada `15-diff-vs-draf.md`.
- **Status**: **MENUNGGU PERSETUJUAN SAYA**.

---

### ADR-012: Model Pelacakan Salinan Cadangan Lokal dan Offsite

- **Konteks**: Membedakan salinan cadangan lokal di VPS dengan salinan cadangan offsite di object storage S3 untuk menjamin ketersediaan data saat bencana server (_disaster recovery_).
- **Opsi**:
  1. Kolom langsung di tabel `backup_jobs` (`offsite_status`, `offsite_storage_key`, `offsite_copied_at`).
  2. Tabel relasional terpisah `backup_copies` (`id`, `backup_job_id`, `destination_type`, `storage_key`, `status`, `copied_at`).
- **Trade-off**:
  Opsi 2 memberikan fleksibilitas jika suatu saat yayasan mengirim backup ke 3 provider cloud sekaligus. Namun pada tahap arsitektur saat ini (single VPS + 1 bucket offsite), Opsi 1 jauh lebih sederhana, bebas join, dan mempermudah query warning banner pada admin panel: jika backup lokal `SUCCESS` namun `offsite_status != SUCCESS`, admin langsung diberi peringatan visual.
- **Rekomendasi Tegas**: **Menambahkan Kolom Pelacakan Offsite Langsung pada `backup_jobs`**. Kunci enkripsi backup bersifat offline dan dilarang disimpan di VPS.
- **Status**: **DIPUTUSKAN**.

---

### ADR-013: Abstraksi Lapisan Penyimpanan Berkas Media (`StorageProvider`)

- **Konteks**: Penanganan penyimpanan berkas unggahan publik (foto warta, logo, galeri) dan privat (bukti kuitansi kas, bukti potong pajak, scan KTA).
- **Opsi**:
  1. Panggilan langsung file system Node.js (`fs.writeFile`) ke disk lokal.
  2. AWS S3 SDK langsung di seluruh service modul.
  3. Interface abstraksi `StorageProvider` dengan implementasi default `LocalStorageProvider`.
- **Trade-off**:
  Opsi 1 mengunci kode pada sistem berkas lokal. Opsi 2 memerlukan server MinIO/S3 eksternal sejak awal development. Opsi 3 mengisolasi logika bisnis dari lokasi fisik berkas: fase saat ini menyimpan berkas di disk volume Docker lokal via `LocalStorageProvider`, dan dapat dialihkan ke bucket S3 (`S3StorageProvider`) di masa depan cukup melalui pergantian environment variable tanpa mengubah satu baris pun kode service domain.
- **Rekomendasi Tegas**: Menggunakan **Interface `StorageProvider` (Default `LocalStorageProvider` Volume Bernama Docker)**. Kolom `media_assets` memiliki atribut `storage_backend` (enum `LOCAL, S3`, default `LOCAL`) dan `bucket` (nullable).
- **Status**: **DIPUTUSKAN**.

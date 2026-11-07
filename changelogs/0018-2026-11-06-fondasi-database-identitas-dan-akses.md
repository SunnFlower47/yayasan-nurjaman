# [ID: 0018] Fondasi Basis Data Modul Identitas dan Akses (Fase 1)

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 1 (Fondasi Database Modul Identitas dan Akses)
- **Tipe Perubahan**: `feat`, `db`, `config`, `test`, `docs`
- **Branch**: `feat/fase-1a-database-identitas`
- **Lingkup**: `prisma/schema/`, `prisma/migrations/`, `prisma/seed.ts`, `src/modules/auth/permissions.ts`, `src/lib/db.ts`, `tests/integration/`, `docs/architecture/`

---

### 1. Ringkasan Perubahan

1. **Konfigurasi Multi-Berkas Prisma (`prismaSchemaFolder`)**:

   - Menghapus skema tunggal `prisma/schema.prisma` dan memigrasikan struktur ke folder modular `prisma/schema/`.
   - Mengaktifkan fitur resmi `previewFeatures = ["prismaSchemaFolder"]` pada Prisma Client 6.4.1 (`prisma/schema/schema.prisma`).
   - Menyusun berkas model domain `prisma/schema/01-identity.prisma` berisi 12 model tabel identitas dan akses.

2. **12 Tabel Modul Identitas & Akses (Sesuai Spesifikasi Resmi)**:

   - `users`: Identitas login via `username` (lowercase, format regex `^[a-z0-9._-]{3,32}$`, partial unique index saat `deleted_at IS NULL`), `email` unik untuk notifikasi/reset sandi, status enum `ACTIVE/DISABLED`, `password_hash` Argon2id, `must_change_password`, dan kolom `member_id` UUID nullable (tanpa FK pada fase ini, disiapkan untuk Fase 3).
   - `sessions`: Token hash unik, relasi cascade ke `users`, IP klien (`INET`), batas waktu `idle_expires_at` (30 menit) dan `absolute_expires_at` (8 jam).
   - `two_factor_secrets`: Kunci rahasia TOTP terenkripsi (`secret BYTEA`), pencegahan replay via `last_used_step`.
   - `two_factor_recovery_codes`: Kode cadangan sekali pakai ber-hash.
   - `password_reset_tokens`: Token reset sandi berumur pendek dan sekali pakai.
   - `rate_limit_counters`: Pelacak laju percobaan berbasis jendela waktu (`key`, `window_start`).
   - `roles`: Tabel peran sistem dengan penanda `is_system` dan trigger pencegah penghapusan peran bawaan.
   - `permissions`: Katalog izin terstruktur berbasis format `modul.aksi`.
   - `role_permissions`: Tabel relasi izin-ke-peran dengan composite primary key `(role_id, permission_id)`.
   - `user_roles`: Penugasan multi-peran pengguna dengan composite primary key `(user_id, role_id)`.
   - `audit_logs`: Rekaman audit nirubah (_append-only_, tanpa `updated_at`), indeks komposit `(entity_type, entity_id)` dan `(actor_user_id, occurred_at)`.
   - `security_events`: Rekaman insiden keamanan nirubah (_append-only_, enum `security_event_type`).

3. **Migrasi Basis Data & Pemisahan Hak Akses Role PostgreSQL**:

   - Berkas migrasi DDL dibuat di `prisma/migrations/20261106120212_init_identity_and_access/migration.sql`.
   - Menambahkan SQL kustom: partial unique index pada `users (lower(username))` dan `users (lower(email))`, batasan CHECK format & lowercase username, trigger PostgreSQL `prevent_system_role_deletion()` pada tabel `roles`.
   - Penegakan prinsip hak akses minimal:
     - `db_migrator`: Pemilik seluruh tabel skema `public`.
     - `db_app`: Memperoleh hak DML `SELECT, INSERT, UPDATE, DELETE`, namun hak `UPDATE, DELETE, TRUNCATE` dicabut mutlak pada `audit_logs` dan `security_events`.
     - `db_backup`: Dibatasi murni hak baca `SELECT`.
   - Migrasi dieksekusi secara terisolasi melalui layanan container `migrate` via `pnpm db:migrate`.

4. **Katalog Permission Kode & Skrip Seed Idempoten (`prisma/seed.ts`)**:

   - Mendefinisikan katalog izin resmi sistem pada `src/modules/auth/permissions.ts` (10 izin esensial Fase 1–2).
   - Mendaftarkan 7 peran sistem bawaan: `SUPER_ADMIN`, `PEMBINA`, `KETUA`, `SEKRETARIS`, `BENDAHARA`, `PENGAWAS`, `EDITOR_KONTEN` dengan pemetaan izin awal bertanda "perlu ditinjau pemilik".
   - Menginisialisasi akun Super Admin pertama dari variabel lingkungan (`INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`), kata sandi di-hash dengan **Argon2id** (`@node-rs/argon2`, memory 64MB, time 3, parallelism 4), `must_change_password = true`, dan kata sandi tidak pernah dicetak ke log.
   - Menjalankan seed via `pnpm db:seed` dengan jaminan idempoten (eksekusi berulang tidak menduplikasi data).

5. **Pemeriksaan Kesehatan Koneksi Database via Prisma**:

   - Mengganti fallback soket TCP pada `src/lib/db.ts` dengan eksekusi query native Prisma `$queryRawUnsafe("SELECT 1")` menggunakan role `db_app`.
   - Endpoint `/api/health` merespons status `database.status: "connected"` secara akurat.

6. **Penyelarasan ADR Arsitektur**:
   - Menyelaraskan nama di ADR-014 s.d. ADR-018:
     - `document_sequences` diselaraskan menjadi `number_sequences`.
     - `journal_entry_lines` diselaraskan menjadi `journal_lines`.
     - `transactions` diselaraskan menjadi `financial_transactions`.
     - Primary key di ADR-014 diselaraskan menggunakan tipe native `UUID` berbasis waktu (`UUIDv7`) sesuai `01-conventions.md`.

---

### 2. Rangkaian Pengujian Integrasi (`tests/integration/database-identity.test.ts`)

Menambahkan 4 kasus uji integrasi nyata terhadap container PostgreSQL:

1. `(a)` Role `db_app` berhasil melakukan `INSERT` ke `audit_logs`, namun gagal mutlak saat mengeksekusi `UPDATE`, `DELETE`, maupun `TRUNCATE` (`permission denied`).
2. `(b)` Username `'Admin'` dan `'admin'` tidak dapat keduanya ada di basis data (dicegah oleh partial unique index case-insensitive dan batasan CHECK lowercase).
3. `(c)` Peran sistem bawaan (`is_system = true`) tidak dapat dihapus oleh operasi `DELETE` (dicegah oleh trigger basis data).
4. `(d)` Eksekusi `pnpm db:seed` berulang kali tidak menggandakan baris data pengguna, peran, maupun izin.

# Rincian Fase 0 s.d. 0.7: Fondasi, Keamanan, Basis Data & Docker

Dokumen ini memuat spesifikasi teknis lengkap, ruang lingkup, checklist keamanan, dan pengujian kasus negatif untuk kelompok fase fondasi. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

### Fase 0: Setup Fondasi Proyek, Tooling & Konfigurasi (Status: Selesai)

- **Tujuan**: Membangun fondasi arsitektur modular, tooling, dan sistem changelog.
- **Ruang Lingkup Selesai**:
  - Inisialisasi Next.js 15, TypeScript strict (`noUncheckedIndexedAccess`), Tailwind, ESLint, Prettier, Husky.
  - Sampling token warna resmi dari logo (`#29c668`, `#ffff00`, `#020202`, `#ff4745`).
  - Halaman dev-only `/dev/tokens`, route `/api/health`, placeholder `/`.
  - Sistem changelog `pnpm changelog:new` dan pre-commit check.
  - Entri changelog `0001-2026-11-04-setup-fondasi-proyek.md`.

---

### Fase 0.5: Memperketat Aturan, Standar Kode & Fondasi Keamanan (Status: Selesai)

- **Tujuan**: Menegakkan batas kualitas kode, arsitektur berlapis, dan konfigurasi keamanan tanpa membuat fitur domain.
- **Ruang Lingkup Selesai**:
  - [x] Audit komprehensif hasil Fase 0 (inspeksi git history, port postgres 127.0.0.1, audit dependency, perbaikan CVE Next.js & PostCSS).
  - [x] Dokumen standar rekayasa: `docs/CODE-STANDARDS.md` dan `docs/SECURITY.md`.
  - [x] Pembaruan dokumen lama: `AGENTS.md`, `WORKING-RULES.md`, `MASTER-PLAN.md`, `ARCHITECTURE.md`, `UI-UX-RULES.md`.
  - [x] Penegakan tooling otomatis: ESLint max-lines 250 (error 300), complexity 10, no-console, no-any, check-layers AST script, scan-secrets hook.
  - [x] Baseline keamanan konfigurasi: Security headers & CSP nonce via `src/middleware.ts`, `src/app/robots.ts` (disallow admin/api), `.dockerignore`, `docker-compose.prod.example.yml`, `.github/workflows/ci.yml`.
  - [x] Uji E2E Playwright untuk security headers.
  - [x] Entri changelog terpisah (`0002` s.d. `0006`).
- **Checklist Keamanan Fase 0.5**:
  - [x] `pnpm secrets:scan` bersih dari kunci rahasia.
  - [x] `node scripts/check-layers.mjs` mendeteksi 0 pelanggaran batas lapis.
  - [x] Port database terikat ke 127.0.0.1; user runner Docker non-root.
  - [x] Header X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP, dan HSTS aktif.
- **Checklist Pengujian Kasus Negatif Fase 0.5**:
  - [x] Uji coba commit file staged dengan rahasia tiruan ditolak oleh pre-commit hook.
  - [x] Uji coba impor `@prisma/client` pada komponen UI ditolak oleh linter dan check-layers.
  - [x] Uji coba akses rute `/dev/tokens` pada mode `NODE_ENV=production` mengembalikan HTTP 404 Not Found.

---

### Fase 0.6: Desain Basis Data & Arsitektur Docker-First (Status: Berjalan)

- **Tujuan**: Menetapkan spesifikasi teknis lengkap 70 tabel basis data dalam 8 modul domain, rekonsiliasi draf pemilik, matriks keterlacakan, konvensi, ERD, dan arsitektur pendukung tanpa membuat skema Prisma.
- **Ruang Lingkup Selesai**:
  - [x] Spesifikasi Docker-first & ADR-008: multi-service, isolasi jaringan internal, mitigasi bypass UFW firewall VPS.
  - [x] Spesifikasi migrasi & ADR-009: pola expand-contract, snapshot pre-deploy, portabilitas mesin di `docs/database/11-migration-plan.md`.
  - [x] Penetapan ADR-010 (pemetaan auth domain), ADR-011 (Better Auth), ADR-012 (pelacakan backup offsite), ADR-013 (StorageProvider).
  - [x] Rekonsiliasi draf pemilik & perbandingan tabel-demi-tabel di `docs/database/15-diff-vs-draf.md` (100% dari 70 tabel dan kolom draf utuh).
  - [x] Pemecahan modular 70 tabel dalam 8 berkas domain di `docs/database/00-README.md` s.d. `08-sistem.md`.
  - [x] Standar konvensi basis data (`01-conventions.md`) dan diagram ERD Mermaid komprehensif (`02-erd-overview.md`).
  - [x] Kueri agregasi pelaporan ISAK 35 (`12-reporting-queries.md`) dan 8 skenario operasional (`13-scenarios.md`).
  - [x] Matriks keterlacakan regulasi, skema evolusi, dan validasi restore (`14-traceability.md`).
  - [x] Dokumentasi asumsi dan pertanyaan terbuka (`99-open-questions.md`).
  - [x] Pembuktian 5 invarian DDL PostgreSQL di container Docker terisolasi (`docs/database/sql-snippets/`).
  - [x] Entri changelog terpisah (`0007` s.d. `0012`).
- **Checklist Keamanan Fase 0.6**:
  - [x] Seluruh kunci enkripsi data sensitif (NIK, blind index, credential backup) terdefinisi offline dan tidak dibakar ke image/DB.
  - [x] Role database terpisah: role DDL migrator terisolasi dari role aplikasi `db_app` yang dicabut hak UPDATE/DELETE-nya pada audit log.
  - [x] Berkas lampiran berstatus PRIVATE tidak pernah memiliki URL publik dan storage_key bukan URL langsung.
- **Checklist Pengujian Kasus Negatif Fase 0.6**:
  - [x] Uji coba posting jurnal tidak seimbang ditolak database trigger (01-unbalanced-journal).
  - [x] Uji coba modifikasi transaksi berstatus POSTED ditolak database trigger (02-immutable-posted-journal).
  - [x] Uji coba pencatatan transaksi pada periode CLOSED ditolak database trigger (03-closed-period).
  - [x] Uji coba penambahan tarif pajak bertabrakan rentang ditolak exclusion constraint GiST (04-overlapping-tax-rates).
  - [x] Uji coba mutasi audit log oleh peran db_app ditolak permission privilege PostgreSQL (05-audit-log-permissions).

---

### Fase 0.7: Stack Docker Lengkap (Dev dan Prod) (Status: Belum Dimulai)

- **Tujuan**: Mengimplementasikan seluruh berkas orkestrasi Docker untuk lingkungan pengembangan (dev) dan produksi (prod) sesuai spesifikasi ADR-008, ADR-009, `docs/database/11-migration-plan.md`, dan `docs/database/14-traceability.md`.
- **Ruang Lingkup**:
  - [ ] Implementasi berkas `docker-compose.yml` untuk development (hot reload Next.js, port postgres dev terikat 127.0.0.1).
  - [ ] Implementasi berkas `docker-compose.prod.yml` untuk produksi (internal bridge network `yayasan_internal`, port DB & app tertutup dari host, resource limits).
  - [ ] Konfigurasi container `reverse-proxy` (Caddy resmi ditetapkan dengan otomatisasi TLS Let's Encrypt / ZeroSSL dan security headers).
  - [ ] Konfigurasi container `migrate` sekali jalan (`prisma migrate deploy` dengan penanganan status kegagalan).
  - [ ] Konfigurasi container `backup-worker` (dengan client PostgreSQL 17, skrip backup terjadwal lokal dan offsite S3, validasi manifest versi, dan kredensial least privilege).
  - [ ] Konfigurasi multi-stage `Dockerfile` dengan dukungan multi-arsitektur (`linux/amd64` dan `linux/arm64`).
  - [ ] Uji coba simulasi pemindahan mesin (_cross-machine transfer drill_) dari lokal ke container staging.
- **Checklist Keamanan Fase 0.7**:
  - [ ] Port basis data dan aplikasi TIDAK dipublikasikan ke host publik di produksi (mencegah bypass firewall UFW di VPS Linux).
  - [ ] Port 80 dan 443 hanya dipublikasikan oleh reverse proxy.
  - [ ] Kunci rahasia dan environment variables tidak pernah dibakar ke dalam image Docker layer.
  - [ ] Seluruh container produksi berjalan sebagai user non-root dengan opsi `no-new-privileges: true`.
- **Checklist Pengujian Kasus Negatif Fase 0.7**:
  - [ ] Koneksi langsung dari luar host ke port 5432 atau 3000 ditolak / unreachable.
  - [ ] Simulasi kegagalan layanan `migrate` membatalkan deployment tanpa menghentikan container aplikasi lama.
  - [ ] Simulasi pemulihan backup dengan versi PostgreSQL yang tidak kompatibel otomatis ditolak oleh validator worker.

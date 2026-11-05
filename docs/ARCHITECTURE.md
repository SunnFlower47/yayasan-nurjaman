# Arsitektur Sistem (Architecture Specification)

## Yayasan Nurjaman Bongas Purwakarta

Dokumen ini menjelaskan struktur arsitektur teknis, pola rekayasa perangkat lunak, model data konseptual, sistem keamanan siber berlapis, arsitektur Docker-first, dan keputusan arsitektur (ADR) untuk sistem digital Yayasan Nurjaman Bongas Purwakarta.

---

## 1. Stack Teknologi & Versi Eksak Terpasang

Seluruh dependensi dikunci pada versi eksak (_pinned versions_) tanpa rentang dinamis (`^` atau `~`):

| Komponen                | Pustaka / Runtime      | Versi Eksak         | Peran / Alasan                                                                                                     |
| :---------------------- | :--------------------- | :------------------ | :----------------------------------------------------------------------------------------------------------------- |
| **Framework Utama**     | Next.js (App Router)   | `15.5.28`           | Full-stack framework dengan React Server Components (diperbarui dari 15.2.1 untuk menutup kerentanan keamanan CVE) |
| **Runtime UI**          | React & React DOM      | `19.0.0`            | Library antarmuka deklaratif dengan React 19 Action & Form handling                                                |
| **Bahasa Pemrograman**  | TypeScript             | `5.7.3`             | Strict type checking dengan `noUncheckedIndexedAccess: true`                                                       |
| **Styling & CSS**       | Tailwind CSS & PostCSS | `3.4.17` / `8.5.23` | Utility-first CSS terbukti stabil dengan patch override PostCSS terhadap path traversal                            |
| **ORM & Database Tool** | Prisma ORM             | `6.4.1`             | Type-safe database client & migrasi terstruktur PostgreSQL                                                         |
| **Mesin Basis Data**    | PostgreSQL             | `17-alpine`         | RDBMS enterprise ACID-compliant via Docker & VPS                                                                   |
| **Validasi Skema**      | Zod                    | `3.24.2`            | Validasi runtime fail-fast pada batas sistem (env & payload)                                                       |
| **Pengujian Unit**      | Vitest                 | `3.0.7`             | Test runner modern berkecepatan tinggi berbasis Vite/ESM                                                           |
| **Pengujian E2E**       | Playwright             | `1.50.1`            | End-to-end browser automation & smoke test keandalan                                                               |
| **Ikonografi**          | Lucide React           | `0.475.0`           | Set ikon stroke konsisten, profesional, dan seragam                                                                |
| **Tooling & Penegakan** | ESLint & Prettier      | `9.21.0` / `3.5.2`  | Penjaga kualitas kode (max-lines 250, complexity 10) dan pemformatan otomatis                                      |
| **Git Automation**      | Husky & lint-staged    | `9.1.7` / `15.4.3`  | Penegakan otomatis aturan pre-commit: changelog, scan-secrets, dan check-layers                                    |
| **Package Manager**     | pnpm                   | `12.16.1` (>=9.0.0) | Pengelola paket efisien berbasis hard-links                                                                        |

---

## 2. Struktur Direktori & Tanggung Jawab Lapisan

Sistem menggunakan pola **Modular Monolith** berbasis domain di dalam `src/modules/` dengan pemisahan komponen bersama di `src/components/`:

```text
d:\PROJECT\yayasan-nurjaman/
├── .github/                 # Konfigurasi CI/CD & dependabot
│   ├── workflows/ci.yml     # Automated build, lint, test & secret scan
│   └── dependabot.yml       # Weekly dependency check
├── .husky/                  # Git hook scripts (changelog, secrets, layers enforcer)
├── changelogs/              # Catatan riwayat perubahan (append-only)
│   ├── README.md            # Aturan & template changelog
│   └── 0001-*.md            # File entri berurutan NNNN
├── docs/                    # Dokumen aturan, panduan & arsitektur
│   ├── MASTER-PLAN.md       # Rencana induk sekuensial fase
│   ├── WORKING-RULES.md     # Aturan kerja & invarian akuntansi
│   ├── CODE-STANDARDS.md    # Batas ukuran kode & clean code
│   ├── SECURITY.md          # Standar keamanan OWASP ASVS L2
│   ├── UI-UX-RULES.md       # Desain kelembagaan & komponen bersama
│   ├── ARCHITECTURE.md      # Spesifikasi arsitektur teknis & ADR
│   └── database/            # Spesifikasi 70 tabel basis data & panduan teknis
│       ├── 00-README.md     # Indeks spesifikasi database & legenda notasi
│       ├── 11-migration-plan.md  # Panduan migrasi database & portabilitas Docker
│       ├── 14-traceability.md    # Matriks keterlacakan regulasi & validasi restore
│       └── 15-diff-vs-draf.md    # Rekonsiliasi draf pemilik vs spesifikasi database
├── prisma/                  # Skema database & file migrasi
│   └── schema.prisma
├── public/                  # Aset statis publik
│   └── brand/               # Logo resmi & favicon yayasan
├── scripts/                 # Skrip utilitas CLI
│   ├── check-changelog.mjs  # Enforcer entri changelog di git pre-commit
│   ├── check-layers.mjs     # Enforcer batas arsitektur berlapis
│   ├── new-changelog.mjs    # Generator template changelog baru
│   └── scan-secrets.mjs     # Pemindai kunci rahasia & kredensial bocor
├── src/
│   ├── app/                 # Next.js App Router (Routing, Layout & Page)
│   │   ├── (public)/        # Rute situs publik (Fase 9)
│   │   ├── (admin)/admin/   # Rute panel admin internal (Fase 1 s.d. 8)
│   │   ├── api/health/      # Route kesehatan sistem & koneksi database
│   │   ├── dev/tokens/      # Pratinjau design tokens (dev-only, 404 di prod)
│   │   └── robots.ts        # Dynamic robots.txt (disallow admin & api)
│   ├── components/          # Komponen Antarmuka Bersama
│   │   ├── ui/              # Komponen atomik/primitif (Button, Input, Badge, Dialog)
│   │   ├── shared/          # Komponen komposit (DataTable, PageHeader, MoneyInput)
│   │   └── layout/          # Kerangka tata letak (AdminShell, Header, Sidebar)
│   ├── modules/             # Modular Domain Packages
│   │   ├── auth/            # Autentikasi, 2FA, sesi, akun pengurus
│   │   ├── members/         # Manajemen anggota, pengurus, relawan & data masking
│   │   ├── finance/         # Inti akuntansi: COA, Jurnal Umum, Buku Kas, ISAK 35
│   │   ├── projects/        # Proyek/kegiatan sosial dan pagu anggaran
│   │   ├── tax/             # Konfigurasi tarif pajak dinamis & bukti potong
│   │   ├── content/         # CMS profil yayasan, berita, artikel & galeri
│   │   ├── settings/        # Pengaturan umum yayasan, preferensi sistem
│   │   ├── audit/           # Service & viewer jejak audit aktivitas (audit trail)
│   │   └── backup/          # Utilitas pencadangan dan pemulihan database
│   ├── lib/                 # Utilitas lintas modul (env, db, format, errors)
│   ├── middleware.ts        # Security headers, nonce-based CSP & robots tags
│   └── styles/              # Design tokens (tokens.css) & Tailwind (globals.css)
└── tests/                   # Pengujian terstruktur (unit/ & e2e/)
```

### Tanggung Jawab Lapisan per Modul Domain (`src/modules/<domain>/`)

- **`actions/`**: Next.js Server Actions tipis: autentikasi → otorisasi (`requirePermission`) → validasi Zod → panggil service → respons terstruktur.
- **`services/`**: Logika bisnis domain, kalkulasi finansial, validasi invarian, transaksi multi-tabel, pemicu audit log. Terisolasi dari objek HTTP.
- **`repositories/`**: Satu-satunya lapisan yang mengakses Prisma Client. Mengabstraksi kueri database.
- **`schemas/`**: Definisi skema Zod dan inferensi tipe TypeScript.
- **`components/`**: Komponen UI khusus milik modul tersebut. Dilarang mengimpor database/repository.
- **`index.ts`**: Pintu gerbang publik tunggal modul (_public API_). Modul luar dilarang melakukan _deep import_ ke internal folder.

---

## 3. Alur Permintaan (Request Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Pengguna as Pengguna / Admin
    participant UI as Komponen Antarmuka (UI)
    participant Action as Server Action / Route
    participant Schema as Zod Schema Validation
    participant Service as Domain Service Layer
    participant Audit as Audit Log Service
    participant Repo as Database Repository
    participant DB as PostgreSQL Database

    Pengguna->>UI: Melakukan Aksi (Submit Form / Klik)
    UI->>Action: Memanggil Server Action(payload)
    Action->>Action: Verifikasi Autentikasi (requireUser)
    Action->>Action: Verifikasi Izin Spesifik Server (requirePermission)
    Action->>Schema: Validasi Data Masuk (Zod safeParse)
    alt Data Tidak Valid
        Schema-->>Action: ValidationError
        Action-->>UI: Respon Error Ramah (Pesan Bahasa Indonesia)
    else Data Valid
        Action->>Service: Eksekusi Logika Bisnis(validData)
        Service->>Service: Validasi Invarian (Debit == Kredit, Anggaran)
        Service->>Repo: Operasi Database dalam Prisma Transaction
        Repo->>DB: Kueri Terparameter (INSERT / UPDATE)
        DB-->>Repo: Hasil Mutasi
        Service->>Audit: Rekam Jejak Audit (Actor, Event, Diff, IP)
        Audit->>DB: Simpan Catatan Audit Append-Only
        Service-->>Action: Respon Sukses / DTO Bertipe
        Action-->>UI: Revalidate Path & Tampilkan Notifikasi Sukses
    end
```

---

## 4. Arsitektur Keamanan Siber & Pertahanan Berlapis (_Defense in Depth_)

```mermaid
flowchart TD
    Req["Permintaan Masuk (Browser/Klien)"] --> Hdr["Layer 1: Security Headers & Nonce CSP (src/middleware.ts)"]
    Hdr --> Edge["Layer 2: Middleware UX Routing (Optimistic Redirect)"]
    Edge --> AuthAction["Layer 3: Server Action / Route Handler: requireUser()"]
    AuthAction --> RBACAction["Layer 4: Server Action: requirePermission('modul:aksi')"]
    RBACAction --> ZodAction["Layer 5: Strict Input Validation (Zod Schema parse)"]
    ZodAction --> Serv["Layer 6: Domain Service Invariants & Business Logic"]
    Serv --> RepoLayer["Layer 7: Scoped Repository Queries (Anti-IDOR)"]
    RepoLayer --> Encrypt["Layer 8: AES-256-GCM Encryption (PII/NIK)"]
    Encrypt --> DBTrans["Layer 9: PostgreSQL Transaction & Immutable Audit Log"]
```

### Prinsip Pertahanan Berlapis Utama

1. **Otorisasi Server-Side vs Middleware**:
   Next.js Middleware hanya bertindak sebagai pelindung rute awal (_optimistic redirect_). Seluruh evaluasi otorisasi otoritatif WAJIB dijalankan di sisi server (`requirePermission`) di dalam Server Action atau Route Handler. Hal ini mengeliminasi risiko _middleware bypass_.
2. **Keamanan Sesi & Kredensial**:
   - Sandi di-hash menggunakan Argon2id (memory 64MB, iterations 3, parallelism 4) atau bcrypt cost 12+.
   - Cookie sesi berflag `HttpOnly`, `Secure`, `SameSite=Lax`, prefiks `__Host-`.
   - TOTP 2FA wajib untuk Super Admin, Ketua, dan Bendahara.
3. **Enkripsi Data Pribadi (PII) at Rest**:
   Data NIK anggota dienkripsi menggunakan AES-256-GCM sebelum disimpan di basis data dan ditampilkan tersamar di antarmuka (`3201************`).
4. **Header Keamanan Ketat**:
   CSP berbasis nonce, HSTS (`max-age=63072000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, serta pemblokiran mesin pencari pada panel admin (`X-Robots-Tag: noindex, nofollow, noarchive`).

---

## 5. Model Entitas Database Konseptual

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ USER_ROLE : assigned
    ROLE ||--o{ USER_ROLE : contains
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : defined

    USER ||--o{ AUDIT_LOG : triggers

    MEMBER ||--o{ PROJECT_MEMBER : participates
    PROJECT ||--o{ PROJECT_MEMBER : involves
    PROJECT ||--o{ PROJECT_BUDGET : allocated
    PROJECT ||--o{ JOURNAL_ENTRY : tagged

    ACCOUNT ||--o{ JOURNAL_LINE : referenced
    JOURNAL_ENTRY ||--o{ JOURNAL_LINE : contains
    JOURNAL_ENTRY ||--o{ TAX_WITHHOLDING : associates

    TAX_TYPE ||--o{ TAX_RATE : defines
    TAX_RATE ||--o{ TAX_WITHHOLDING : applies

    ACCOUNTING_PERIOD ||--o{ JOURNAL_ENTRY : bounds

    FOUNDATION_PROFILE ||--o{ FOUNDATION_OFFICER : includes
    NEWS_CATEGORY ||--o{ NEWS_ARTICLE : categorizes
```

---

## 6. Arsitektur Docker-First & Ekosistem Layanan

Sistem dirancang dengan pendekatan **Docker-First**: seluruh subsistem aplikasi, basis data, proxy, migrasi, dan backup dapat dijalankan secara terisolasi dan dipindahkan lintas mesin (dari server VPS produksi ke laptop pengembang dan sebaliknya) murni menggunakan perintah modern `docker compose` (v2).

### 6.1 Topologi Layanan (_Service Catalog_)

| Layanan             | Peran & Tanggung Jawab                                               | Mode Eksekusi                                       | Paparan Port ke Host                    |
| :------------------ | :------------------------------------------------------------------- | :-------------------------------------------------- | :-------------------------------------- |
| **`app`**           | Aplikasi Next.js App Router (SSR, API, Server Actions)               | Daemon (`restart: unless-stopped`)                  | **TIDAK ADA** (Hanya jaringan internal) |
| **`postgres`**      | Database PostgreSQL 17 Alpine                                        | Daemon (`restart: unless-stopped`)                  | **TIDAK ADA** (Hanya jaringan internal) |
| **`reverse-proxy`** | Caddy dengan TLS otomatis Let's Encrypt / ZeroSSL (Resmi Ditetapkan) | Daemon (`restart: unless-stopped`)                  | **Port 80 (HTTP) & 443 (HTTPS)**        |
| **`migrate`**       | Eksekusi `prisma migrate deploy` sebelum deploy app                  | Sekali jalan (_ephemeral one-off_, `restart: "no"`) | **TIDAK ADA** (Hanya jaringan internal) |
| **`backup-worker`** | Worker cadangan terjadwal lokal & offsite S3 (Wajib)                 | Daemon berkala (`restart: unless-stopped`)          | **TIDAK ADA** (Hanya jaringan internal) |

### 6.2 Volume Bernama (_Named Volumes_)

Persistensi data dipisahkan dari container lifecycle menggunakan volume bernama Docker:

- **`postgres_data`**: Menyimpan direktori data mentah PostgreSQL (`/var/lib/postgresql/data`).
- **`uploads_private`**: Berkas privat sensitif (bukti kuitansi kas, bukti potong pajak, scan KTA, lampiran keuangan).
- **`uploads_public`**: Berkas publik (foto dokumentasi kegiatan, galeri berita, logo yayasan, avatar pengurus).

### 6.3 Isolasi Jaringan & Catatan Keamanan Kritis Firewall (UFW Bypass)

> [!CAUTION] **Bahaya Docker Mem-Bypass Firewall UFW di Linux/VPS**
> Pada sistem operasi Linux (Ubuntu/Debian) di server VPS, Docker Daemon memanipulasi aturan `iptables` secara langsung pada rantai `PREROUTING`. Perilaku ini menyebabkan port container yang dipublikasikan via deklarasi `ports:` pada Docker Compose **secara otomatis melewati (bypass) aturan firewall `ufw`**.
> **ATURAN MUTLAK ARSITEKTUR**:
>
> 1. Layanan `postgres` dan `app` **DILARANG KERAS** mempublikasikan port ke host (`ports:` dilarang). Keduanya HANYA terhubung ke bridge network terisolasi `yayasan_internal`.
> 2. **HANYA** layanan `reverse-proxy` yang diizinkan mempublikasikan port `80` dan `443` ke host publik. Seluruh akses trafik masuk wajib disaring oleh reverse proxy.

```mermaid
flowchart LR
    Internet["Internet Publik"] -->|Port 80/443| RP["reverse-proxy (Caddy/TLS)"]
    subgraph Host["Host Mesin / VPS"]
        subgraph InternalNet["Docker Network: yayasan_internal (Tanpa Akses Port Langsung)"]
            RP -->|HTTP internal:3000| App["app (Next.js Node)"]
            Migrate["migrate (One-Off)"] -->|TCP:5432| DB["postgres (PostgreSQL 17)"]
            App -->|TCP:5432| DB
            Worker["backup-worker"] -->|TCP:5432 (Least Privilege)| DB
        end
        DB --> VolDB[("postgres_data")]
        App --> VolPriv[("uploads_private")]
        App --> VolPub[("uploads_public")]
    end
```

### 6.4 Pengelolaan Environment Variables, Rahasia & Key Ring Kriptografi (_Zero Baked Secrets_)

1. Kunci rahasia kredensial (`DATABASE_URL`, `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`), **Key Ring Enkripsi Aplikasi** (`ENCRYPTION_KEY_ACTIVE_ID`, `ENCRYPTION_KEYS`), dan **Kunci Blind Index** (`BLIND_INDEX_SECRET`) **DILARANG KERAS DIBAKAR** (_never baked_) ke dalam Dockerfile atau image layer.
2. Seluruh rahasia disuntikkan secara dinamis saat runtime melalui environment host terproteksi (berkas `.env` dengan izin berkas ketat `chmod 600`).
3. **Konvensi Key Ring Multi-Kunci & Blind Index**:
   - `ENCRYPTION_KEY_ACTIVE_ID` menentukan ID kunci aktif saat ini yang dipakai mengenkripsi data baru (AES-256-GCM).
   - `ENCRYPTION_KEYS` memuat kamus seluruh pasangan key ID dan kunci enkripsi 32-byte (termasuk kunci lama) untuk menjamin data historis tetap bisa didekripsi saat rotasi kunci.
   - `BLIND_INDEX_SECRET` adalah kunci HMAC-SHA256 terpisah untuk indexing kolom terenkripsi (`nik_blind_index`) guna pencarian dan validasi keunikan tanpa membongkar ciphertext.
   - **Invarian Pemindahan Mesin**: SEMUA kunci enkripsi di key ring dan kunci blind index wajib direplikasi identik ke mesin target. Ketiadaan kunci enkripsi menyebabkan kehilangan data permanen (_unreadable ciphertext_); ketiadaan kunci blind index merusak fungsionalitas pencarian dan deteksi duplikat NIK anggota.

### 6.5 Pemeriksaan Kesehatan (_Healthcheck_) & Versi Image Eksak

- Seluruh container pendukung wajib memiliki `healthcheck`:
  - `postgres`: `test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]`
  - `app`: `test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health || exit 1"]`
- Tag image Docker wajib dipin pada versi eksak (misal: `postgres:17.2-alpine`, `node:22.13.0-alpine`, `caddy:2.9.1-alpine`). Dilarang menggunakan tag dinamis `:latest`.

### 6.6 Dukungan Multi-Arsitektur (_Multi-Platform Build_)

Image yang dibangun untuk aplikasi dan worker wajib mendukung arsitektur ganda via Docker Buildx: `linux/amd64` (Server VPS x86_64 produksi) dan `linux/arm64` (Laptop Apple Silicon / ARM pengembang).

### 6.7 Kebijakan Toleransi Restart, Henti Singkat & Pola Migrasi Expand-Contract

1. **Henti Singkat Terukur (_Brief Interruption_)**: Restart container aplikasi Next.js membutuhkan jeda booting 2–5 detik. Sistem menerima kompromi henti singkat terukur ini (bukan zero-downtime) demi kesederhanaan single-host.
2. **Pola Evolusi Skema Expand-Contract**: Perubahan skema database wajib kompatibel dengan app berjalan: buat kolom baru nullable/default (Expand), migrasi data (Backfill), lalu hapus kolom usang di rilis berikutnya (Contract).
3. **Penanganan Kegagalan Migrasi**: Jalur normal adalah perbaikan skema dan rekonsiliasi via `prisma migrate resolve`. Pemulihan dari snapshot `PRE_DEPLOY` adalah pilihan terakhir (_last resort_) untuk kegagalan DDL destruktif.

---

## 7. Catatan Keputusan Arsitektur (Architectural Decision Records / ADR)

| ID ADR      | Tanggal    | Topik Keputusan                                                      | Pilihan yang Ditetapkan & Alasan Teknis                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :---------- | :--------- | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR-001** | 2026-11-04 | **Arsitektur Aplikasi**                                              | **Next.js App Router + Modular Monolith**. Menggabungkan kemudahan pemeliharaan monolit dengan isolasi batas domain yang tegas di `src/modules/`.                                                                                                                                                                                                                                                                                                                                        |
| **ADR-002** | 2026-11-04 | **Manajemen Basis Data**                                             | **PostgreSQL + Prisma Migration Only**. Menolak keras `prisma db push` demi jejak migrasi skema yang terlacak dan reproduktif.                                                                                                                                                                                                                                                                                                                                                           |
| **ADR-003** | 2026-11-05 | **Prioritas Roadmap**                                                | **Admin Panel Terlebih Dahulu, Situs Publik Terakhir**. Membangun fondasi internal, data anggota, keuangan ISAK 35, proyek, dan CMS sebelum membuka wajah publik.                                                                                                                                                                                                                                                                                                                        |
| **ADR-004** | 2026-11-05 | **Model Otorisasi Aman**                                             | **Defense in Depth Server-Side Authorization**. Middleware hanya untuk redirect; pengecekan izin mutlak dilakukan di Server Action (`requirePermission`) guna menangkal potensi middleware route bypass.                                                                                                                                                                                                                                                                                 |
| **ADR-005** | 2026-11-04 | **Presisi Finansial**                                                | **BigInt / Decimal Integer Rupiah**. Dilarang menggunakan tipe float. Invarian debit = kredit diverifikasi sebelum transaksi ditulis ke basis data.                                                                                                                                                                                                                                                                                                                                      |
| **ADR-006** | 2026-11-04 | **Konfigurasi Tarif Pajak**                                          | **Master Data Berversi Tanggal Efektif**. Tarif pajak (PPh 21, 23, Final) tidak di-hardcode di kode, melainkan dibaca dinamis dari tabel berversi tanggal.                                                                                                                                                                                                                                                                                                                               |
| **ADR-007** | 2026-11-05 | **Header Keamanan & CSP**                                            | **Nonce-based CSP & Strict HTTP Headers**. Menerapkan CSP dengan nonce per request, HSTS 2 tahun, X-Frame-Options: DENY, dan X-Robots-Tag noindex untuk rute admin/API.                                                                                                                                                                                                                                                                                                                  |
| **ADR-008** | 2026-11-05 | **Ekosistem Docker-First & Portabilitas**                            | **Docker Compose v2 Multi-Service & Multi-Arch**. Menstandarisasi layanan (`app`, `postgres`, `reverse-proxy`, `migrate`, `backup-worker`) dengan isolasi jaringan internal tanpa port binding ke DB/app guna menangkal UFW bypass di VPS, volume bernama, serta portabilitas total laptop $\leftrightarrow$ VPS.                                                                                                                                                                        |
| **ADR-009** | 2026-11-05 | **Manajemen Kriptografi Multi-Kunci & Pola Migrasi Expand-Contract** | **Key Ring + Key ID, Blind Index HMAC Terpisah, dan Strategi Migrasi Expand-Contract**. Seluruh kunci kriptografi wajib direplikasi saat pemindahan mesin. Restart aplikasi diakui memiliki henti singkat terukur (bukan zero-downtime), migrasi skema wajib non-breaking (expand-contract), kegagalan ditangani dengan `prisma migrate resolve` (snapshot restore sebagai pilihan terakhir), cadangan offsite berbasis S3 diwajibkan, dan Caddy ditetapkan sebagai reverse proxy resmi. |
| **ADR-010** | 2026-11-06 | **Resolusi Tabrakan Nama Entitas & Pemetaan Tabel Auth**             | **Bagan Akun `chart_of_accounts`, Kas/Bank `cash_bank_accounts`, Tabel Auth Domain Mandiri**. Menghindari tabrakan nama entitas generic `accounts`. Tabel auth domain (`users`, `sessions`, `two_factor_secrets`, `two_factor_recovery_codes`, `password_reset_tokens`) dirancang mandiri dan dipetakan ke library auth via custom adapter tanpa mengubah konvensi skema domain inti yayasan.                                                                                            |

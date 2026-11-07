# 1. Stack Teknologi & Struktur Direktori

Dokumen ini memuat spesifikasi stack teknologi dan arsitektur direktori modular sistem Yayasan Nurjaman Bongas Purwakarta. Dokumen induk: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).

---

## 1. Stack Teknologi & Versi Eksak Terpasang

Seluruh dependensi dikunci pada versi eksak (_pinned versions_) tanpa rentang dinamis (`^` atau `~`):

| Komponen                | Pustaka / Runtime      | Versi Eksak         | Peran / Alasan                                                                                |
| :---------------------- | :--------------------- | :------------------ | :-------------------------------------------------------------------------------------------- |
| **Framework Utama**     | Next.js (App Router)   | `15.5.28`           | Full-stack framework dengan React Server Components (diperbarui untuk menutup kerentanan CVE) |
| **Runtime UI**          | React & React DOM      | `19.0.0`            | Library antarmuka deklaratif dengan React 19 Action & Form handling                           |
| **Bahasa Pemrograman**  | TypeScript             | `5.7.3`             | Strict type checking dengan `noUncheckedIndexedAccess: true`                                  |
| **Styling & CSS**       | Tailwind CSS & PostCSS | `3.4.17` / `8.5.23` | Utility-first CSS terbukti stabil dengan patch override PostCSS terhadap path traversal       |
| **ORM & Database Tool** | Prisma ORM             | `6.4.1`             | Type-safe database client & migrasi terstruktur PostgreSQL                                    |
| **Mesin Basis Data**    | PostgreSQL             | `17-alpine`         | RDBMS enterprise ACID-compliant via Docker & VPS                                              |
| **Validasi Skema**      | Zod                    | `3.24.2`            | Validasi runtime fail-fast pada batas sistem (env & payload)                                  |
| **Pengujian Unit**      | Vitest                 | `3.0.7`             | Test runner modern berkecepatan tinggi berbasis Vite/ESM                                      |
| **Pengujian E2E**       | Playwright             | `1.50.1`            | End-to-end browser automation & smoke test keandalan                                          |
| **Ikonografi**          | Lucide React           | `0.475.0`           | Set ikon stroke konsisten, profesional, dan seragam                                           |
| **Tooling & Penegakan** | ESLint & Prettier      | `9.21.0` / `3.5.2`  | Penjaga kualitas kode (max-lines 250, complexity 10) dan pemformatan otomatis                 |
| **Git Automation**      | Husky & lint-staged    | `9.1.7` / `15.4.3`  | Penegakan otomatis aturan pre-commit: changelog, scan-secrets, dan check-layers               |
| **Package Manager**     | pnpm                   | `12.16.1` (>=9.0.0) | Pengelola paket efisien berbasis hard-links                                                   |

---

## 2. Struktur Direktori & Tanggung Jawab Lapisan

Sistem menggunakan pola **Modular Monolith** berbasis domain di dalam `src/modules/` dengan pemisahan komponen bersama di `src/components/`:

```text
d:\PROJECT\yayasan-nurjaman/
├── .github/                 # Konfigurasi CI/CD & dependabot
├── .husky/                  # Git hook scripts (changelog, secrets, layers enforcer)
├── changelogs/              # Catatan riwayat perubahan NNNN (append-only)
├── docs/                    # Dokumen aturan, panduan & arsitektur (MASTER-PLAN, SECURITY, dll.)
│   ├── architecture/        # Rincian modular arsitektur & ADR (00 s.d. 04c)
│   ├── database/            # Spesifikasi modular basis data (00 s.d. 15, sql-snippets)
│   └── master-plan/         # Rincian modular tiap kelompok fase (00 s.d. 06)
├── prisma/                  # Skema database & file migrasi
├── public/                  # Aset statis publik (brand, favicon)
├── scripts/                 # Skrip utilitas CLI (check-layers, scan-secrets, dll.)
├── src/
│   ├── app/                 # Next.js App Router ((public)/, (admin)/admin/, api/health/)
│   ├── components/          # Komponen Antarmuka Bersama (ui/, shared/, layout/)
│   ├── modules/             # Modular Domain (auth, members, finance, projects, tax, content, settings, audit, backup)
│   ├── lib/                 # Utilitas lintas modul (env, db, format, errors)
│   ├── middleware.ts        # Security headers, nonce-based CSP & robots tags
│   └── styles/              # Design tokens & CSS global
└── tests/                   # Pengujian terotomatisasi (unit/ & e2e/)
```

### Tanggung Jawab Lapisan per Modul Domain (`src/modules/<domain>/`)

- **`actions/`**: Next.js Server Actions tipis: autentikasi → otorisasi (`requirePermission`) → validasi Zod → panggil service → respons terstruktur.
- **`services/`**: Logika bisnis domain, kalkulasi finansial, validasi invarian, transaksi multi-tabel, pemicu audit log. Terisolasi dari objek HTTP.
- **`repositories/`**: Satu-satunya lapisan yang mengakses Prisma Client. Mengabstraksi kueri database.
- **`schemas/`**: Definisi skema Zod dan inferensi tipe TypeScript.
- **`components/`**: Komponen UI khusus milik modul tersebut. Dilarang mengimpor database/repository.
- **`index.ts`**: Pintu gerbang publik tunggal modul (_public API_). Modul luar dilarang melakukan _deep import_ ke internal folder.

# CODE-STANDARDS.md — Standar Kode & Rekayasa Perangkat Lunak

> **Status Dokumen**: Wajib Dipatuhi (Normatif)  
> **Sasaran**: Seluruh pengembang dan AI agent pada sistem Yayasan Nurjaman Bongas Purwakarta.

Dokumen ini mendefinisikan standar mutu kode, batasan ukuran, pemisahan lapisan arsitektur, dan konvensi penamaan yang wajib ditegakkan secara konsisten. Kode yang ditulis harus berstandar produksi (_production-grade_) sejak hari pertama, bukan kode prototipe.

---

## 1. Prinsip Utama Rekayasa

1. **Production-Ready**: Kode yang masuk ke cabang utama harus siap dioperasikan di lingkungan produksi dengan penanganan galat yang aman dan logging terstruktur.
2. **Keterbacaan dan Kesederhanaan**: Kode ditulis untuk dibaca dan dirawat oleh manusia lain. Prioritaskan kejelasan struktur dibanding trik sintaks yang samar (_clever code_).
3. **Nol Kode Mati (_Zero Dead Code_)**: Dilarang melakukan commit terhadap fungsi yang tidak pernah dipanggil, variabel tidak terpakai, atau blok kode yang di-comment (_commented-out code_).
4. **Nol `console.log`**: Seluruh logging di server wajib menggunakan utilitas logger terstruktur yang mendukung level log (`debug`, `info`, `warn`, `error`) dan konteks permintaan (_request ID_).
5. **Kewajiban Rujukan `TODO`**: Komentar `TODO` hanya diperkenankan jika disertai tautan/referensi fase pada `MASTER-PLAN.md` (misalnya: `// TODO(Fase-4): integrasi pencatatan jurnal otomatis`).

---

## 2. Batas Ukuran Kode (_Size Limits_)

Batas ukuran ditegakkan secara otomatis melalui linter ESLint untuk mencegah pembentukan berkas raksasa (_god files_) dan fungsi serba-bisa (_god functions_):

| Elemen                            | Batas Peringatan | Batas Error Mutlak   | Tindakan Remediasi                                                   |
| :-------------------------------- | :--------------- | :------------------- | :------------------------------------------------------------------- |
| **Berkas Sumber (`.ts`, `.tsx`)** | 250 baris        | **300 baris**        | Pecah ke berkas modul/subkomponen baru                               |
| **Fungsi / Metode**               | 40 baris         | **50 baris**         | Ekstraksi ke fungsi pembantu privat murni                            |
| **Kompleksitas Siklomatis**       | 8                | **10**               | Sederhanakan percabangan (guard clauses, polymorphism, lookup table) |
| **Parameter Fungsi**              | 3 parameter      | **4 parameter**      | Kelompokkan menjadi objek parameter bertipe (_typed options object_) |
| **Komponen React (`.tsx`)**       | 120 baris        | **150 baris**        | Pecah menjadi subkomponen, custom hook, atau fungsi render terpisah  |
| **Ekspor per Berkas**             | -                | **1 Komponen Utama** | 1 berkas hanya mengekspor 1 komponen UI utama                        |

### Pengecualian Batas Ukuran Terbatas

Pengecualian hanya berlaku untuk kategori berkas berikut dengan alasan teknis khusus:

- Berkas pengujian unit/E2E (_test suites_ komprehensif): `tests/**/*.{ts,tsx}`.
- Berkas definisi token CSS terpusat: `src/styles/tokens.css`.
- Berkas skema atau kode yang dihasilkan otomatis oleh alat (_generated artifacts_ seperti migrasi Prisma).

---

## 3. Struktur Direktori & Konvensi Modular

Arsitektur aplikasi terbagi atas tiga pilar: modul domain (`src/modules/`), komponen antarmuka bersama (`src/components/`), dan pustaka utilitas global (`src/lib/`).

### 3.1 Pohon Modul Domain (`src/modules/<domain>/`)

Setiap domain bisnis (auth, members, finance, projects, tax, content, settings, audit, backup) memiliki struktur folder yang seragam:

```text
src/modules/<domain>/
├── actions/                  # Next.js Server Actions (orkestrator mutasi publik)
│   ├── create-<entity>.ts
│   └── update-<entity>.ts
├── services/                 # Logika bisnis, validasi aturan domain, transaksi
│   ├── <entity>-service.ts
│   └── <sub-domain>/         # Subfolder jika modul kompleks (misal finance/services/journal/)
│       └── create-journal.ts
├── repositories/             # Akses basis data Prisma (satu-satunya layer DB)
│   └── <entity>-repo.ts
├── schemas/                  # Skema validasi Zod untuk form dan mutasi
│   └── <entity>-schema.ts
├── components/               # Komponen antarmuka yang HANYA digunakan oleh modul ini
│   ├── <entity>-card.tsx
│   └── <entity>-form.tsx
├── hooks/                    # Custom React hooks khusus modul ini
│   └── use-<entity>.ts
├── types/                    # Definisi tipe domain (turunan Zod / Prisma)
│   └── <entity>-types.ts
├── constants/                # Nilai konstan, opsi dropdown, status enum
│   └── <entity>-constants.ts
├── lib/                      # Utilitas perhitungan murni khusus modul ini
│   └── <calculation-helper>.ts
└── index.ts                  # Public API modul (satu-satunya pintu impor dari modul lain)
```

> **Aturan Subdomain Service**: Pada modul dengan alur kerja padat (misal `finance`), dilarang membuat satu berkas service raksasa. Service wajib dikelompokkan ke subfolder domain:
>
> - `finance/services/journal/` (pencatatan dan validasi jurnal)
> - `finance/services/reporting/` (kompilasi laporan ISAK 35)
> - `finance/services/period/` (penutupan buku buku tahunan/bulanan)

### 3.2 Komponen Antarmuka Bersama (`src/components/`)

Komponen yang digunakan lintas modul ditempatkan di direktori terpusat:

```text
src/components/
├── ui/                       # Komponen primitif atomik (berdasarkan token desain)
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── dialog.tsx
│   └── table.tsx
├── shared/                   # Komponen komposit terstandarisasi lintas halaman
│   ├── data-table.tsx        # Tabel data dengan paginasi, filter, dan sorting
│   ├── page-header.tsx       # Judul halaman, breadcrumb, dan action buttons
│   ├── confirm-dialog.tsx    # Modal konfirmasi tindakan penting/destruktif
│   ├── money-input.tsx       # Input khusus mata uang Rupiah dengan formatting otomatis
│   ├── empty-state.tsx       # Tampilan visual ketika data kosong/nihil
│   ├── status-badge.tsx      # Lencana status semantik (sukses, pending, bahaya)
│   └── form-field.tsx        # Pembungkus label, input, helper text, dan error message
└── layout/                   # Komponen tata letak kerangka
    ├── admin-shell.tsx
    ├── admin-sidebar.tsx
    ├── admin-header.tsx
    └── public-navbar.tsx
```

### 3.3 Konvensi Penamaan

- **Berkas & Direktori**: Huruf kecil dipisah tanda hubung (`kebab-case`). Contoh: `money-input.tsx`, `tax-calculation-service.ts`.
- **Komponen React**: Huruf besar di awal kata (_PascalCase_). Contoh: `DataTable`, `AdminSidebar`.
- **Fungsi & Hook**: Huruf kecil diawali camelCase (`useCamelCase` untuk hook, `verbNoun` untuk fungsi biasa). Contoh: `useDebounce`, `formatRupiah`, `calculateWithholdingTax`.
- **Konstanta Global**: Huruf kapital dengan garis bawah (_UPPER_SNAKE_CASE_). Contoh: `DEFAULT_PAGE_SIZE`, `MAX_ATTACHMENT_SIZE_BYTES`.
- **Tipe & Interface**: Huruf besar di awal (_PascalCase_). Contoh: `JournalEntry`, `CreateMemberInput`.
- **Larangan Nama Ambigu**: DILARANG membuat berkas dengan nama umum tempat pembuangan fungsi seperti `utils.ts`, `helpers.ts`, `misc.ts`, atau `common.ts`. Berkas utilitas wajib mencerminkan fungsinya, contoh: `currency-format.ts`, `date-utils.ts`, `slugify.ts`.

---

## 4. Aturan Lapisan Arsitektur & Batas Dependensi

Sistem mengadopsi prinsip _Clean Architecture_ dan _Layered Architecture_ yang ketat. Ketergantungan hanya boleh mengalir satu arah dari luar ke dalam:

```text
[ Browser / Client ]
        │ (HTTP / Server Action Call)
        ▼
[ Presentation Layer: Server Action / Route Handler ]
        │ (Zod Validation & Permission Check)
        ▼
[ Domain Layer: Service Layer ]  <─── Logika Bisnis & Perhitungan Finansial
        │ (Typed DTO / Params)
        ▼
[ Data Access Layer: Repository Layer ]
        │ (Prisma Client Query)
        ▼
[ Infrastructure: PostgreSQL Database ]
```

### 4.1 Tanggung Jawab & Batasan Tiap Lapisan

1. **Presentation / Server Action (`actions/*.ts` & `route.ts`)**:
   - **Tugas**: Gerbang masuk. Urutan eksekusi WAJIB baku:
     1. Verifikasi Autentikasi (`requireUser()`).
     2. Verifikasi Otorisasi / Izin (`requirePermission('...')`).
     3. Validasi skema input dengan Zod (`schema.parse()`).
     4. Panggil method pada Service terkait.
     5. Kembalikan respons terstruktur (`Result<T, E>`).
   - **Larangan**: Dilarang berisi kueri basis data langsung (`prisma.findMany`), kalkulasi saldo, atau manipulasi data domain.
2. **Domain Service (`services/*.ts`)**:
   - **Tugas**: Inti dari seluruh aturan bisnis, validasi kelayakan bisnis (misal: verifikasi ketersediaan anggaran, keseimbangan debit-kredit jurnal), orkestrasi beberapa repositori, dan pengelolaan transaksi database.
   - **Larangan**: Dilarang mengakses objek HTTP web langsung (`NextRequest`, `NextResponse`, `cookies()`, `headers()`). Layanan harus murni berbasis TypeScript dan dapat diuji tanpa lingkungan browser.
3. **Repository (`repositories/*.ts`)**:
   - **Tugas**: Satu-satunya lapisan yang boleh memanggil `prisma.<model>` atau mengeksekusi kueri SQL. Bertanggung jawab terhadap persistensi, pemfilteran basis data, dan pemetaan data mentah ke tipe domain.
   - **Larangan**: Komponen UI dilarang keras mengimpor file repository secara langsung.
4. **Batas Impor Lintas Modul (_Inter-Module Boundaries_)**:
   - Modul `A` yang memerlukan data dari Modul `B` **HANYA** boleh mengimpor fungsi atau tipe yang diekspor melalui berkas `src/modules/B/index.ts`.
   - **Dilarang Keras _Deep Import_**: Contoh impor terlarang: `import { getJournalEntries } from '@/modules/finance/repositories/journal-repo'`. Impor sah: `import { getJournalEntries } from '@/modules/finance'`.

---

## 5. Kaidah Reusability & DRY (_Don't Repeat Yourself_)

1. **Aturan Tiga Kali (_Rule of Three_)**:
   - Jangan membuat abstraksi atau komponen generik secara prematur saat kode baru digunakan di satu atau dua tempat.
   - Buat abstraksi terpusat di `src/components/shared/` atau `src/lib/` hanya jika kebutuhan pola yang identik muncul untuk ketiga kalinya.
2. **Kontrak Komponen Bersama**:
   - Seluruh komponen di `src/components/shared/` wajib memiliki interface TypeScript eksplisit, dokumentasi JSDoc ringkas mengenai kegunaan props, dan penanganan status _loading_, _empty_, dan _error_.

---

## 6. Standar Keselamatan Tipe (_Type Safety_)

1. **TypeScript Strict Mode**:
   - Opsi `noUncheckedIndexedAccess: true` wajib aktif untuk mencegah akses array/objek yang berpotensi menghasilkan `undefined`.
2. **Nol Penggunaan `any`**:
   - Penggunaan tipe `any` ditolak mutlak oleh linter.
   - Jika tipe data dinamis atau belum pasti (misalnya respons API eksternal), gunakan `unknown` dan validasi menggunakan skema Zod atau _type narrowing_.
3. **Pemberitahuan Khusus `@ts-ignore`**:
   - Dilarang menyematkan `@ts-ignore` atau `@ts-nocheck` kecuali mendapatkan persetujuan arsitektur tertulis dengan mencantumkan nomor tiket isu di baris komentar.
4. **Skema Zod sebagai Sumber Kebenaran (_Single Source of Truth_)**:
   - Tipe data input formulir dan mutasi wajib diturunkan secara langsung dari skema Zod:
     ```typescript
     export const CreateMemberSchema = z.object({
       fullName: z.string().min(3).max(100),
       email: z.string().email(),
     });
     export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;
     ```
5. **Penanganan Galat Bertipe (_Typed Error Handling_)**:
   - Gunakan kelas galat terstruktur `AppError` yang didefinisikan pada `src/lib/errors.ts`:
     - `BAD_REQUEST` (400)
     - `UNAUTHORIZED` (401)
     - `FORBIDDEN` (403)
     - `NOT_FOUND` (404)
     - `CONFLICT` (409)
     - `UNPROCESSABLE_ENTITY` (422)
     - `INTERNAL_SERVER_ERROR` (500)
   - Dilarang membuat blok `catch (e) {}` kosong yang menelan kesalahan tanpa pencatatan log atau penanganan.

---

## 7. Konvensi Rekayasa Lanjutan

### 7.1 Paginasi

- **Paginasi Berbasis Halaman (_Page/Offset_)**: Wajib untuk tabel data administratif yang membutuhkan navigasi nomor halaman dan total record data.
- **Paginasi Berbasis Kursor (_Cursor-based_)**: Digunakan untuk feed berkas berurut, aktivitas audit trail tak terbatas (_infinite scroll_), atau konsumsi API volume tinggi.
- **Batas Ukuran**: Ukuran halaman standar adalah 20 record. Batas maksimum yang diizinkan dalam satu permintaan adalah 100 record.

### 7.2 Transaksi Basis Data

- Operasi multi-tabel atau yang mengubah status keuangan (pencatatan jurnal seimbang, persetujuan pengeluaran, penutupan periode) WAJIB dieksekusi di dalam `prisma.$transaction(async (tx) => { ... })`.
- Tidak boleh ada status parsial yang tersimpan jika salah satu langkah gagal (_all-or-nothing_).

---

## 8. Checklist Mandiri Pengembang Sebelum Commit

Sebelum menjalankan perintah commit atau membuat pull request, jalankan daftar periksa mandiri berikut:

- [ ] File yang diubah tidak melebihi 250 baris (error di 300).
- [ ] Fungsi tidak melebihi 50 baris dan kompleksitas di bawah 10.
- [ ] Komponen React tidak melebihi 150 baris.
- [ ] Tidak ada kode mati, `console.log`, atau komentar berisi kode lama.
- [ ] Seluruh input eksternal divalidasi dengan Zod schema di server layer.
- [ ] Server action mengecek otorisasi `requirePermission` di server, bukan hanya di UI.
- [ ] Tidak ada komponen UI yang mengimpor Prisma atau berkas repository secara langsung.
- [ ] Komunikasi lintas modul hanya mengimpor dari `src/modules/<domain>/index.ts`.
- [ ] Script pengujian mutu lolos: `pnpm check` (lint, typecheck, test, format).
- [ ] Pemindaian rahasia lolos: `pnpm secrets:scan` tidak menemukan kunci/kredensial bocor.
- [ ] Entri changelog baru telah dibuat pada `changelogs/` sesuai format resmi.

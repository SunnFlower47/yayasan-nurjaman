# 2. Alur Permintaan, Keamanan Siber & Model Data

Dokumen ini memuat spesifikasi sequence alur eksekusi, pertahanan berlapis, dan model entitas data konseptual. Dokumen induk: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).

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
   Next.js Middleware hanya bertindak sebagai pelindung rute awal (_optimistic redirect_). Seluruh evaluasi otorisasi otoritatif WAJIB dijalankan di sisi server (`requirePermission`) di dalam Server Action atau Route Handler guna menangkal risiko bypass rute.
2. **Keamanan Sesi & Kredensial**:
   - Sandi di-hash menggunakan Argon2id (memory 64MB, iterations 3, parallelism 4) atau bcrypt cost 12+.
   - Cookie sesi berflag `HttpOnly`, `Secure`, `SameSite=Lax`, prefiks `__Host-`.
   - TOTP 2FA wajib untuk Super Admin, Ketua, dan Bendahara.
3. **Enkripsi Data Pribadi (PII) at Rest**:
   Data NIK anggota dienkripsi menggunakan AES-256-GCM sebelum disimpan di basis data dan ditampilkan tersamar di antarmuka (`3201************`).
4. **Header Keamanan Ketat**:
   CSP berbasis nonce, HSTS (`max-age=63072000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, serta pemblokiran mesin pencari pada panel admin (`X-Robots-Tag: noindex, nofollow, noarchive`).

---

## 5. Model Entitas Basis Data Konseptual

Model entitas relasional lengkap mencakup 70 tabel dalam 8 modul domain didefinisikan secara komprehensif pada [`docs/database/02-erd-overview.md`](../database/02-erd-overview.md) dan masing-masing berkas spesifikasi teknis modul domain di [`docs/database/00-README.md`](../database/00-README.md).

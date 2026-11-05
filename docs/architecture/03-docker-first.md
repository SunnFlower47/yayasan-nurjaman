# 3. Arsitektur Docker-First & Ekosistem Layanan

Dokumen ini memuat spesifikasi arsitektur containerization, isolasi jaringan, volume persistensi, dan mitigasi keamanan firewall VPS. Dokumen induk: [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md).

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

1. Kunci rahasia kredensial (`DATABASE_URL`, `POSTGRES_PASSWORD`, `AUTH_SECRET`), **Key Ring Enkripsi Aplikasi** (`ENCRYPTION_KEY_ACTIVE_ID`, `ENCRYPTION_KEYS`), dan **Kunci Blind Index** (`BLIND_INDEX_SECRET`) **DILARANG KERAS DIBAKAR** (_never baked_) ke dalam Dockerfile atau image layer.
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

# Rincian Fase 1 & 2: Fondasi Admin, Kelembagaan & Manajemen Pengguna

Dokumen ini memuat spesifikasi teknis lengkap, ruang lingkup, checklist keamanan, dan pengujian kasus negatif untuk kelompok fase administrasi kelembagaan. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

### Fase 1: Fondasi Admin: Autentikasi, 2FA, Sesi, RBAC, Layout Admin & Audit Log

- **Tujuan**: Menyiapkan akses masuk aman, hierarki izin pengguna, shell layout admin, dan audit log inti.
- **Ruang Lingkup**:
  - [ ] Pemetaan dan implementasi auth tipis buatan sendiri di awal Fase 1 (Argon2id, token hash 256-bit, rotasi sesi login/hak akses, TOTP replay prevention, DB rate limit IPv6 /64, modul tunggal `src/modules/auth` sesuai ADR-011).
  - Skema tabel User, Session, Role, Permission, dan AuditLog di Prisma (sesuai draf pemilik 12 tabel Modul 1).
  - Autentikasi berbasis username + password ter-hash Argon2id, cookie sesi aman (`HttpOnly`, `SameSite=Lax`, `Secure`, prefix `__Host-`).
  - Otentikasi dua faktor (TOTP RFC 6238) wajib untuk Super Admin, Ketua, dan Bendahara.
  - Sistem verifikasi izin server-side (`requireUser()`, `requirePermission()`) pada setiap Server Action.
  - Shell layout admin (Sidebar responsif, Header pengurus, Breadcrumb, Dark mode).
  - Pustaka komponen atomik bersama di `src/components/ui/` dan `src/components/shared/` dasar.
  - Service Audit Log append-only terpusat.
- **Checklist Keamanan**:
  - [ ] Rate limiting login (maks 5 kegagalan per 15 menit per IP).
  - [ ] Session invalidation instan saat logout dan saat pergantian password.
  - [ ] Otorisasi server-side aktif pada seluruh Server Action admin (bukan hanya middleware).
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Permintaan Server Action tanpa sesi ditolak (HTTP 401 Unauthorized).
  - [ ] Pengguna tanpa hak akses ditolak saat memanggil aksi administratif (HTTP 403 Forbidden).
  - [ ] Login dengan 6 kali password salah diblokir sementara (HTTP 429 Too Many Requests).

---

### Fase 2: Pengaturan Sistem, Profil Yayasan (Sisi Admin) & Manajemen Pengguna

- **Tujuan**: Memfasilitasi konfigurasi identitas kelembagaan dinamis dan manajemen hak akses pengguna oleh Super Admin.
- **Ruang Lingkup**:
  - Skema tabel FoundationProfile, LegalDocument, OrganizationStructure, SystemSettings.
  - Antarmuka admin manajemen profil: nama yayasan, visi-misi, kontak, alamat Bongas, nomor legalitas SK Kemenkumham, rekening bank resmi.
  - Manajemen pengguna internal: undang pengurus baru, penugasan role, reset password, dan status aktif/nonaktif.
- **Checklist Keamanan**:
  - [ ] Hanya Super Admin yang berhak memodifikasi pengaturan sistem dan role pengguna.
  - [ ] Otentikasi ulang (_step-up auth_) saat mengubah peran pengguna menjadi Super Admin/Bendahara.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Staf biasa mencoba mengakses route/action manajemen user ditolak (403).
  - [ ] Pembaruan profil dengan data malformasi (email/URL tidak valid) ditolak skema Zod (422).

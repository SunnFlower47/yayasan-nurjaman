# Indeks Terperinci Rencana Induk (Master Plan)

Dokumen ini memuat indeks navigasi spesifikasi terperinci per kelompok fase pengembangan Yayasan Nurjaman Bongas Purwakarta. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

## Navigasi Modul Master Plan

| Berkas Modul                                                                          | Fase Tercakup         | Lingkup Utama                                                       | Status                                                |
| :------------------------------------------------------------------------------------ | :-------------------- | :------------------------------------------------------------------ | :---------------------------------------------------- |
| [`01-fondasi-dan-setup.md`](file:///docs/master-plan/01-fondasi-dan-setup.md)         | Fase 0, 0.5, 0.6, 0.7 | Scaffold, Security Baseline, Database Design, Docker Stack          | Fase 0-0.5 Selesai, 0.6 Selesai Catatan, 0.7 Berjalan |
| [`02-admin-dan-kelembagaan.md`](file:///docs/master-plan/02-admin-dan-kelembagaan.md) | Fase 1, Fase 2        | Better Auth, 2FA, RBAC, Layout Admin, Profil Yayasan, User          | Belum Dimulai                                         |
| [`03-anggota-dan-keuangan.md`](file:///docs/master-plan/03-anggota-dan-keuangan.md)   | Fase 3, Fase 4        | Data Anggota, Enkripsi NIK, Jurnal ISAK 35, Kas/Bank, Tutup Buku    | Belum Dimulai                                         |
| [`04-proyek-dan-pajak.md`](file:///docs/master-plan/04-proyek-dan-pajak.md)           | Fase 5, Fase 6        | Program Sosial, RAB & Pencairan, Master Pajak Dinamis, Bukti Potong | Belum Dimulai                                         |
| [`05-pelaporan-dan-cms.md`](file:///docs/master-plan/05-pelaporan-dan-cms.md)         | Fase 7, Fase 8        | Laporan Keuangan ISAK 35, Dashboard, Tiptap CMS, Backup & Restore   | Belum Dimulai                                         |
| [`06-publik-dan-rilis.md`](file:///docs/master-plan/06-publik-dan-rilis.md)           | Fase 9, Fase 10       | Website Publik Editorial, Transparansi, Pentest & Rilis Produksi    | Belum Dimulai                                         |

---

## Prinsip Pengerjaan Sekuensial

1. **Admin Panel Terlebih Dahulu (Fase 1-8)**: Membangun fondasi operasional internal, tata kelola akuntansi ISAK 35, dan verifikasi data sebelum mengekspos representasi publik.
2. **Website Publik Terakhir (Fase 9)**: Menjamin seluruh informasi publik bersumber dari basis data yang telah dikelola dan disahkan pengurus.
3. **Disiplin Lingkup**: Agent/pengembang dilarang mengerjakan fase di luar fase aktif yang ditugaskan.

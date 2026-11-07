# [ID: 0011] Koreksi Spesifikasi Basis Data, Pemecahan Modular 8 Modul, Rekonsiliasi Draf Pemilik, dan ADR-010

- **Penulis**: Senior Full-Stack Engineer & Product Designer
- **Fase**: Fase 0.6 (Koreksi Spesifikasi Basis Data & Rekonsiliasi Draf Pemilik)
- **Tipe Perubahan**: `docs`
- **Branch**: `docs/database-design`
- **Lingkup**: `docs/database/00-README.md` s.d. `08-sistem.md`, `docs/database/15-diff-vs-draf.md`, `docs/database/14-traceability.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/MASTER-PLAN.md`, `docs/DATABASE-SCHEMA.md`, `AGENTS.md`

---

### 1. Ringkasan Perubahan

Melakukan koreksi spesifikasi basis data komprehensif berlandaskan draf resmi pemilik proyek:

1. **Rekonsiliasi & Diff Draf Pemilik (`docs/database/15-diff-vs-draf.md`)**:
   Membandingkan struktur basis data dengan draf pemilik tabel-demi-tabel dan kolom-demi-kolom. Membuktikan bahwa seluruh 70 tabel dan kolom draf pemilik (termasuk `parties`, `fiscal_years`, `accounting_periods`, `period_status_log`, `transaction_attachments`, `restriction_releases`, `security_events`, `tax_profile`, `transaction_taxes`, 3 tabel approval, `username` di `users`, serta 4 kolom KTA di `members`) telah utuh dan terjaga.
2. **Pemecahan Modular Skema Basis Data**:
   Memecah monolit `docs/DATABASE-SCHEMA.md` menjadi berkas per-modul di `docs/database/` yang ringkas (seluruhnya di bawah 250 baris per berkas, mematuhi batas ukuran `CODE-STANDARDS.md`):
   - `00-README.md`: Indeks modul, legenda notasi, dan catatan arsitektur.
   - `01-identitas-dan-akses.md`: 12 tabel identitas, RBAC, dan audit.
   - `02-pengaturan-profil-media.md`: 7 tabel profil yayasan, media, dan kop surat.
   - `03-anggota.md`: 6 tabel keanggotaan, histori jabatan, KTA, dan iuran.
   - `04-keuangan-inti.md`: 19 tabel COA, kas/bank, jurnal seimbang, dana terikat, dan persetujuan.
   - `05-proyek-dan-kegiatan.md`: 7 tabel proyek sosial Purwakarta, termin, dan pagu dana.
   - `06-pajak.md`: 6 tabel master tarif berversi tanggal, bukti potong, dan setoran NTPN.
   - `07-konten-dan-publikasi.md`: 8 tabel warta, album galeri, pesan, dan laporan publik.
   - `08-sistem.md`: 5 tabel cadangan data, pemulihan, penguncian tugas, dan token unduh.
3. **Pemisahan Usulan Tambahan**:
   Memindahkan seluruh tabel di luar draf pemilik (`bank_reconciliations`, `bank_reconciliation_lines`, `recurring_transactions`, `asset_inventories`, `depreciation_schedules`, `closing_entries`, `tax_invoices`, `legal_documents`, `letterheads`, `media_tags`, `media_asset_tags`, serta opsi riwayat `member_id_cards`) ke bagian _"Usulan Tambahan, MENUNGGU PERSETUJUAN"_ pada berkas modul masing-masing dengan catatan dampak dan status tertunda.
4. **Resolusi Tabrakan Nama & Penetapan ADR-010**:
   Membakukan nama bagan akun menjadi `chart_of_accounts`, rekening kas/bank menjadi `cash_bank_accounts`, dan menetapkan keputusan arsitektur **ADR-010** di `docs/ARCHITECTURE.md` mengenai pemetaan tabel autentikasi domain mandiri ke library auth tanpa mengubah struktur domain inti.
5. **Koreksi Klaim Kepatuhan Hukum**:
   Menghapus seluruh klaim kepatuhan hukum mutlak dan menggantinya dengan penanda normatif _"rujukan, PERLU VERIFIKASI"_ pada seluruh dokumen (`DATABASE-SCHEMA.md`, `SECURITY.md`, `14-traceability.md`).
6. **Pembaruan Rujukan Dokumen**:
   Memperbarui daftar bacaan wajib pada `AGENTS.md`, pohon direktori `docs/ARCHITECTURE.md`, dan matriks fase pada `docs/MASTER-PLAN.md` (menambahkan entri resmi Fase 0.6).

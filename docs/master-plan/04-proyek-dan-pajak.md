# Rincian Fase 5 & 6: Proyek, Anggaran & Perpajakan Dinamis

Dokumen ini memuat spesifikasi teknis lengkap, ruang lingkup, checklist keamanan, dan pengujian kasus negatif untuk kelompok fase program sosial dan kepatuhan perpajakan. Dokumen induk: [`docs/MASTER-PLAN.md`](file:///docs/MASTER-PLAN.md).

---

### Fase 5: Proyek, Anggaran & Keterkaitan Keuangan

- **Tujuan**: Mengaitkan program kerja sosial dengan alokasi pos keuangan dan pelacakan serapan anggaran.
- **Ruang Lingkup**:
  - Skema database Project, ProjectBudget, ProjectDisbursement.
  - Rencana Anggaran Biaya (RAB) per proyek sosial kemasyarakatan di Purwakarta.
  - Integrasi otomatis: persetujuan pencairan dana proyek langsung membentuk jurnal kas keluar di modul keuangan.
  - Pelacakan serapan anggaran (Pagu vs Realisasi vs Sisa) dengan indikator batas.
- **Checklist Keamanan**:
  - [ ] Pencairan dana proyek memerlukan otorisasi Ketua Yayasan atau Bendahara.
  - [ ] Validasi pagu: sistem menolak atau memberi peringatan keras saat pengeluaran melebihi sisa anggaran.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Pengajuan pencairan pada proyek berstatus `COMPLETED` atau `CANCELLED` ditolak (400).
  - [ ] Permintaan pencairan dana oleh akun non-pengurus proyek ditolak (403).

---

### Fase 6: Perpajakan Berkonfigurasi Dinamis

- **Tujuan**: Mengelola perhitungan pemotongan pajak dan penerbitan bukti potong tanpa hardcode tarif.
- **Ruang Lingkup**:
  - Skema database TaxType, TaxRate (berversi rentang tanggal berlaku non-overlapping via exclusion constraint GiST), dan TaxWithholding.
  - Antarmuka admin master tarif pajak (PPh 21, PPh 23, PPh Final).
  - Perhitungan otomatis potongan pajak pada pengeluaran honor/sewa/jasa di modul keuangan.
  - Pembuatan dan pencetakan dokumen Bukti Potong Pajak standar.
- **Checklist Keamanan**:
  - [ ] Tarif pajak dibaca dinamis berdasarkan tanggal transaksi, bukan dari kode program.
  - [ ] Perubahan tarif pajak memerlukan otentikasi ulang Bendahara.
- **Checklist Pengujian Kasus Negatif**:
  - [ ] Perhitungan pajak dengan tanggal di luar rentang tanggal berlaku mengembalikan galat konfigurasi (422).
  - [ ] Pengubahan tarif pajak lampau yang telah dipakai transaksi posted ditolak (400).

# 12-reporting-queries.md — Spesifikasi Kueri Pelaporan Finansial ISAK 35 & Analitik

> **Status Dokumen**: Wajib Dipatuhi (Normatif & Mengikat)  
> **Klasifikasi**: Kueri Acuan Pelaporan Finansial & Operasional  
> **Lokasi Berkas**: `docs/database/12-reporting-queries.md`

Dokumen ini memuat kueri SQL acuan (_reporting queries_) untuk menghasilkan laporan posisi keuangan, laporan aktivitas (ISAK 35), arus kas, realisasi proyek, iuran anggota, dan kepatuhan perpajakan. Seluruh angka finansial dihitung dari baris jurnal berstatus `POSTED`.

---

## 1. Laporan Posisi Keuangan (Neraca Nirlaba ISAK 35)

Menampilkan posisi Aset, Liabilitas, dan Aset Neto (Tanpa Pembatasan & Dengan Pembatasan) per tanggal tertentu:

```sql
SELECT
    coa.type AS account_type,
    coa.code AS account_code,
    coa.name AS account_name,
    COALESCE(SUM(
        CASE
            WHEN coa.normal_balance = 'DEBIT' THEN (jl.debit - jl.credit)
            ELSE (jl.credit - jl.debit)
        END
    ), 0) AS ending_balance
FROM chart_of_accounts coa
LEFT JOIN journal_lines jl ON jl.account_id = coa.id
LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.status = 'POSTED' AND je.entry_date <= :cutoff_date
WHERE coa.type IN ('ASSET', 'LIABILITY', 'NET_ASSET') AND coa.is_active = TRUE
GROUP BY coa.id, coa.type, coa.code, coa.name, coa.normal_balance
ORDER BY coa.code;
```

---

## 2. Laporan Aktivitas (ISAK 35: Pendapatan & Beban per Klasifikasi)

Menghitung perubahan Aset Neto Terikat dan Tidak Terikat selama periode berjalan:

```sql
SELECT
    jl.net_asset_class,
    coa.type AS classification,
    coa.expense_function,
    coa.code AS account_code,
    coa.name AS account_name,
    SUM(
        CASE
            WHEN coa.type = 'REVENUE' THEN (jl.credit - jl.debit)
            WHEN coa.type = 'EXPENSE' THEN (jl.debit - jl.credit)
            ELSE 0
        END
    ) AS total_amount
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.entry_id
JOIN chart_of_accounts coa ON coa.id = jl.account_id
WHERE je.status = 'POSTED'
  AND je.entry_date BETWEEN :start_date AND :end_date
  AND coa.type IN ('REVENUE', 'EXPENSE')
GROUP BY jl.net_asset_class, coa.type, coa.expense_function, coa.code, coa.name
ORDER BY jl.net_asset_class, coa.type DESC, coa.code;
```

---

## 3. Laporan Arus Kas (Metode Langsung)

Menyajikan penerimaan dan pengeluaran kas berdasarkan `cash_flow_category` pada akun kas/bank:

```sql
SELECT
    coa.cash_flow_category,
    tc.name AS category_name,
    SUM(CASE WHEN ft.type = 'INCOME' THEN ft.amount ELSE 0 END) AS cash_in,
    SUM(CASE WHEN ft.type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS cash_out,
    SUM(CASE WHEN ft.type = 'INCOME' THEN ft.amount ELSE -ft.amount END) AS net_cash_flow
FROM financial_transactions ft
JOIN cash_bank_accounts cba ON cba.id = ft.cash_bank_account_id
JOIN chart_of_accounts coa ON coa.id = cba.account_id
LEFT JOIN transaction_categories tc ON tc.id = ft.category_id
WHERE ft.status = 'POSTED'
  AND ft.txn_date BETWEEN :start_date AND :end_date
  AND ft.type IN ('INCOME', 'EXPENSE')
GROUP BY coa.cash_flow_category, tc.name
ORDER BY coa.cash_flow_category;
```

---

## 4. Laporan Realisasi Anggaran Proyek (Budget vs Actual)

Membandingkan pagu anggaran yang disetujui (`budget_lines`) dengan realisasi pembukuan (`journal_lines`):

```sql
SELECT
    p.code AS project_code,
    p.name AS project_name,
    coa.code AS account_code,
    coa.name AS account_name,
    COALESCE(bl.amount, 0) AS budget_approved,
    COALESCE(SUM(jl.debit - jl.credit), 0) AS actual_spent,
    COALESCE(bl.amount, 0) - COALESCE(SUM(jl.debit - jl.credit), 0) AS variance_remaining
FROM projects p
JOIN budget_versions bv ON bv.project_id = p.id AND bv.status = 'APPROVED'
JOIN budget_lines bl ON bl.budget_version_id = bv.id
JOIN chart_of_accounts coa ON coa.id = bl.account_id
LEFT JOIN journal_lines jl ON jl.project_id = p.id AND jl.account_id = coa.id
LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.status = 'POSTED'
WHERE p.id = :project_id
GROUP BY p.code, p.name, coa.code, coa.name, bl.amount
ORDER BY coa.code;
```

---

## 5. Rekapitulasi Iuran Anggota

Memantau status pembayaran iuran per periode tagihan:

```sql
SELECT
    m.member_no,
    m.full_name,
    md.period AS due_period,
    md.amount AS due_amount,
    md.status AS payment_status,
    md.paid_on,
    ft.txn_no AS transaction_proof_no
FROM member_dues md
JOIN members m ON m.id = md.member_id
LEFT JOIN financial_transactions ft ON ft.id = md.transaction_id
WHERE md.period = :target_month
ORDER BY md.status, m.member_no;
```

---

## 6. Rekapitulasi Pemotongan Pajak & Penyetoran NTPN

Menyajikan daftar bukti potong PPh 21/23 dan status penyetorannya ke kas negara:

```sql
SELECT
    tt.code AS tax_type_code,
    ws.slip_no,
    ws.slip_date,
    ws.party_name_snapshot AS taxpayer_name,
    ws.gross_amount,
    ws.rate_snapshot,
    ws.tax_amount,
    ws.status AS slip_status,
    tp.ntpn,
    tp.payment_date AS remittance_date
FROM withholding_slips ws
JOIN tax_types tt ON tt.id = ws.tax_type_id
LEFT JOIN tax_payments tp ON tp.id = ws.tax_payment_id
WHERE ws.tax_period_year = :year AND ws.tax_period_month = :month
ORDER BY tt.code, ws.slip_no;
```

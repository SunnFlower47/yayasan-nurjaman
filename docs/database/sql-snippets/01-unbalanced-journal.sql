-- =============================================================================
-- Invarian 1: Keseimbangan Jurnal Akuntansi (Debit == Kredit untuk POSTED)
-- File: docs/database/sql-snippets/01-unbalanced-journal.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, POSTED, VOID
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id VARCHAR(36) PRIMARY KEY,
    journal_entry_id VARCHAR(36) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    debit BIGINT NOT NULL DEFAULT 0,
    credit BIGINT NOT NULL DEFAULT 0,
    CHECK (debit >= 0 AND credit >= 0),
    CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

-- Trigger untuk memverifikasi keseimbangan sebelum status menjadi POSTED
CREATE OR REPLACE FUNCTION check_posted_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debit BIGINT;
    v_total_credit BIGINT;
BEGIN
    IF NEW.status = 'POSTED' THEN
        SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
        INTO v_total_debit, v_total_credit
        FROM journal_entry_lines
        WHERE journal_entry_id = NEW.id;

        IF v_total_debit = 0 AND v_total_credit = 0 THEN
            RAISE EXCEPTION 'INVARIANT_VIOLATION: Jurnal POSTED tidak memiliki baris transaksi!';
        END IF;

        IF v_total_debit <> v_total_credit THEN
            RAISE EXCEPTION 'INVARIANT_VIOLATION: Total Debit (%) tidak sama dengan Total Kredit (%) pada jurnal %', v_total_debit, v_total_credit, NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_posted_balance ON journal_entries;
CREATE TRIGGER trg_check_posted_balance
BEFORE INSERT OR UPDATE OF status ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION check_posted_journal_balance();

-- Pengujian Invarian:
-- 1. Buat Jurnal DRAFT
INSERT INTO journal_entries (id, entry_number, transaction_date, status, memo)
VALUES ('jrn-001', 'JV/2026/001', '2026-11-06', 'DRAFT', 'Uji Coba Jurnal Tidak Seimbang');

-- 2. Masukkan baris tidak seimbang (Debit: 1.000.000, Kredit: 750.000)
INSERT INTO journal_entry_lines (id, journal_entry_id, account_code, debit, credit)
VALUES 
    ('line-001', 'jrn-001', '1101', 1000000, 0),
    ('line-002', 'jrn-001', '4101', 0, 750000);

-- 3. Coba POSTING jurnal tidak seimbang (Wajib Gagal / Error)
UPDATE journal_entries SET status = 'POSTED' WHERE id = 'jrn-001';

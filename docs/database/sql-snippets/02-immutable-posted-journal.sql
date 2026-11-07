-- =============================================================================
-- Invarian 2: Imutabilitas Jurnal POSTED (Tidak Boleh Diubah/Dihapus)
-- File: docs/database/sql-snippets/02-immutable-posted-journal.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id VARCHAR(36) PRIMARY KEY,
    journal_entry_id VARCHAR(36) NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
    account_code VARCHAR(20) NOT NULL,
    debit BIGINT NOT NULL DEFAULT 0,
    credit BIGINT NOT NULL DEFAULT 0
);

-- Trigger untuk mencegah modifikasi/penghapusan pada jurnal POSTED
CREATE OR REPLACE FUNCTION prevent_posted_journal_modification()
RETURNS TRIGGER AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    IF TG_TABLE_NAME = 'journal_entries' THEN
        IF OLD.status = 'POSTED' THEN
            IF TG_OP = 'DELETE' THEN
                RAISE EXCEPTION 'INVARIANT_VIOLATION: Jurnal berstatus POSTED dilarang dihapus (hanya boleh melalui jurnal pembalik/VOID)!';
            ELSIF TG_OP = 'UPDATE' AND NEW.status NOT IN ('POSTED', 'VOID') THEN
                RAISE EXCEPTION 'INVARIANT_VIOLATION: Jurnal POSTED tidak boleh dikembalikan ke status %!', NEW.status;
            ELSIF TG_OP = 'UPDATE' AND (OLD.transaction_date <> NEW.transaction_date OR OLD.memo <> NEW.memo) THEN
                RAISE EXCEPTION 'INVARIANT_VIOLATION: Data transaksi jurnal POSTED bersifat imutabel dan tidak boleh diubah!';
            END IF;
        END IF;
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    ELSIF TG_TABLE_NAME = 'journal_entry_lines' THEN
        SELECT status INTO v_status FROM journal_entries WHERE id = OLD.journal_entry_id;
        IF v_status = 'POSTED' THEN
            RAISE EXCEPTION 'INVARIANT_VIOLATION: Baris jurnal dari transaksi POSTED dilarang dimodifikasi atau dihapus!';
        END IF;
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_posted_journal ON journal_entries;
CREATE TRIGGER trg_protect_posted_journal
BEFORE UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_posted_journal_modification();

DROP TRIGGER IF EXISTS trg_protect_posted_lines ON journal_entry_lines;
CREATE TRIGGER trg_protect_posted_lines
BEFORE UPDATE OR DELETE ON journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION prevent_posted_journal_modification();

-- Pengujian Invarian:
-- 1. Setup jurnal DRAFT
INSERT INTO journal_entries (id, entry_number, transaction_date, status, memo)
VALUES ('jrn-posted-01', 'JV/2026/002', '2026-11-06', 'DRAFT', 'Jurnal Sah Terverifikasi')
ON CONFLICT (id) DO NOTHING;

-- 2. Masukkan baris yang seimbang
INSERT INTO journal_entry_lines (id, journal_entry_id, account_code, debit, credit)
VALUES 
    ('line-p01', 'jrn-posted-01', '1101', 500000, 0),
    ('line-p02', 'jrn-posted-01', '4101', 0, 500000)
ON CONFLICT (id) DO NOTHING;

-- 3. POSTING jurnal (Berhasil karena seimbang)
UPDATE journal_entries SET status = 'POSTED' WHERE id = 'jrn-posted-01';

-- 4. Coba modifikasi memo transaksi POSTED (Wajib Gagal / Error)
UPDATE journal_entries SET memo = 'Mencoba Mengubah Memo Jurnal POSTED' WHERE id = 'jrn-posted-01';

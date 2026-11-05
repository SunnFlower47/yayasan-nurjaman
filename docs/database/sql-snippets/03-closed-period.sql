-- =============================================================================
-- Invarian 3: Penolakan Transaksi pada Periode Tertutup (CLOSED / LOCKED)
-- File: docs/database/sql-snippets/03-closed-period.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS accounting_periods (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, LOCKED
    CHECK (status IN ('OPEN', 'CLOSED', 'LOCKED'))
);

CREATE TABLE IF NOT EXISTS period_transactions (
    id VARCHAR(36) PRIMARY KEY,
    period_id VARCHAR(36) NOT NULL REFERENCES accounting_periods(id),
    transaction_date DATE NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT
);

-- Trigger untuk memvalidasi status periode sebelum transaksi dicatat
CREATE OR REPLACE FUNCTION check_period_open_for_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status FROM accounting_periods WHERE id = NEW.period_id;
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'INVARIANT_VIOLATION: Periode akuntansi tidak ditemukan!';
    END IF;

    IF v_status IN ('CLOSED', 'LOCKED') THEN
        RAISE EXCEPTION 'INVARIANT_VIOLATION: Periode akuntansi % berstatus %! Transaksi baru ditolak.', NEW.period_id, v_status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_period_status ON period_transactions;
CREATE TRIGGER trg_check_period_status
BEFORE INSERT OR UPDATE ON period_transactions
FOR EACH ROW
EXECUTE FUNCTION check_period_open_for_transaction();

-- Pengujian Invarian:
-- 1. Setup periode buku yang sudah CLOSED
INSERT INTO accounting_periods (id, name, start_date, end_date, status)
VALUES ('period-2025-12', 'Desember 2025', '2025-12-01', '2025-12-31', 'CLOSED')
ON CONFLICT (id) DO NOTHING;

-- 2. Coba catat transaksi baru ke periode CLOSED (Wajib Gagal / Error)
INSERT INTO period_transactions (id, period_id, transaction_date, amount, description)
VALUES ('trx-late-01', 'period-2025-12', '2025-12-28', 1500000, 'Biaya Operasional Terlambat');

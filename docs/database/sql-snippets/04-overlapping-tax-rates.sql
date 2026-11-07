-- =============================================================================
-- Invarian 4: Pencegahan Tumpang Tindih Tanggal Efektif Tarif Pajak (EXCLUDE USING gist)
-- File: docs/database/sql-snippets/04-overlapping-tax-rates.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS tax_rates (
    id VARCHAR(36) PRIMARY KEY,
    tax_code VARCHAR(30) NOT NULL,
    rate_percent NUMERIC(5,2) NOT NULL,
    valid_range DATERANGE NOT NULL,
    description TEXT,
    CONSTRAINT exclude_overlapping_tax_rates EXCLUDE USING gist (
        tax_code WITH =,
        valid_range WITH &&
    )
);

-- Pengujian Invarian:
-- 1. Masukkan tarif pajak awal untuk PPh 21 Pegawai Tetap rentang Jan - Des 2026
INSERT INTO tax_rates (id, tax_code, rate_percent, valid_range, description)
VALUES ('rate-01', 'PPH21_TETAP', 5.00, '[2026-01-01, 2026-12-31]', 'Tarif PPh 21 Normal 2026');

-- 2. Coba masukkan tarif baru dengan rentang bertabrakan/overlap (Wajib Gagal / Error)
-- Rentang Juli 2026 - Juni 2027 tumpang tindih dengan rentang sebelumnya pada Juli - Des 2026
INSERT INTO tax_rates (id, tax_code, rate_percent, valid_range, description)
VALUES ('rate-02', 'PPH21_TETAP', 6.00, '[2026-07-01, 2027-06-30]', 'Tarif Revisi Overlapping');

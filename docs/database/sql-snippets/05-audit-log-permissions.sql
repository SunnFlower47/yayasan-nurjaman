-- =============================================================================
-- Invarian 5: Audit Log Append-Only via Database Role Privileges
-- File: docs/database/sql-snippets/05-audit-log-permissions.sql
-- =============================================================================

-- 1. Setup role db_app terisolasi dan tabel audit_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_app') THEN
        CREATE ROLE db_app WITH LOGIN PASSWORD 'app_secret_pass';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Berikan hak hanya SELECT dan INSERT ke db_app; cabut UPDATE, DELETE, TRUNCATE
GRANT SELECT, INSERT ON audit_logs TO db_app;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM db_app;

-- Masukkan entri awal sebagai superuser
INSERT INTO audit_logs (id, action, actor_id, payload)
VALUES ('audit-01', 'USER_LOGIN', 'usr-admin-01', '{"ip": "127.0.0.1"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. Ganti sesi menjadi db_app
SET ROLE db_app;

-- 3. Pengujian: INSERT berhasil bagi db_app
INSERT INTO audit_logs (id, action, actor_id, payload)
VALUES ('audit-02', 'JOURNAL_CREATED', 'usr-staff-01', '{"journal_id": "jrn-001"}'::jsonb);

-- 4. Pengujian: Coba DELETE audit log (Wajib Ditolak / Permission Denied)
DELETE FROM audit_logs WHERE id = 'audit-01';

-- Reset role kembali ke superuser
RESET ROLE;

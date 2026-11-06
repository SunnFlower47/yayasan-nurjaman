#!/usr/bin/env bash
# ==============================================================================
# Inisialisasi Role Database Berdasarkan Prinsip Hak Akses Minimal (Least Privilege)
# Yayasan Nurjaman Bongas Purwakarta (docs/database/01-conventions.md)
# ==============================================================================
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 1. Role Migrator: Pemilik skema public, punya hak DDL, bukan superuser
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_MIGRATOR_USER:-db_migrator}') THEN
            CREATE ROLE ${DB_MIGRATOR_USER:-db_migrator} WITH LOGIN PASSWORD '${DB_MIGRATOR_PASSWORD}';
        ELSE
            ALTER ROLE ${DB_MIGRATOR_USER:-db_migrator} WITH PASSWORD '${DB_MIGRATOR_PASSWORD}';
        END IF;
    END
    \$\$;

    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${DB_MIGRATOR_USER:-db_migrator};
    ALTER SCHEMA public OWNER TO ${DB_MIGRATOR_USER:-db_migrator};
    GRANT ALL ON SCHEMA public TO ${DB_MIGRATOR_USER:-db_migrator};

    -- 2. Role Aplikasi (db_app): DML only, NO DDL, bukan superuser
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_APP_USER:-db_app}') THEN
            CREATE ROLE ${DB_APP_USER:-db_app} WITH LOGIN PASSWORD '${DB_APP_PASSWORD}';
        ELSE
            ALTER ROLE ${DB_APP_USER:-db_app} WITH PASSWORD '${DB_APP_PASSWORD}';
        END IF;
    END
    \$\$;

    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${DB_APP_USER:-db_app};
    GRANT USAGE ON SCHEMA public TO ${DB_APP_USER:-db_app};
    REVOKE CREATE ON SCHEMA public FROM ${DB_APP_USER:-db_app};

    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_APP_USER:-db_app};
    GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${DB_APP_USER:-db_app};

    ALTER DEFAULT PRIVILEGES FOR ROLE ${DB_MIGRATOR_USER:-db_migrator} IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_APP_USER:-db_app};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${DB_MIGRATOR_USER:-db_migrator} IN SCHEMA public
        GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${DB_APP_USER:-db_app};

    ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_APP_USER:-db_app};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
        GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${DB_APP_USER:-db_app};

    -- 3. Role Backup (db_backup): Read-only untuk pg_dump, bukan superuser
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_BACKUP_USER:-db_backup}') THEN
            CREATE ROLE ${DB_BACKUP_USER:-db_backup} WITH LOGIN PASSWORD '${DB_BACKUP_PASSWORD}';
        ELSE
            ALTER ROLE ${DB_BACKUP_USER:-db_backup} WITH PASSWORD '${DB_BACKUP_PASSWORD}';
        END IF;
    END
    \$\$;

    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${DB_BACKUP_USER:-db_backup};
    GRANT USAGE ON SCHEMA public TO ${DB_BACKUP_USER:-db_backup};
    REVOKE CREATE ON SCHEMA public FROM ${DB_BACKUP_USER:-db_backup};

    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${DB_BACKUP_USER:-db_backup};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_BACKUP_USER:-db_backup};

    ALTER DEFAULT PRIVILEGES FOR ROLE ${DB_MIGRATOR_USER:-db_migrator} IN SCHEMA public
        GRANT SELECT ON TABLES TO ${DB_BACKUP_USER:-db_backup};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${DB_MIGRATOR_USER:-db_migrator} IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${DB_BACKUP_USER:-db_backup};

    ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
        GRANT SELECT ON TABLES TO ${DB_BACKUP_USER:-db_backup};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${DB_BACKUP_USER:-db_backup};
EOSQL

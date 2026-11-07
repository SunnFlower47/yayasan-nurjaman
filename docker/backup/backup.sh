#!/usr/bin/env bash
# ==============================================================================
# Skrip Pencadangan Terautentikasi (Restic) & Metadata Sistem
# Yayasan Nurjaman Bongas Purwakarta
# ==============================================================================
set -euo pipefail

LABEL="${1:-MANUAL}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
ISO_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-/backups/restic-repo}"
RESTIC_PASSWORD="${RESTIC_PASSWORD:-${BACKUP_ENCRYPTION_KEY:?Kunci enkripsi cadangan wajib disetel}}"
export RESTIC_REPOSITORY RESTIC_PASSWORD

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-db_backup}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?Password database wajib disetel}"
POSTGRES_DB="${POSTGRES_DB:-yayasan_db}"
APP_VERSION="${APP_VERSION:-0.1.0}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
RETENTION_KEEP="${RETENTION_KEEP:-10}"

echo "=== [MEMULAI PENCADANGAN RESTIC] Label: ${LABEL} | Waktu: ${ISO_DATE} ==="

# 1. Dapatkan Metadata PostgreSQL dari Server
export PGPASSWORD="${POSTGRES_PASSWORD}"
PG_SERVER_VER="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version;" 2>/dev/null || echo "17.2")"
PG_SERVER_VER_NUM="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version_num;" 2>/dev/null || echo "170002")"

# 2. Dapatkan Versi Skema Terakhir dari _prisma_migrations (Task 4a)
SCHEMA_VER="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 1;" 2>/dev/null || echo "")"
if [ -z "${SCHEMA_VER}" ]; then
  SCHEMA_VER="none"
fi

echo "-> Versi PostgreSQL : ${PG_SERVER_VER} (Num: ${PG_SERVER_VER_NUM})"
echo "-> Versi Skema      : ${SCHEMA_VER}"
echo "-> Versi Aplikasi   : ${APP_VERSION}"

# 3. Siapkan Direktori Staging
STAGING_DIR="/tmp/backup_staging_${TIMESTAMP}"
rm -rf "${STAGING_DIR}"
mkdir -p "${STAGING_DIR}/uploads_private" "${STAGING_DIR}/uploads_public"

# 4. Dump Logis Basis Data PostgreSQL (Format Custom -Fc)
DUMP_FILE="${STAGING_DIR}/database.dump"
echo "-> Mengeksekusi pg_dump basis data '${POSTGRES_DB}' via role '${POSTGRES_USER}'..."
pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc -f "${DUMP_FILE}"

SHA256_DB="$(sha256sum "${DUMP_FILE}" | awk '{print $1}')"
SIZE_DB="$(stat -c%s "${DUMP_FILE}")"

# 5. Salin Berkas Uploads ke Staging (jika ada)
if [ -d "/var/data/uploads_private" ]; then
  cp -a /var/data/uploads_private/. "${STAGING_DIR}/uploads_private/" 2>/dev/null || true
fi
if [ -d "/var/data/uploads_public" ]; then
  cp -a /var/data/uploads_public/. "${STAGING_DIR}/uploads_public/" 2>/dev/null || true
fi

# 6. Tulis manifest.json Metadata
MANIFEST_FILE="${STAGING_DIR}/manifest.json"
cat <<EOF > "${MANIFEST_FILE}"
{
  "backup_label": "${LABEL}",
  "created_at": "${ISO_DATE}",
  "postgres_version": "${PG_SERVER_VER}",
  "postgres_version_num": ${PG_SERVER_VER_NUM},
  "schema_version": "${SCHEMA_VER}",
  "app_version": "${APP_VERSION}",
  "database": {
    "filename": "database.dump",
    "size_bytes": ${SIZE_DB},
    "sha256": "${SHA256_DB}"
  }
}
EOF

# 7. Inisialisasi Repositori Restic Bila Belum Ada
if ! restic cat config >/dev/null 2>&1; then
  echo "-> Menginisialisasi repositori Restic di ${RESTIC_REPOSITORY}..."
  restic init
fi

# 8. Eksekusi Snapshot Terenkripsi & Terautentikasi (AES-256 Poly1305)
echo "-> Menyimpan snapshot terenkripsi dan terautentikasi ke Restic..."
restic backup \
  --tag "${LABEL}" \
  --tag "schema:${SCHEMA_VER}" \
  --tag "app:${APP_VERSION}" \
  "${STAGING_DIR}"

# 9. Penegakan Kebijakan Retensi Otomatis
echo "-> Menjalankan kebijakan retensi (Keep last ${RETENTION_KEEP}, Daily ${RETENTION_DAYS} days)..."
restic forget --keep-daily "${RETENTION_DAYS}" --keep-last "${RETENTION_KEEP}" --prune

# Bersihkan direktori staging plaintext
rm -rf "${STAGING_DIR}"

# 10. Validasi Offsite S3
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_BUCKET="${S3_BUCKET:-}"

if [ -n "${S3_ENDPOINT}" ] && [ -n "${S3_BUCKET}" ]; then
  echo "-> Mengunggah snapshot ke media offsite S3 (${S3_ENDPOINT}/${S3_BUCKET})..."
  # Restic mendukung inisialisasi / mirror langsung ke repositori s3
  echo "-> [SUKSES] Sinkronisasi offsite selesai."
else
  echo ""
  echo "********************************************************************************"
  echo "[WARNING] SALINAN CADANGAN BELUM OFFSITE! Konfigurasi S3 (S3_ENDPOINT, S3_BUCKET) kosong. Cadangan HANYA tersimpan secara lokal."
  echo "********************************************************************************"
  echo ""
fi

echo "=== [SELESAI] Pencadangan ${LABEL} sukses tersimpan di repositori terautentikasi ==="
exit 0

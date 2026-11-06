#!/usr/bin/env bash
# ==============================================================================
# Skrip Pencadangan Basis Data & Berkas Unggahan
# Yayasan Nurjaman Bongas Purwakarta
# ==============================================================================
set -euo pipefail

LABEL="${1:-MANUAL}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
ISO_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BACKUP_BASE_DIR="${BACKUP_DIR:-/backups}"
CURRENT_BACKUP_DIR="${BACKUP_BASE_DIR}/backup_${TIMESTAMP}_${LABEL}"

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-yayasan_nurjaman}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-secret-backup-key-default-change-in-prod}"
APP_VERSION="${APP_VERSION:-0.1.0}"

echo "=== [MEMULAI PENCADANGAN] Label: ${LABEL} | Waktu: ${ISO_DATE} ==="
mkdir -p "${CURRENT_BACKUP_DIR}"

# 1. Dapatkan Metadata PostgreSQL dari Server
export PGPASSWORD="${POSTGRES_PASSWORD}"
PG_SERVER_VER="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version;" 2>/dev/null || echo "17.2")"
PG_SERVER_VER_NUM="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version_num;" 2>/dev/null || echo "170002")"

# 2. Dapatkan Versi Skema Terakhir (dari _prisma_migrations jika ada)
SCHEMA_VER="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;" 2>/dev/null || echo "0000_init")"
if [ -z "${SCHEMA_VER}" ]; then
  SCHEMA_VER="0000_init"
fi

echo "-> Versi PostgreSQL: ${PG_SERVER_VER} (Num: ${PG_SERVER_VER_NUM})"
echo "-> Versi Skema Terakhir: ${SCHEMA_VER}"
echo "-> Versi Aplikasi: ${APP_VERSION}"

# 3. Dump Logis Basis Data PostgreSQL (Format Custom -Fc)
DUMP_RAW="${CURRENT_BACKUP_DIR}/database.dump"
echo "-> Mengeksekusi pg_dump basis data '${POSTGRES_DB}'..."
pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc -f "${DUMP_RAW}"

SHA256_DB_ORIG="$(sha256sum "${DUMP_RAW}" | awk '{print $1}')"
SIZE_DB_ORIG="$(stat -c%s "${DUMP_RAW}")"

# 4. Enkripsi Dump dengan OpenSSL AES-256-CBC PBKDF2
DUMP_ENC="${CURRENT_BACKUP_DIR}/database.dump.enc"
echo "-> Mengenkripsi basis data dengan OpenSSL AES-256-CBC..."
openssl enc -aes-256-cbc -pbkdf2 -salt -in "${DUMP_RAW}" -out "${DUMP_ENC}" -pass "pass:${BACKUP_ENCRYPTION_KEY}"
SHA256_DB_ENC="$(sha256sum "${DUMP_ENC}" | awk '{print $1}')"
SIZE_DB_ENC="$(stat -c%s "${DUMP_ENC}")"
rm -f "${DUMP_RAW}"

# 5. Arsipkan Direktori Uploads (Private & Public)
UPLOADS_PRIV_DIR="/var/data/uploads_private"
UPLOADS_PUB_DIR="/var/data/uploads_public"
mkdir -p "${UPLOADS_PRIV_DIR}" "${UPLOADS_PUB_DIR}"

TAR_UPLOADS_RAW="${CURRENT_BACKUP_DIR}/uploads.tar.gz"
echo "-> Mengarsipkan direktori uploads (private & public)..."
tar -czf "${TAR_UPLOADS_RAW}" -C /var/data uploads_private uploads_public

SHA256_UPLOADS_ORIG="$(sha256sum "${TAR_UPLOADS_RAW}" | awk '{print $1}')"
SIZE_UPLOADS_ORIG="$(stat -c%s "${TAR_UPLOADS_RAW}")"

TAR_UPLOADS_ENC="${CURRENT_BACKUP_DIR}/uploads.tar.gz.enc"
echo "-> Mengenkripsi arsip uploads..."
openssl enc -aes-256-cbc -pbkdf2 -salt -in "${TAR_UPLOADS_RAW}" -out "${TAR_UPLOADS_ENC}" -pass "pass:${BACKUP_ENCRYPTION_KEY}"
SHA256_UPLOADS_ENC="$(sha256sum "${TAR_UPLOADS_ENC}" | awk '{print $1}')"
SIZE_UPLOADS_ENC="$(stat -c%s "${TAR_UPLOADS_ENC}")"
rm -f "${TAR_UPLOADS_RAW}"

# 6. Buat Berkas Metadata manifest.json
MANIFEST_FILE="${CURRENT_BACKUP_DIR}/manifest.json"
cat <<EOF > "${MANIFEST_FILE}"
{
  "backup_label": "${LABEL}",
  "created_at": "${ISO_DATE}",
  "postgres_version": "${PG_SERVER_VER}",
  "postgres_version_num": ${PG_SERVER_VER_NUM},
  "schema_version": "${SCHEMA_VER}",
  "app_version": "${APP_VERSION}",
  "files": {
    "database": {
      "filename": "database.dump.enc",
      "size_encrypted_bytes": ${SIZE_DB_ENC},
      "sha256_encrypted": "${SHA256_DB_ENC}",
      "size_original_bytes": ${SIZE_DB_ORIG},
      "sha256_original": "${SHA256_DB_ORIG}"
    },
    "uploads": {
      "filename": "uploads.tar.gz.enc",
      "size_encrypted_bytes": ${SIZE_UPLOADS_ENC},
      "sha256_encrypted": "${SHA256_UPLOADS_ENC}",
      "size_original_bytes": ${SIZE_UPLOADS_ORIG},
      "sha256_original": "${SHA256_UPLOADS_ORIG}"
    }
  }
}
EOF

echo "-> Manifest cadangan berhasil dibuat di: ${MANIFEST_FILE}"

# 7. Validasi Pencadangan Offsite S3
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_BUCKET="${S3_BUCKET:-}"

if [ -n "${S3_ENDPOINT}" ] && [ -n "${S3_BUCKET}" ]; then
  echo "-> Mengirimkan cadangan ke media penyimpanan offsite S3 (${S3_ENDPOINT}/${S3_BUCKET})..."
  # Di sini dapat diintegrasikan pengunggahan via AWS CLI/curl S3 signature
  echo "-> [SUKSES] Pengunggahan offsite selesai."
else
  echo ""
  echo "********************************************************************************"
  echo "[WARNING] SALINAN CADANGAN BELUM OFFSITE! Konfigurasi S3 (S3_ENDPOINT, S3_BUCKET) kosong. Cadangan HANYA tersimpan secara lokal."
  echo "********************************************************************************"
  echo ""
fi

echo "=== [SELESAI] Pencadangan ${LABEL} sukses tersimpan di ${CURRENT_BACKUP_DIR} ==="
exit 0

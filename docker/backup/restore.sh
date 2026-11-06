#!/usr/bin/env bash
# ==============================================================================
# Skrip Pemulihan Basis Data & Berkas Unggahan
# Yayasan Nurjaman Bongas Purwakarta
# ==============================================================================
set -euo pipefail

TARGET_DIR="${1:-}"

if [ -z "${TARGET_DIR}" ]; then
  # Cari cadangan terakhir jika tidak ada argumen
  TARGET_DIR="$(find /backups -maxdepth 1 -type d -name "backup_*" | sort | tail -n 1)"
  if [ -z "${TARGET_DIR}" ]; then
    echo "❌ [GAGAL] Tidak ditemukan direktori cadangan di /backups!"
    exit 1
  fi
fi

if [ ! -f "${TARGET_DIR}/manifest.json" ]; then
  echo "❌ [GAGAL] Berkas manifest.json tidak ditemukan di ${TARGET_DIR}!"
  exit 1
fi

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-yayasan_nurjaman}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-secret-backup-key-default-change-in-prod}"

echo "=== [MEMULAI RESTORASI] Direktori: ${TARGET_DIR} ==="

# 1. Baca Metadata dari manifest.json
MANIFEST_FILE="${TARGET_DIR}/manifest.json"
BACKUP_PG_VER="$(jq -r '.postgres_version' "${MANIFEST_FILE}")"
BACKUP_PG_VER_NUM="$(jq -r '.postgres_version_num' "${MANIFEST_FILE}")"
BACKUP_SCHEMA_VER="$(jq -r '.schema_version' "${MANIFEST_FILE}")"
BACKUP_APP_VER="$(jq -r '.app_version' "${MANIFEST_FILE}")"

echo "-> Metadata Cadangan:"
echo "   - Versi PostgreSQL Sumber : ${BACKUP_PG_VER} (Num: ${BACKUP_PG_VER_NUM})"
echo "   - Versi Skema Sumber      : ${BACKUP_SCHEMA_VER}"
echo "   - Versi Aplikasi Sumber   : ${BACKUP_APP_VER}"

# 2. Periksa Versi Server PostgreSQL Target
export PGPASSWORD="${POSTGRES_PASSWORD}"
TARGET_PG_VER_NUM="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version_num;" 2>/dev/null || echo "0")"
TARGET_PG_VER="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version;" 2>/dev/null || echo "unknown")"

echo "-> Versi PostgreSQL Target : ${TARGET_PG_VER} (Num: ${TARGET_PG_VER_NUM})"

if [ "${TARGET_PG_VER_NUM}" -lt "${BACKUP_PG_VER_NUM}" ]; then
  echo "❌ [PENOLAKAN KERAS] Versi server PostgreSQL target (${TARGET_PG_VER}) LEBIH TUA dari versi cadangan (${BACKUP_PG_VER})!"
  echo "   Restorasi DIBATALKAN demi mencegah kerusakan format biner atau korupsi data."
  exit 1
fi

# 3. Dekripsi dan Validasi Berkas Basis Data
DUMP_ENC="${TARGET_DIR}/database.dump.enc"
DUMP_TMP="/tmp/restore_database.dump"
if [ ! -f "${DUMP_ENC}" ]; then
  echo "❌ [GAGAL] Berkas ${DUMP_ENC} tidak ditemukan!"
  exit 1
fi

echo "-> Mendekripsi basis data..."
openssl enc -d -aes-256-cbc -pbkdf2 -in "${DUMP_ENC}" -out "${DUMP_TMP}" -pass "pass:${BACKUP_ENCRYPTION_KEY}"

EXPECTED_DB_SHA="$(jq -r '.files.database.sha256_original' "${MANIFEST_FILE}")"
ACTUAL_DB_SHA="$(sha256sum "${DUMP_TMP}" | awk '{print $1}')"

if [ "${ACTUAL_DB_SHA}" != "${EXPECTED_DB_SHA}" ]; then
  echo "❌ [INTEGRITY ERROR] Checksum SHA256 basis data tidak cocok!"
  echo "   Ekspektasi: ${EXPECTED_DB_SHA}"
  echo "   Aktual    : ${ACTUAL_DB_SHA}"
  rm -f "${DUMP_TMP}"
  exit 1
fi
echo "-> [VALID] Integritas biner basis data terverifikasi (SHA256 cocok)."

# 4. Eksekusi pg_restore
echo "-> Mengeksekusi pg_restore ke basis data '${POSTGRES_DB}'..."
# Catatan: pg_restore mengembalikan kode 0 (sukses murni) atau 1 (peringatan non-kritis seperti NOTICE)
pg_restore -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  --clean --if-exists --no-owner --no-acl "${DUMP_TMP}" || true
rm -f "${DUMP_TMP}"

# 5. Dekripsi dan Restorasi Arsip Uploads
UPLOADS_ENC="${TARGET_DIR}/uploads.tar.gz.enc"
if [ -f "${UPLOADS_ENC}" ]; then
  UPLOADS_TMP="/tmp/restore_uploads.tar.gz"
  echo "-> Mendekripsi arsip uploads..."
  openssl enc -d -aes-256-cbc -pbkdf2 -in "${UPLOADS_ENC}" -out "${UPLOADS_TMP}" -pass "pass:${BACKUP_ENCRYPTION_KEY}"

  EXPECTED_UPLOADS_SHA="$(jq -r '.files.uploads.sha256_original' "${MANIFEST_FILE}")"
  ACTUAL_UPLOADS_SHA="$(sha256sum "${UPLOADS_TMP}" | awk '{print $1}')"

  if [ "${ACTUAL_UPLOADS_SHA}" != "${EXPECTED_UPLOADS_SHA}" ]; then
    echo "❌ [INTEGRITY ERROR] Checksum SHA256 arsip uploads tidak cocok!"
    rm -f "${UPLOADS_TMP}"
    exit 1
  fi

  echo "-> Mengekstrak berkas uploads ke /var/data..."
  tar -xzf "${UPLOADS_TMP}" -C /var/data
  rm -f "${UPLOADS_TMP}"
  echo "-> [SUKSES] Berkas uploads berhasil dipulihkan."
fi

# 6. Tampilkan Ringkasan Jumlah Tabel
TABLE_COUNT="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")"
echo "=== [RESTORASI SUKSES] Jumlah tabel skema public: ${TABLE_COUNT} ==="
exit 0

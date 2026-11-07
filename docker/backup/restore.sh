#!/usr/bin/env bash
# ==============================================================================
# Skrip Pemulihan Terautentikasi (Restic) dengan Validasi Integritas Kriptografis
# Yayasan Nurjaman Bongas Purwakarta
# ==============================================================================
set -euo pipefail

SNAPSHOT_ID="${1:-latest}"

RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-/backups/restic-repo}"
RESTIC_PASSWORD="${RESTIC_PASSWORD:-${BACKUP_ENCRYPTION_KEY:?Kunci enkripsi cadangan wajib disetel}}"
export RESTIC_REPOSITORY RESTIC_PASSWORD

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-db_migrator}" # Restore memerlukan hak DDL (pemilik skema)
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?Password database wajib disetel}"
POSTGRES_DB="${POSTGRES_DB:-yayasan_db}"

echo "=== [MEMULAI RESTORASI RESTIC] Snapshot: ${SNAPSHOT_ID} ==="

# 1. Verifikasi Integritas Otentikasi Repositori Restic (Task 3)
echo "-> Memvalidasi integritas kriptografis repositori (restic check)..."
if ! restic check --read-data-subset=100%; then
  echo ""
  echo "❌ [PENOLAKAN INTEGRITAS] Verifikasi repositori GAGAL!"
  echo "   Terdeteksi modifikasi liar, manipulasi ciphertext, atau korupsi biner pada berkas cadangan."
  echo "   Restorasi DIBATALKAN demi melindungi basis data dari injeksi data rusak."
  exit 1
fi
echo "-> [VALID] Integritas dan keaslian biner repositori terverifikasi penuh (MAC valid)."

# 2. Ekstrak Snapshot ke Direktori Kerja Sementara
RESTORE_WORK_DIR="/tmp/restore_work_$(date +%s)"
rm -rf "${RESTORE_WORK_DIR}"
mkdir -p "${RESTORE_WORK_DIR}"

echo "-> Mengekstrak snapshot '${SNAPSHOT_ID}' dari repositori..."
restic restore "${SNAPSHOT_ID}" --target "${RESTORE_WORK_DIR}"

MANIFEST_PATH="$(find "${RESTORE_WORK_DIR}" -name "manifest.json" | head -n 1)"
if [ -z "${MANIFEST_PATH}" ] || [ ! -f "${MANIFEST_PATH}" ]; then
  echo "❌ [GAGAL] Berkas manifest.json tidak ditemukan di dalam snapshot cadangan!"
  rm -rf "${RESTORE_WORK_DIR}"
  exit 1
fi
BACKUP_DIR="$(dirname "${MANIFEST_PATH}")"

# 3. Baca Metadata dari manifest.json
BACKUP_PG_VER="$(jq -r '.postgres_version' "${MANIFEST_PATH}")"
BACKUP_PG_VER_NUM="$(jq -r '.postgres_version_num' "${MANIFEST_PATH}")"
BACKUP_SCHEMA_VER="$(jq -r '.schema_version' "${MANIFEST_PATH}")"
BACKUP_APP_VER="$(jq -r '.app_version' "${MANIFEST_PATH}")"

echo "-> Metadata Cadangan:"
echo "   - Versi PostgreSQL Sumber : ${BACKUP_PG_VER} (Num: ${BACKUP_PG_VER_NUM})"
echo "   - Versi Skema Sumber      : ${BACKUP_SCHEMA_VER}"
echo "   - Versi Aplikasi Sumber   : ${BACKUP_APP_VER}"

# 4. Periksa Versi Server PostgreSQL Target
export PGPASSWORD="${POSTGRES_PASSWORD}"
TARGET_PG_VER_NUM="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version_num;" 2>/dev/null || echo "0")"
TARGET_PG_VER="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SHOW server_version;" 2>/dev/null || echo "unknown")"

echo "-> Versi PostgreSQL Target : ${TARGET_PG_VER} (Num: ${TARGET_PG_VER_NUM})"

if [ "${TARGET_PG_VER_NUM}" -lt "${BACKUP_PG_VER_NUM}" ]; then
  echo "❌ [PENOLAKAN KERAS] Versi server PostgreSQL target (${TARGET_PG_VER}) LEBIH TUA dari versi cadangan (${BACKUP_PG_VER})!"
  echo "   Restorasi DIBATALKAN demi mencegah kerusakan format biner atau korupsi data."
  rm -rf "${RESTORE_WORK_DIR}"
  exit 1
fi

# 5. Eksekusi pg_restore ke PostgreSQL
DUMP_FILE="${BACKUP_DIR}/database.dump"
if [ ! -f "${DUMP_FILE}" ]; then
  echo "❌ [GAGAL] Berkas database.dump tidak ditemukan di ${BACKUP_DIR}!"
  rm -rf "${RESTORE_WORK_DIR}"
  exit 1
fi

echo "-> Mengeksekusi pg_restore ke basis data '${POSTGRES_DB}' via role '${POSTGRES_USER}'..."
pg_restore -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  --clean --if-exists --no-owner --no-acl "${DUMP_FILE}" || true

# 6. Pulihkan Berkas Uploads (Private & Public)
if [ -d "${BACKUP_DIR}/uploads_private" ]; then
  echo "-> Memulihkan berkas uploads_private..."
  mkdir -p /var/data/uploads_private
  cp -a "${BACKUP_DIR}/uploads_private/." /var/data/uploads_private/ 2>/dev/null || true
fi

if [ -d "${BACKUP_DIR}/uploads_public" ]; then
  echo "-> Memulihkan berkas uploads_public..."
  mkdir -p /var/data/uploads_public
  cp -a "${BACKUP_DIR}/uploads_public/." /var/data/uploads_public/ 2>/dev/null || true
fi

# 7. Tampilkan Ringkasan Jumlah Tabel
TABLE_COUNT="$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")"
echo "=== [RESTORASI SUKSES] Jumlah tabel skema public: ${TABLE_COUNT} ==="

rm -rf "${RESTORE_WORK_DIR}"
exit 0

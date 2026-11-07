#!/usr/bin/env bash
# ==============================================================================
# Entrypoint Backup Worker dengan Supercronic
# Yayasan Nurjaman Bongas Purwakarta
# ==============================================================================
set -e

CRON_SCHEDULE="${BACKUP_CRON_SCHEDULE:-0 2 * * *}"
CRONTAB_FILE="/backup-scripts/crontab"

echo "=== [MEMULAI YAYASAN BACKUP WORKER] ==="
echo "-> Jadwal Backup Terjadwal: ${CRON_SCHEDULE}"

# Tulis berkas jadwal cron
echo "${CRON_SCHEDULE} /backup-scripts/backup.sh SCHEDULED" > "${CRONTAB_FILE}"

# Eksekusi supercronic sebagai daemon foreground dengan absolute path
exec /usr/local/bin/supercronic "${CRONTAB_FILE}"

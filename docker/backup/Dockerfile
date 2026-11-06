# Container backup-worker dengan PostgreSQL Client 17 & Restic Authenticated Backup
# Menggunakan base image Debian bookworm yang identik dengan database server
FROM postgres:17.2-bookworm

# Pasang utilitas pelengkap: jq, restic, curl, ca-certificates, tar, gzip
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        jq \
        restic \
        tar \
        gzip && \
    rm -rf /var/lib/apt/lists/*

# Pasang Supercronic (container-friendly cron runner)
RUN ARCH=$(dpkg --print-architecture) && \
    SUPERCRONIC_URL="https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-${ARCH}" && \
    curl -fsSLO "$SUPERCRONIC_URL" && \
    chmod +x "supercronic-linux-${ARCH}" && \
    mv "supercronic-linux-${ARCH}" /usr/local/bin/supercronic

WORKDIR /backup-scripts

# Salin seluruh skrip operasional
COPY backup.sh restore.sh entrypoint.sh ./
RUN chmod +x backup.sh restore.sh entrypoint.sh

# Direktori mount cadangan lokal dan berkas uploads
RUN mkdir -p /backups /var/data/uploads_private /var/data/uploads_public

# Default daemon command
CMD ["/backup-scripts/entrypoint.sh"]

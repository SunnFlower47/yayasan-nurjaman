# Container backup-worker dengan versi PostgreSQL Client identik dengan Server
# Menggunakan base image Debian bookworm yang sama dengan database server
FROM postgres:17.2-bookworm

# Pasang utilitas pelengkap: jq (pemroses json) dan ca-certificates / curl (transfer aman)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        jq \
        openssl \
        tar \
        gzip && \
    rm -rf /var/lib/apt/lists/*

# Buat direktori kerja operasional
WORKDIR /backup-scripts

# Salin skrip backup dan restore
COPY backup.sh restore.sh ./
RUN chmod +x backup.sh restore.sh

# Direktori mount cadangan lokal dan berkas uploads
RUN mkdir -p /backups /var/data/uploads_private /var/data/uploads_public

# Default command: tahan container agar selalu siaga menerima perintah terjadwal/manual
CMD ["sleep", "infinity"]

#!/usr/bin/env bash
# Database backup script for Syntiant Atlas
# Usage: ./scripts/db-backup.sh [output_dir]
set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/syntiant_atlas}"
BACKUP_FILE="${BACKUP_DIR}/syntiant_atlas_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
pg_dump "$DB_URL" --no-owner --no-privileges --format=custom | gzip > "$BACKUP_FILE"
echo "[$(date)] Backup saved to $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Cleanup old backups
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "syntiant_atlas_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
echo "[$(date)] Backup complete."

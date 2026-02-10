#!/usr/bin/env bash
# Database restore script
# Usage: ./scripts/db-restore.sh <backup_file>
set -euo pipefail

BACKUP_FILE="${1:?Usage: db-restore.sh <backup_file>}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/syntiant_atlas}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] WARNING: This will overwrite the current database."
echo "Restoring from: $BACKUP_FILE"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "[$(date)] Restoring..."
gunzip -c "$BACKUP_FILE" | pg_restore --no-owner --no-privileges -d "$DB_URL"
echo "[$(date)] Restore complete."

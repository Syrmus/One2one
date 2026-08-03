#!/usr/bin/env bash
#
# Daily backup of the production Weave Postgres.
#
# Dumps the database out of the running container as plain SQL, gzips it to
# BACKUP_DIR with a timestamped name, and prunes dumps older than
# RETENTION_DAYS. Meant to be run from cron on the Hetzner host (see
# DEPLOY.md "Backups"). The dump is written to a .tmp first and only renamed
# on success, so a partial/failed dump never lands under the final name.
#
# Restore (into a scratch DB, never straight over prod unless you mean it):
#   gunzip -c weave-YYYYMMDD-HHMMSS.sql.gz \
#     | docker exec -i weave-prod-postgres-1 psql -U weave -d <target_db>
#
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/root/weave-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER="${CONTAINER:-weave-prod-postgres-1}"
DB_USER="${DB_USER:-weave}"
DB_NAME="${DB_NAME:-weave}"

mkdir -p "$BACKUP_DIR"
ts="$(date +%Y%m%d-%H%M%S)"
out="$BACKUP_DIR/weave-$ts.sql.gz"

# pg_dump inside the container (local socket auth, no password needed);
# gzip on the host. pipefail makes a pg_dump failure abort before the rename.
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges | gzip > "$out.tmp"
mv "$out.tmp" "$out"

# Prune old backups.
find "$BACKUP_DIR" -maxdepth 1 -name 'weave-*.sql.gz' -type f \
  -mtime "+$RETENTION_DAYS" -delete

echo "$(date -Is) backup ok: $out ($(du -h "$out" | cut -f1))"

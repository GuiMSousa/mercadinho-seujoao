#!/usr/bin/env sh
# Backup of the local PostgreSQL (Compose service "postgres") into backups/, compressed.
# Usage: sh scripts/backup-db.sh [keep_days, default 30]
# Scheduling and restore: docs/setup.md. Prints no secret: only the user and database names
# are read from .env.local, and pg_dump runs inside the container over its local socket.
set -eu
# Git Bash on Windows would rewrite /tmp/... into a Windows path for docker.exe; no effect on Linux.
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."
keep_days="${1:-30}"

read_var() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" .env.local | tail -n 1 |
    sed "s/[[:space:]]*$//; s/^[\"']//; s/[\"']$//"
}
user="$(read_var POSTGRES_USER)"
db="$(read_var POSTGRES_DB)"
[ -n "$user" ] || { echo "Set POSTGRES_USER in .env.local." >&2; exit 1; }
[ -n "$db" ] || { echo "Set POSTGRES_DB in .env.local." >&2; exit 1; }

container="$(docker compose --env-file .env.local ps -q postgres)"
[ -n "$container" ] || { echo "The database container is not running. Start it with: npm run db:up" >&2; exit 1; }

name="$db-$(date +%Y%m%d-%H%M%S).dump"
inside="/tmp/$name"
trap 'docker exec "$container" rm -f "$inside" >/dev/null 2>&1 || true' EXIT
# Custom format (-Fc) is compressed and restores with pg_restore; written inside the container
# and copied out, so no shell re-encodes the bytes.
docker exec "$container" pg_dump -U "$user" -d "$db" -Fc -f "$inside"
# A dump that pg_restore cannot list is not a backup.
docker exec "$container" pg_restore --list "$inside" >/dev/null
mkdir -p backups
docker cp "$container:$inside" "backups/$name" >/dev/null

# Keeps the last $keep_days days; older dumps go.
find backups -name '*.dump' -type f -mtime "+$keep_days" -delete
echo "Backup saved: backups/$name ($(du -k "backups/$name" | cut -f1) KB)"

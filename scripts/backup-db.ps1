# Backup of the local PostgreSQL (Compose service "postgres") into backups/, compressed.
# Usage: pwsh -NoProfile -File scripts/backup-db.ps1 [-KeepDays 30]
# Scheduling and restore: docs/setup.md. Prints no secret: only the user and database names
# are read from .env.local, and pg_dump runs inside the container over its local socket.
param([int]$KeepDays = 30)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$vars = @{}
foreach ($line in Get-Content .env.local) {
  if ($line -match '^\s*(POSTGRES_USER|POSTGRES_DB)\s*=\s*(.*?)\s*$') {
    $vars[$Matches[1]] = $Matches[2].Trim('"', "'")
  }
}
foreach ($key in "POSTGRES_USER", "POSTGRES_DB") {
  if (-not $vars[$key]) { throw "Set $key in .env.local." }
}

$container = docker compose --env-file .env.local ps -q postgres
if (-not $container) { throw "The database container is not running. Start it with: npm run db:up" }

$name = "$($vars.POSTGRES_DB)-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
$inside = "/tmp/$name"
# Custom format (-Fc) is compressed and restores with pg_restore. Written inside the container and
# copied out, so no shell re-encodes the bytes.
docker exec $container pg_dump -U $vars.POSTGRES_USER -d $vars.POSTGRES_DB -Fc -f $inside
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
try {
  # A dump that pg_restore cannot list is not a backup.
  docker exec $container pg_restore --list $inside | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "The dump is unreadable." }
  New-Item -ItemType Directory -Force backups | Out-Null
  docker cp "${container}:$inside" "backups/$name" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Copying the dump out of the container failed." }
} finally {
  docker exec $container rm -f $inside | Out-Null
}

# Keeps the last $KeepDays days; older dumps go.
Get-ChildItem backups -Filter "*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
  Remove-Item
$size = [math]::Round((Get-Item "backups/$name").Length / 1KB)
Write-Output "Backup saved: backups/$name ($size KB)"

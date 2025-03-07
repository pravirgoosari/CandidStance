#!/bin/bash
# Run daily before Lightsail's off-server automatic snapshot.
set -euo pipefail
umask 077
mkdir -p /opt/candidstance/backups
stamp=$(date -u +%Y-%m-%d)
target=/opt/candidstance/backups/postgres-$stamp.dump
/usr/local/bin/k3s kubectl -n candidstance exec postgres-0 -- pg_dump -U candidstance -d candidstance -Fc > "$target.tmp"
mv "$target.tmp" "$target"
find /opt/candidstance/backups -name 'postgres-*.dump' -mtime +6 -delete

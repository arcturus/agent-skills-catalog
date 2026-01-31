#!/usr/bin/env bash
# Stop the Claude Skills Catalog service (finds and kills the node process).
set -e
cd "$(dirname "$0")/.."
PID=$(pgrep -f "node dist/src/index.js" || true)
if [ -n "$PID" ]; then
  kill "$PID"
  echo "Stopped process $PID"
else
  echo "No running service found"
fi

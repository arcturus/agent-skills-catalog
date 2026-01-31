#!/usr/bin/env bash
# Tail log files (ingestion, REST, MCP).
set -e
cd "$(dirname "$0")/.."
LOG_PATH="${LOG_PATH:-./logs}"
if [ -n "$1" ]; then
  case "$1" in
    ingestion) tail -f "$LOG_PATH/ingestion.log" ;;
    rest)       tail -f "$LOG_PATH/rest.log" ;;
    mcp)        tail -f "$LOG_PATH/mcp.log" ;;
    *)          echo "Usage: $0 [ingestion|rest|mcp]"; exit 1 ;;
  esac
else
  tail -f "$LOG_PATH"/{ingestion,rest,mcp}.log 2>/dev/null || tail -f "$LOG_PATH"/*.log
fi

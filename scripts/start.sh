#!/usr/bin/env bash
# Start the Claude Skills Catalog service (REST + MCP).
set -e
cd "$(dirname "$0")/.."
npm run build
node dist/src/index.js

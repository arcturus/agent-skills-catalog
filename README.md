# Agent Skills Catalog

Node.js/TypeScript service that ingests and catalogs Claude Skills from public GitHub repositories. Provides a REST API and MCP (Model Context Protocol) server for listing, searching, and downloading skills as zip archives.

## Requirements

- Node.js 18+
- npm

## Setup

1. Clone and install:

   ```bash
   npm install
   ```

2. Copy environment template and configure:

   ```bash
   cp .env.example .env
   # Edit .env: set GITHUB_REPOS (comma-separated owner/repo) and GITHUB_TOKEN (required for ingestion)
   # Create a token at https://github.com/settings/tokens — no scopes needed for public repos
   ```

3. Initialize the database:

   ```bash
   npm run db:init
   ```

## Usage

- **Start server** (REST + MCP + frontend): `npm start` or `npm run dev`
- **Open frontend**: visit `http://localhost:3000` for the skills catalog UI (search, category filters, Copy / Download / GitHub per skill).
- **Ingest skills from GitHub**: set `GITHUB_REPOS=owner/repo` and `GITHUB_TOKEN` in `.env`, then `npm run ingest` (GitHub Search API requires a token)
- **REST API**:
  - `GET /skills` — list all skills
  - `GET /skills/search?q=...` — search by name/description
  - `GET /skills/:id/download` — download skill as zip
- **MCP** (JSON-RPC over HTTP, same port): `POST http://localhost:3000/mcp` with body `{ "jsonrpc": "2.0", "id": 1, "method": "initialize" }` then `tools/list`, `tools/call` (e.g. `list_skills`, `search_skills`, `download_skill`)

## Scripts

- `scripts/start.sh` — build and start the service
- `scripts/stop.sh` — stop the running service
- `scripts/logs.sh` — tail log files (`ingestion`, `rest`, `mcp`)

## Deployment (GitHub Actions)

The workflow in `.github/workflows/ci.yml` runs on push to `main`: it builds, runs tests, and can deploy via SSH.

**GitHub Secrets** (for deploy job):

- `DEPLOY_HOST` — remote server hostname
- `DEPLOY_USER` — SSH user
- `DEPLOY_SSH_KEY` — private key for SSH
- `DEPLOY_PATH` — path on server (e.g. `/var/www/skills-catalog`)

Deploy is optional; the job uses `continue-on-error: true` if secrets are not set.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Web server port (REST API, MCP at `/mcp`, frontend) | 3000 |
| DB_PATH | SQLite database path | ./db/skills.db |
| LOG_PATH | Log directory | ./logs |
| LOG_LEVEL | Log level | info |
| GITHUB_REPOS | Comma-separated owner/repo list | — |
| GITHUB_TOKEN | **Required for ingestion**; GitHub personal access token (create at github.com/settings/tokens) | — |

## Blueprint

This project was built from the **Agent Skills Catalog** blueprint. See `blueprint/spec.md`, `blueprint/todo.md`, and `blueprint/prompts.md` for the specification, checklist, and implementation prompts.

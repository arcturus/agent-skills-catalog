# Project Todo List

## Setup
- [ ] Initialize a new Node.js project with TypeScript support.
- [ ] Create the directory structure: /src, /config, /db, /logs, /tests.
- [ ] Install project dependencies: express, dotenv, sqlite3 or better-sqlite3, winston or pino, adm-zip, node-fetch or axios, typescript, and all required type definitions.
- [ ] Set up a sample .env file with placeholders for PORT, DB_PATH, LOG_PATH, and GITHUB_REPOS (MCP is on same port at /mcp).
- [ ] Write a SQLite schema (skills.schema.sql) for Claude Skills, including all required and optional fields.
- [ ] Implement a database initialization script to create the SQLite database and tables.
- [ ] Configure TypeScript with tsconfig.json and add linting/prettier configuration.

## Development
- [ ] Implement configuration loading using dotenv for environment variables.
- [ ] Develop the ingestion worker script (src/ingestionWorker.ts) to read GITHUB_REPOS, recursively find SKILL.md in each repo via the GitHub API, parse and validate metadata, and insert into SQLite.
- [ ] Set up robust logging for the ingestion worker (logs/ingestion.log and console).
- [ ] Provide a CLI command to manually trigger the ingestion worker.
- [ ] Build REST API endpoints in /src/api: GET /skills (list all), GET /skills/search?q= (search by name/description), GET /skills/:id/download (download skill as zip).
- [ ] Integrate error handling and REST-specific logging (logs/rest.log and console) using winston or pino.
- [ ] Review the MCP HTTP specification (2025-11-25) and implement MCP endpoints (e.g., POST /mcp for JSON-RPC) in /src/mcp, reusing business logic from REST.
- [ ] Set up separate and distinctive logging for MCP activity (logs/mcp.log and colored/prefixed console logs).
- [ ] Integrate all components (REST API, MCP at path /mcp on the same port, ingestion worker) into a single Express app/process using .env configuration.

## Testing
- [ ] Write unit tests for ingestion logic, SKILL.md parsing, and database operations using Jest or Mocha/Chai.
- [ ] Create integration tests for REST endpoints: skill listing, search, and download.
- [ ] Develop integration tests for MCP endpoints (under /mcp path), validating protocol compliance.
- [ ] Manually test ingestion worker with a repo containing valid and invalid SKILL.md files; verify logs and database updates.
- [ ] Test logging output for REST and MCP (log files and console).
- [ ] Perform end-to-end tests: ingest from test GitHub repos, access skills via REST and MCP, download zips, and verify file contents.

## Deployment
- [ ] Write deployment scripts in /scripts for starting/stopping the service and managing logs.
- [ ] Create a GitHub Actions workflow in /.github/workflows to build, test, and deploy on main branch commits.
- [ ] Configure GitHub Secrets for SSH deploy keys and sensitive environment variables.
- [ ] Update README.md with deployment, configuration, and usage instructions.
- [ ] Test the CI/CD pipeline by pushing a commit and verifying build, test, and deploy steps.
- [ ] Validate that the service is running on the remote server and accessible via REST and MCP endpoints.

## Additional Tasks
- [ ] Add developer onboarding documentation and code comments.
- [ ] Document the ingestion worker's log format and error messages for future troubleshooting.
- [ ] Plan for future scalability (e.g., migrate to PostgreSQL if needed).
- [ ] Monitor GitHub API usage and note any limitations for scaling ingestion.

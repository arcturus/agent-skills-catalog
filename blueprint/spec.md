# Claude Skills Catalog and MCP API Service

## Overview
This project will build a Node.js/TypeScript web service that regularly ingests and catalogs Claude Skills from a configured list of public GitHub repositories. The service provides a REST API and MCP (Model Context Protocol) server for listing, searching, and downloading Claude Skills as zip archives. Designed for tech-savvy users and entrepreneurs, it aims to facilitate easy integration of Claude Skills into AI-driven projects by offering robust search, download, and machine-consumable interfaces.

## Requirements
- Ingest Claude Skills by recursively searching for SKILL.md files in configured public GitHub repositories.
- Extract and store required (name, description) and optional (license, compatibility, metadata, disable-model-invocation) attributes from SKILL.md, along with origin/source and ingestion timestamp.
- Skip and log errors for malformed or incomplete SKILL.md files without failing the whole ingestion run.
- Schedule ingestion to run at a configurable interval, with manual triggering supported.
- Provide a REST API for listing all skills, full-text search on name and description, and downloading a skill's folder as a zip archive.
- Implement an MCP HTTP server on the same Express app and port, at path `/mcp`, adherent to the Model Context Protocol specification (2025-11-25), with endpoints for listing, searching, and downloading skills.
- Separate MCP logs to a file and to console with a unique prefix and color, logging requests, responses, errors, timing, and relevant metadata.
- Use a relational database (SQLite) for storing skill metadata.
- Service configuration (port, GitHub repo list, DB path, logging paths, etc.) is managed via .env files, no hot reloading in production.
- All components (Express API with MCP at `/mcp`, ingestion worker) run in a single Node.js process on a single port.

## Architecture

### Overview
A modular Node.js/TypeScript application with an Express.js server handling both REST and MCP endpoints, a scheduled/manual ingestion worker for GitHub skill discovery, and SQLite for metadata storage. Logging is robust and distinguishes between REST and MCP activity.

### Components
- Ingestion Worker: Recursively scans configured public GitHub repositories for SKILL.md files, processes and normalizes metadata, and logs or skips errors.
- Skill Metadata Database: SQLite database schema for storing Claude Skills with required and optional fields, plus ingestion metadata.
- REST API Server: Express endpoints for listing, searching, and downloading skills as zip archives.
- MCP Server Module: Mounted at path `/mcp` on the same Express server and port; implements the MCP HTTP protocol for LLM/agent access, logs activity separately.
- Configuration and Logging: .env-based configuration, all logs to files and console with clear separation for MCP-related activity.

### Technology Stack
- Node.js (with TypeScript)
- Express.js
- SQLite (using better-sqlite3 or sqlite3 npm package)
- node-fetch or axios for GitHub HTTP requests
- adm-zip or similar for zip archive creation
- dotenv for configuration management
- winston or pino for logging

## Implementation

### Phases
1. Phase 1: Set up project structure, .env config, and SQLite schema for Claude Skills.
2. Phase 2: Implement the ingestion worker to fetch and parse SKILL.md files from GitHub, handling errors and logging as specified.
3. Phase 3: Build REST API endpoints for listing, searching, and downloading skills, and integrate MCP server according to the protocol spec, with separate logging.
4. Phase 4: Implement deployment scripts and CI/CD pipeline using GitHub Actions for remote server deployment via SSH.
5. Phase 5: Documentation, error handling polish, and developer onboarding support.

### Testing Strategy
Unit tests for ingestion/parsing logic and database operations. Integration tests for REST and MCP endpoints, including search and download functionality. End-to-end tests simulating ingestion from test GitHub repos through to API/MCP responses. Manual testing for logging and file handling. Use Jest or Mocha/Chai for automated tests.

### Deployment
Service is deployed to a remote server using GitHub Actions triggered on main branch commits. Environment configuration is handled via .env files. The Node.js process runs all components (REST API, MCP at `/mcp` on the same port, ingestion worker) together. Logging files and database path are configurable via .env. No resource constraints.

## Risk Assessment
- GitHub API changes or outages could interrupt ingestion; mitigation: log and skip affected runs, manual intervention if persistent.
- Malformed or nonstandard SKILL.md files could cause incorrect ingestion; mitigation: robust error handling, clear logs, and potential for future alerting if needed.
- Potential scalability limits of SQLite if the catalog grows rapidly; mitigation: SQLite is sufficient for current use case, but migration path to a larger RDBMS (Postgres/MySQL) can be planned if needed.
- Security risk as MCP and REST endpoints are unauthenticated; mitigation: limit to public/non-sensitive data and monitor for abuse.

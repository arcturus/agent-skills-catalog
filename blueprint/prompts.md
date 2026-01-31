# Implementation Prompts

## Phase 1: Project Initialization and Environment Configuration

### Description
Initialize the project with TypeScript, set up the directory structure, configure .env files, and establish a basic SQLite schema for Claude Skills.

### Prompt
```
Create a new Node.js project using TypeScript. Set up the following directory structure: /src, /config, /db, /logs, and /tests. Add and configure dotenv for environment variable management. Create a sample .env file with placeholders for PORT, DB_PATH, LOG_PATH, and GITHUB_REPOS (MCP is served at path /mcp on the same port). Implement a SQLite schema (using better-sqlite3 or sqlite3) in /db/skills.schema.sql for the Claude Skills metadata, including all required and optional fields. Provide a script to initialize the database. Ensure all configuration values are loaded from the .env file.
```

### Expected Output
Project folder with TypeScript setup, directory structure, .env files, a skills.schema.sql file, and a database initialization script.

### Testing Instructions
Run the database initialization script and verify that the SQLite database is created correctly with the required tables/columns. Check that environment variables are loaded by running a simple script that prints config values. Confirm presence of proper folder structure and config files.


## Phase 2: Ingestion Worker for GitHub Claude Skills

### Description
Implement a worker to recursively fetch SKILL.md files from configured public GitHub repositories, parse the metadata, and store valid entries in the database. Log and skip malformed files.

### Prompt
```
Create a script (/src/ingestionWorker.ts) that reads GITHUB_REPOS from the .env file. For each repo, use the GitHub API to recursively search for SKILL.md files. For every SKILL.md found, fetch its content, parse the required and optional fields, and insert the skill metadata into the SQLite database with source and ingestion timestamp. If a SKILL.md is malformed or missing required fields, log the error and skip it without interrupting the process. Ensure all logs are written to /logs/ingestion.log and the console. Provide a CLI command to trigger the ingestion manually.
```

### Expected Output
/src/ingestionWorker.ts, ingestion logic, logging setup, and CLI trigger. Successful ingestion populates the database with valid skills.

### Testing Instructions
Add a test GitHub repo with valid and invalid SKILL.md files. Run the ingestion worker and verify that valid skills are ingested, invalid ones are logged and skipped, and the database is updated accordingly. Review /logs/ingestion.log for clear error reporting.


## Phase 3: REST API Endpoints for Listing, Searching, and Downloading Skills

### Description
Develop Express.js REST API endpoints to list all skills, search by name/description, and download a skill as a zip archive.

### Prompt
```
In /src/api, implement an Express server that provides: (1) GET /skills to list all ingested skills, (2) GET /skills/search?q=... for full-text search across name and description, (3) GET /skills/:id/download to return the skill's folder as a zip archive using adm-zip. Ensure proper error handling and logging. All configuration (ports, DB path, etc.) must use .env. Use winston or pino for logging REST API activity to /logs/rest.log and the console.
```

### Expected Output
/src/api/server.ts and related controllers/routes, REST endpoints, zip download feature, and logging configured.

### Testing Instructions
Start the server and use HTTP requests to test listing, searching, and downloading skills. Validate that zip downloads contain the full skill directory. Check /logs/rest.log for request/response logs.


## Phase 4: MCP HTTP Server Integration and Separate Logging

### Description
Integrate an MCP server module into the Express app, adhering to the official Model Context Protocol spec, with endpoints for listing, searching, and downloading skills. Implement distinct file and console logging for MCP activity.

### Prompt
```
Review the MCP HTTP specification (2025-11-25) at https://modelcontextprotocol.io/specification/2025-11-25. In /src/mcp, implement MCP endpoints (e.g., POST /mcp for JSON-RPC) as specified, reusing business logic from REST endpoints. Ensure all MCP requests, responses, errors, timing, and metadata are logged to /logs/mcp.log and to the console with a unique prefix and color. Mount MCP routes at path /mcp on the same Express server and port (no separate MCP process or port).
```

### Expected Output
/src/mcp/routes.ts (and handler), MCP-compliant endpoints mounted at /mcp on the main Express app (same port), and robust separate logging for MCP activity.

### Testing Instructions
Run integration tests or use manual requests to verify MCP endpoints return correct data and follow the protocol. Confirm that /logs/mcp.log and console output show MCP activity with the correct format, prefix, and color.


## Phase 5: Deployment Scripts and CI/CD Pipeline

### Description
Add GitHub Actions workflow and deployment scripts for automated deployment to a remote server via SSH on main branch commits.

### Prompt
```
In /.github/workflows, create a GitHub Actions workflow that triggers on pushes to main. The workflow should build the TypeScript project, run tests, and deploy the service to a remote server using SSH commands. Ensure .env files and sensitive credentials are handled securely (use GitHub Secrets for deployment keys). In /scripts, provide scripts for starting the service and managing logs. Document the deployment process in README.md.
```

### Expected Output
GitHub Actions YAML file, deployment scripts, updated README.md with instructions, and validation for secure environment configuration.

### Testing Instructions
Push a test commit to main and verify that the workflow runs, builds, tests, and deploys the app to the remote server. Check that the deployed service is running and accessible. Review logs for deployment and runtime errors.

/**
 * Claude Skills Catalog - main entry point.
 * Starts Express server with REST API and MCP integration.
 */
import { startRestServer } from './api/server';
import { logger } from './restLogger';

logger.info('Claude Skills Catalog starting...');
startRestServer();

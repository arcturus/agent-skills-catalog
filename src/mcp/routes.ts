/**
 * MCP HTTP routes: single POST /mcp endpoint for JSON-RPC.
 */
import { Router, Request, Response } from 'express';
import { handleMcpMessage } from './handler';
import type { JsonRpcRequest } from './handler';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (body?.jsonrpc !== '2.0' || !body.method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
    });
  }
  const response = handleMcpMessage(body as JsonRpcRequest);
  res.setHeader('Content-Type', 'application/json');
  res.json(response);
});

export default router;

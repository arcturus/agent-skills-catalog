/**
 * MCP JSON-RPC handler: initialize, tools/list, tools/call.
 * Reuses business logic from REST (listSkills, searchSkills, getSkillById, zip).
 */
import { listSkills, searchSkills, getSkillById } from '../db';
import AdmZip from 'adm-zip';
import type { SkillRow } from '../db';
import { logMcpRequest, logMcpResponse, logMcpError } from './mcpLogger';

const PROTOCOL_VERSION = '2025-11-25';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function skillToJson(row: SkillRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    license: row.license,
    compatibility: row.compatibility,
    metadata: row.metadata,
    disable_model_invocation: !!row.disable_model_invocation,
    source_repo: row.source_repo,
    source_path: row.source_path,
    source_url: row.source_url,
    ingested_at: row.ingested_at,
  };
}

export function handleMcpMessage(body: JsonRpcRequest): JsonRpcResponse {
  const start = Date.now();
  const { id, method } = body;
  logMcpRequest(method, id);

  try {
    if (method === 'initialize') {
      const result = {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: true },
        },
        serverInfo: {
          name: 'claude-skills-catalog',
          version: '1.0.0',
          description: 'List, search, and download Claude Skills from the catalog',
        },
      };
      logMcpResponse(method, id, Date.now() - start);
      return { jsonrpc: '2.0', id, result };
    }

    if (method === 'tools/list') {
      const tools = [
        {
          name: 'list_skills',
          description: 'List all ingested Claude Skills',
          inputSchema: { type: 'object', additionalProperties: false },
        },
        {
          name: 'search_skills',
          description: 'Search skills by name or description',
          inputSchema: {
            type: 'object',
            properties: { q: { type: 'string', description: 'Search query' } },
            required: ['q'],
          },
        },
        {
          name: 'download_skill',
          description: 'Get a skill by ID as zip archive (base64)',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Skill ID' } },
            required: ['id'],
          },
        },
      ];
      logMcpResponse(method, id, Date.now() - start);
      return { jsonrpc: '2.0', id, result: { tools } };
    }

    if (method === 'tools/call') {
      const params = (body.params ?? {}) as { name: string; arguments?: Record<string, unknown> };
      const name = params.name;
      const args = params.arguments ?? {};

      if (name === 'list_skills') {
        const skills = listSkills().map(skillToJson);
        logMcpResponse(method, id, Date.now() - start);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ skills, count: skills.length }, null, 2) }],
            isError: false,
          },
        };
      }

      if (name === 'search_skills') {
        const q = String(args.q ?? '');
        const skills = searchSkills(q).map(skillToJson);
        logMcpResponse(method, id, Date.now() - start);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ skills, count: skills.length, q }, null, 2) }],
            isError: false,
          },
        };
      }

      if (name === 'download_skill') {
        const idArg = args.id;
        const skillId = typeof idArg === 'number' ? idArg : parseInt(String(idArg), 10);
        if (Number.isNaN(skillId)) {
          logMcpResponse(method, id, Date.now() - start);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: 'Invalid skill id' }],
              isError: true,
            },
          };
        }
        const skill = getSkillById(skillId);
        if (!skill) {
          logMcpResponse(method, id, Date.now() - start);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: 'Skill not found' }],
              isError: true,
            },
          };
        }
        const zip = new AdmZip();
        zip.addFile('SKILL.md', Buffer.from(skill.raw_content ?? '', 'utf-8'));
        const zipBuffer = zip.toBuffer();
        const base64 = zipBuffer.toString('base64');
        logMcpResponse(method, id, Date.now() - start);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  filename: `skill-${skill.name.replace(/[^a-z0-9-_]/gi, '-')}-${skillId}.zip`,
                  base64,
                }),
              },
            ],
            isError: false,
          },
        };
      }

      logMcpResponse(method, id, Date.now() - start);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        },
      };
    }

    logMcpResponse(method, id, Date.now() - start);
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  } catch (err) {
    logMcpError(method, err, id);
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err instanceof Error ? err.message : 'Internal error',
      },
    };
  }
}

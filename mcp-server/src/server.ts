import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools, type ToolDeps } from './tools';

/** Build the MapPoster MCP server with all tools registered. */
export function createServer(deps: ToolDeps): McpServer {
  const server = new McpServer({ name: 'mapposter', version: '0.1.0' });
  registerTools(server, deps);
  return server;
}

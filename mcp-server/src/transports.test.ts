import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHttpServer } from './http';

const EXPECTED = ['render_map', 'render_variants', 'geocode_place', 'list_themes', 'list_formats'];

describe('transports expose the same tool set (AC-6)', () => {
  it('lists all tools over stdio', async () => {
    const transport = new StdioClientTransport({ command: 'npx', args: ['tsx', 'mcp-server/src/stdio.ts'] });
    const client = new Client({ name: 'test', version: '0' });
    await client.connect(transport);
    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      for (const e of EXPECTED) expect(names).toContain(e);
    } finally {
      await client.close();
    }
  }, 60_000);

  it('lists all tools over HTTP', async () => {
    const srv = await startHttpServer(0);
    const client = new Client({ name: 'test', version: '0' });
    const transport = new StreamableHTTPClientTransport(new URL(srv.url));
    await client.connect(transport);
    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      for (const e of EXPECTED) expect(names).toContain(e);
    } finally {
      await client.close();
      await srv.close();
    }
  }, 30_000);
});

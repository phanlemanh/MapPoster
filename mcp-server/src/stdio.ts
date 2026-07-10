import { pathToFileURL } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';
import { makeRenderDeps } from './deps';

export async function runStdio(): Promise<void> {
  const server = createServer(makeRenderDeps());
  await server.connect(new StdioServerTransport());
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runStdio().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

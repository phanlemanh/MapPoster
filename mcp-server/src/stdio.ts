import { pathToFileURL } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';
import { makeRenderDeps } from './deps';
import { ensureDist } from './ensureDist';
import { loadServerConfig } from '../config';
import { applyStartupEnv, probeFfmpegAtStartup } from './bootstrap';

export async function runStdio(): Promise<void> {
  const server = createServer(makeRenderDeps());
  await server.connect(new StdioServerTransport());
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  // One-time on a fresh clone: build the render harness before serving it, so the
  // first render doesn't die on a 20s timeout against a missing dist/.
  try {
    ensureDist(loadServerConfig());
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  applyStartupEnv();
  probeFfmpegAtStartup();
  runStdio().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

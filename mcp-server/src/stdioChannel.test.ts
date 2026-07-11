import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { renameSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

// Heavy + destructive: hides dist/ to force the on-first-run build, spawns the
// real stdio server, and restores dist/ afterwards. Gated like the other
// integration test. Run with:
//   MCP_INTEGRATION=1 npx vitest run mcp-server/src/stdioChannel.test.ts
const RUN = process.env.MCP_INTEGRATION === '1';
const suite = RUN ? describe : describe.skip;

const repoRoot = path.resolve(__dirname, '..', '..');
const dist = path.join(repoRoot, 'dist');
const distHidden = path.join(repoRoot, 'dist.__stdiotest_bak');

suite('stdio transport keeps stdout clean while ensureDist builds', () => {
  it('emits ONLY newline-delimited JSON on stdout, even when the first run triggers vite build', async () => {
    // The bug this pins: ensureDist ran `vite build` with stdout inherited onto
    // fd 1, and on the stdio transport fd 1 IS the JSON-RPC channel — so ~14 lines
    // of vite progress corrupted the handshake on exactly the fresh-clone first
    // render the build exists to rescue. A lenient JSON parser hides it; this test
    // is strict: every non-empty stdout line must parse as JSON.
    const hadDist = existsSync(dist);
    if (hadDist) renameSync(dist, distHidden); // force the build path

    const child = spawn('npx', ['-y', 'tsx', 'mcp-server/src/stdio.ts'], {
      cwd: repoRoot,
      env: { ...process.env, MAPPOSTER_APP_PORT: '0', MAPPOSTER_POOL: '1' },
      stdio: ['pipe', 'pipe', 'ignore'], // stderr dropped; only stdout is under test
    });

    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));

    try {
      // Drive the handshake — this is the window the build output used to corrupt.
      child.stdin.write(
        JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } }) + '\n',
      );
      // Give ensureDist time to build (~10s) and the server to answer.
      const gotResponse = await waitFor(() => stdout.includes('"id":1'), 60_000);
      expect(gotResponse, `no JSON-RPC response seen; stdout was:\n${stdout.slice(0, 500)}`).toBe(true);

      const badLines = stdout.split('\n').filter(Boolean).filter((line) => !isJson(line));
      expect(badLines, `non-JSON leaked onto the protocol channel:\n${badLines.slice(0, 5).join('\n')}`).toEqual([]);
    } finally {
      child.kill();
      // Restore the dist/ we stashed. The server may have rebuilt its own; drop
      // that and put the original back.
      if (hadDist && existsSync(distHidden)) {
        if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
        renameSync(distHidden, dist);
      }
    }
  }, 90_000);
});

function isJson(line: string): boolean {
  try {
    JSON.parse(line);
    return true;
  } catch {
    return false;
  }
}

function waitFor(cond: () => boolean, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (cond()) return resolve(true);
      if (Date.now() - start > ms) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
}

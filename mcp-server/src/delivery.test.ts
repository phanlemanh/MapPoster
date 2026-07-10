import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deliver } from './delivery';

// A minimal buffer whose PNG IHDR width/height fields are set.
function fakePng(w: number, h: number): Buffer {
  const b = Buffer.alloc(30);
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

let sinkDir: string;
beforeAll(async () => {
  sinkDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mapposter-sink-'));
});
afterAll(async () => {
  await fs.rm(sinkDir, { recursive: true, force: true });
});

describe('deliver', () => {
  it('mode=both writes a file and returns path + base64 + dims (AC-7)', async () => {
    const r = await deliver(fakePng(1080, 1920), 'shot1', 'both', { sinkDir });
    expect(r.width).toBe(1080);
    expect(r.height).toBe(1920);
    expect(r.format).toBe('png');
    expect(r.path).toBeTruthy();
    expect(r.base64).toBeTruthy();
    await expect(fs.stat(r.path!)).resolves.toBeTruthy();
  });

  it('mode=url writes a file but omits base64', async () => {
    const r = await deliver(fakePng(1000, 1500), 'shot2', 'url', { sinkDir });
    expect(r.path).toBeTruthy();
    expect(r.base64).toBeUndefined();
  });

  it('mode=inline returns base64 only, writes nothing', async () => {
    const r = await deliver(fakePng(800, 600), 'shot3', 'inline', { sinkDir });
    expect(r.base64).toBeTruthy();
    expect(r.path).toBeUndefined();
    await expect(fs.stat(path.join(sinkDir, 'shot3.png'))).rejects.toBeTruthy();
  });
});

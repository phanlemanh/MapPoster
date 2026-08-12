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
    const png = fakePng(1080, 1920);
    const r = await deliver(png, 'shot1', 'both', { sinkDir });
    expect(r.width).toBe(1080);
    expect(r.height).toBe(1920);
    expect(r.format).toBe('png');
    expect(r.path).toBeTruthy();
    expect(r.base64).toBeTruthy();
    await expect(fs.stat(r.path!)).resolves.toBeTruthy();
    // AC-7 nói "tệp PNG tồn tại tại thư mục sink ĐÃ CẤU HÌNH" — `stat` thành
    // công không nói gì về CHỖ tệp nằm, nên ghi ra ngoài sink vẫn xanh.
    expect(path.dirname(r.path!)).toBe(sinkDir);
    expect(path.basename(r.path!)).toBe('shot1.png');
    // Và hai đường giao hàng phải là CÙNG một ảnh: `both` mà tệp trên đĩa lệch
    // byte với base64 trả về (cắt cụt, ghi nhầm buffer) thì caller nhận hai
    // thứ khác nhau mà mọi khẳng định trên đây vẫn xanh.
    expect(await fs.readFile(r.path!)).toEqual(png);
    expect(Buffer.from(r.base64!, 'base64')).toEqual(png);
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

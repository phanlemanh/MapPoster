import { promises as fs } from 'node:fs';
import path from 'node:path';

export type DeliveryMode = 'both' | 'url' | 'inline';

export interface DeliverResult {
  path?: string;
  base64?: string;
  width: number;
  height: number;
  format: 'png';
}

/** Read width/height from a PNG's IHDR chunk (bytes 16–24). */
function pngSize(buf: Buffer): { width: number; height: number } {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Deliver a rendered PNG per the requested mode: write it to the output sink
 * (unless `inline`) and/or include a base64 copy (unless `url`).
 */
export async function deliver(
  png: Buffer,
  name: string,
  mode: DeliveryMode,
  cfg: { sinkDir: string },
): Promise<DeliverResult> {
  const { width, height } = pngSize(png);
  const res: DeliverResult = { width, height, format: 'png' };

  if (mode !== 'inline') {
    await fs.mkdir(cfg.sinkDir, { recursive: true });
    const file = path.join(cfg.sinkDir, name.endsWith('.png') ? name : `${name}.png`);
    await fs.writeFile(file, png);
    res.path = file;
  }
  if (mode !== 'url') {
    res.base64 = png.toString('base64');
  }
  return res;
}

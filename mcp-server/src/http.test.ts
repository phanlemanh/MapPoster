import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { readJsonBody } from './http';

describe('readJsonBody', () => {
  it('decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)', async () => {
    const location = 'Võ Văn Tần, Quận 3, TP.HCM';
    const buf = Buffer.from(JSON.stringify({ location }), 'utf8');

    // split INSIDE the multibyte 'ậ' of "Quận" — `data += chunk` would decode each
    // half separately and produce U+FFFD replacement characters
    const marker = Buffer.from('ậ', 'utf8');
    const cut = buf.indexOf(marker) + 1;
    expect(cut).toBeGreaterThan(0);

    const stream = Readable.from([buf.subarray(0, cut), buf.subarray(cut)]);
    await expect(readJsonBody(stream)).resolves.toEqual({ location });
  });

  it('handles an inline GeoJSON payload spread over many chunks', async () => {
    const geojson = { type: 'FeatureCollection', features: Array.from({ length: 200 }, () => ({ type: 'Feature', properties: { name: 'Phường Bến Nghé' }, geometry: { type: 'Point', coordinates: [106.7, 10.78] } })) };
    const buf = Buffer.from(JSON.stringify({ geojson }), 'utf8');
    const chunks: Buffer[] = [];
    for (let i = 0; i < buf.length; i += 137) chunks.push(buf.subarray(i, i + 137)); // odd size ⇒ splits multibyte chars
    const parsed = (await readJsonBody(Readable.from(chunks))) as typeof geojson extends unknown ? { geojson: { features: unknown[] } } : never;
    expect(parsed.geojson.features).toHaveLength(200);
  });

  it('rejects invalid JSON', async () => {
    await expect(readJsonBody(Readable.from([Buffer.from('{oops')]))).rejects.toThrow();
  });

  it('resolves undefined for an empty body', async () => {
    await expect(readJsonBody(Readable.from([]))).resolves.toBeUndefined();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) => {
    if (typeof input === 'string' && input.toLowerCase().startsWith('zzz')) throw new Error(`No geocoding result for "${input}"`);
    return typeof input === 'string'
      ? { center: [106.7, 10.78], zoom: 12, place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } };
  }),
  searchCandidates: vi.fn(async (q: string) =>
    q.toLowerCase().startsWith('zzz')
      ? []
      : [
          { name: 'Nguyen Hue Boulevard', country: 'Vietnam', lng: 106.7, lat: 10.77, zoom: 15, displayName: 'Nguyen Hue Boulevard, …' },
          { name: 'Ho Chi Minh City Hall', country: 'Vietnam', lng: 106.7, lat: 10.776, zoom: 15, displayName: 'Ho Chi Minh City Hall, …' },
        ],
  ),
  resolveBoundary: vi.fn(async () => ({
    geojson: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
    },
    osmType: 'relation',
    osmId: 1973756,
    displayName: 'District 1, Ho Chi Minh City, Vietnam',
    placeRank: 18,
  })),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

import { makeTools, resolvedOfClip, type ToolResult } from './tools';
import { listFormats } from './resolveConfig';
import * as geocode from './geocode';
import type { RenderConfig } from '../../src/render/renderConfig';
import type { ClipAnchors } from '../../src/render/anchors';

function fakePng(w: number, h: number): Buffer {
  const b = Buffer.alloc(30);
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

/**
 * Anchors mà một lần render clip thật sẽ trả về, DẪN XUẤT TỪ `cfg` chứ không
 * phải hằng số: `zoom + 1` khiến `resolved.camera` không thể trùng `resolved.zoom`
 * một cách tình cờ, nên một hiện thực echo lại `cfg.camera` (thay vì camera nghỉ
 * mà renderer đo được) sẽ đỏ thay vì xanh nhầm.
 */
function fakeAnchors(cfg: RenderConfig): ClipAnchors {
  return {
    camera: { center: cfg.camera.center, zoom: cfg.camera.zoom + 1, bearing: 0, pitch: 0 },
    points: (cfg.markers ?? []).map((m, index) => ({ index, lng: m.lng, lat: m.lat, xPct: 50, yPct: 50 + index, onScreen: true })),
    regions: (cfg.highlight?.regions ?? []).map((_r, index) => ({
      index,
      bboxCenterPct: [50, 50] as [number, number],
      bboxPct: [10, 20, 90, 80] as [number, number, number, number],
    })),
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const textJson = (res: ToolResult) => JSON.parse((res.content.find((c: any) => c.type === 'text') as any).text);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const imageBlocks = (res: ToolResult) => res.content.filter((c: any) => c.type === 'image');

let sinkDir: string;
let lastCfg: RenderConfig | undefined;
const render = vi.fn(async (cfg: RenderConfig) => {
  lastCfg = cfg;
  return fakePng(cfg.size.width, cfg.size.height);
});

beforeEach(async () => {
  sinkDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-tools-'));
  lastCfg = undefined;
  render.mockClear();
});
afterEach(async () => {
  await fs.rm(sinkDir, { recursive: true, force: true });
});

const tools = () => makeTools({ render, sinkDir, defaultDelivery: 'both' });

const renderAnimation = vi.fn(async (cfg: RenderConfig, opts: { frames: number }) => {
  lastCfg = cfg;
  return Array.from({ length: opts.frames }, () => fakePng(cfg.size.width, cfg.size.height));
});
const encodeAnimation = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
  await fs.writeFile(opts.outPath, 'x');
  return opts.outPath;
});
const animTools = () => makeTools({ render, renderAnimation, encodeAnimation, sinkDir, defaultDelivery: 'both' });

describe('render_map', () => {
  it('renders and echoes resolved center/place (AC-1)', async () => {
    const res = await tools().render_map({ location: 'HCMC', format: 'tiktok' });
    const j = textJson(res);
    // `j.image.*` đọc IHDR của CHÍNH buffer renderer trả về (delivery.ts:14),
    // nhưng renderer giả sinh buffer từ `cfg.size` — vòng khép kín, nên riêng
    // hai dòng này KHÔNG thể mâu thuẫn với thứ được yêu cầu. Mắt xích thật sự
    // phân biệt được ở lane này là: `format` có dịch thành `cfg.size` mà
    // renderer nhận hay không.
    expect(lastCfg?.size).toEqual({ width: 1080, height: 1920 });
    expect(j.image.width).toBe(1080);
    expect(j.image.height).toBe(1920);
    expect(j.resolved.center).toEqual([106.7, 10.78]);
    expect(imageBlocks(res)).toHaveLength(1);
  });

  it('AC-1: kích thước trong phản hồi đọc từ PNG THẬT SỰ ra đời, không phải từ cái được YÊU CẦU', async () => {
    // Mắt xích còn lại của AC-1. Renderer giả mặc định sinh buffer theo
    // `cfg.size`, nên "yêu cầu 1080×1920 ⇒ phản hồi nói 1080×1920" là một vòng
    // khép kín — nó đúng kể cả khi phản hồi chỉ echo lại request. Ở đây renderer
    // CỐ Ý bất đồng: xin tiktok mà trả về một PNG 640×480. Phản hồi phải nói
    // 640×480 (sự thật của ảnh), không phải 1080×1920 (điều đã hỏi).
    const liar = vi.fn(async (cfg: RenderConfig) => {
      lastCfg = cfg;
      return fakePng(640, 480);
    });
    const j = textJson(await makeTools({ render: liar, sinkDir, defaultDelivery: 'both' }).render_map({ location: 'HCMC', format: 'tiktok' }));
    expect(lastCfg?.size).toEqual({ width: 1080, height: 1920 }); // yêu cầu vẫn tới nơi
    expect(j.image.width).toBe(640);
    expect(j.image.height).toBe(480);
  });

  it('echoes the resolved theme and highlights, per the tool contract', async () => {
    const res = await tools().render_map({
      location: 'HCMC',
      theme: 'ruby',
      highlight: { regions: ['District 1'], points: [{ lng: 106.7, lat: 10.78 }] },
    });
    const { resolved } = textJson(res);
    expect(resolved.theme).toBe('ruby');
    expect(resolved.highlights.regions).toHaveLength(1);
    expect(resolved.highlights.regions[0].bbox).toEqual([106.6, 10.7, 106.8, 10.9]);
    expect(resolved.highlights.points).toEqual([{ lng: 106.7, lat: 10.78 }]);
  });

  it('returns a structured error for an unknown theme rather than a default-themed poster', async () => {
    const res = await tools().render_map({ location: 'HCMC', theme: 'rubby' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/Unknown theme: rubby/);
    expect(render).not.toHaveBeenCalled();
  });

  it('custom format dims flow through (AC-8)', async () => {
    const res = await tools().render_map({ location: 'HCMC', format: { width: 1234, height: 567 } });
    expect(textJson(res).image.width).toBe(1234);
    expect(textJson(res).image.height).toBe(567);
  });

  it('chrome defaults clean, poster honored (AC-9)', async () => {
    await tools().render_map({ location: 'HCMC' });
    expect(lastCfg?.chrome).toBe('clean');
    await tools().render_map({ location: 'HCMC', chrome: 'poster' });
    expect(lastCfg?.chrome).toBe('poster');
  });

  it('ungeocodable input → structured error, no throw (AC-11)', async () => {
    const res = await tools().render_map({ location: 'zzzzz-not-a-place' });
    expect(res.isError).toBe(true);
    expect(textJson(res).ok).toBe(false);
  });

  it('invalid custom dims → structured error, never renders a blank PNG (F4 / AC-11)', async () => {
    for (const format of [{ width: 0, height: 0 }, { width: -1, height: 100 }, { width: 99999, height: 100 }]) {
      const res = await tools().render_map({ location: 'HCMC', format });
      expect(res.isError).toBe(true);
      expect(textJson(res).ok).toBe(false);
    }
    expect(render).not.toHaveBeenCalled(); // we never reach the renderer with a bad size
  });

  it('region with no boundary → structured error, not a silently unhighlighted poster (F2 / AC-2)', async () => {
    vi.mocked(geocode.resolveBoundary).mockResolvedValueOnce(null);
    const res = await tools().render_map({ location: 'HCMC', highlight: { regions: ['Nowhere-with-no-polygon'] } });
    expect(res.isError).toBe(true);
    expect(textJson(res).ok).toBe(false);
    expect(render).not.toHaveBeenCalled();
  });
});

describe('routes + measure (PR #2)', () => {
  it('reaches the render config and echoes resolved.routes with a self-describing length name', async () => {
    const res = await tools().render_map({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.85, 21.02], [105.86, 21.02], [105.86, 21.03]], color: '#ff0000', width: 8 }],
    });

    // tới được config => tới được pixel: applyRenderConfig set store.routes và
    // mapStyle đã dựng layer route-line từ trước.
    expect(lastCfg?.routes).toHaveLength(1);
    expect(lastCfg?.routes?.[0]).toMatchObject({ color: '#ff0000', width: 8 });

    const j = textJson(res);
    expect(j.resolved.routes[0].pointCount).toBe(3);
    expect(j.resolved.routes[0].lengthKm).toBeGreaterThan(2);
    expect(j.resolved.routes[0]).not.toHaveProperty('km');
  });

  it('omits routes and measures entirely when the call uses neither', async () => {
    const j = textJson(await tools().render_map({ location: { lng: 105.85, lat: 21.02 } }));
    expect(j.resolved).not.toHaveProperty('routes');
    expect(j.resolved).not.toHaveProperty('measures');
  });

  it('echoes straight-line distance and bearing for a requested point pair', async () => {
    const j = textJson(await tools().render_map({
      location: { lng: 105.85, lat: 21.02 },
      highlight: { points: [{ lng: 105.8342, lat: 21.0278 }, { lng: 106.6297, lat: 10.8231 }] },
      measure: { pairs: [[0, 1]] },
    }));

    expect(j.resolved.measures.pairs[0].straightLineKm).toBeGreaterThan(1132);
    expect(j.resolved.measures.pairs[0].straightLineKm).toBeLessThan(1143);
    expect(j.resolved.measures.pairs[0]).toMatchObject({ from: 0, to: 1 });
  });

  it('refuses a route that carries both geojson and coords', async () => {
    const res = await tools().render_map({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.85, 21.02], [105.86, 21.02]], geojson: { type: 'FeatureCollection', features: [] } }],
    } as never);
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/exactly one of/);
  });
});

describe('render_variants', () => {
  it('renders one image per variant (AC-5)', async () => {
    render.mockClear();
    const res = await tools().render_variants({
      base: { location: 'HCMC', format: 'tiktok' },
      variants: [{ theme: 'ocean' }, { theme: 'ruby' }, { theme: 'midnight-blue' }],
    });
    expect(textJson(res).count).toBe(3);
    expect(imageBlocks(res)).toHaveLength(3);
    // "N vào ⇒ N ra" một mình không phân biệt được một hiện thực render đúng
    // config base N lần rồi trả N bản sao. Mỗi variant phải mang CHÍNH ghi đè
    // của nó xuống renderer, và ra tới `resolved` mà caller đọc.
    expect(render).toHaveBeenCalledTimes(3);
    expect(render.mock.calls.map(([cfg]) => cfg.theme)).toEqual(['ocean', 'ruby', 'midnight-blue']);
    expect(textJson(res).results.map((r: { resolved: { theme: string } }) => r.resolved.theme)).toEqual(['ocean', 'ruby', 'midnight-blue']);
  });

  it('a variant cannot smuggle out-of-range values past the boundary guard (R2-MEDIUM)', async () => {
    for (const variant of [{ camera: { zoom: 99 } }, { location: { lng: 999, lat: 0 } }, { format: { width: 0, height: 0 } }]) {
      const res = await tools().render_variants({ base: { location: 'HCMC', format: 'tiktok' }, variants: [variant] });
      expect(res.isError).toBe(true);
      expect(textJson(res).ok).toBe(false);
    }
    expect(render).not.toHaveBeenCalled();
  });
});

describe('VN address UX', () => {
  it('placeName overrides the geocoder-derived poster label', async () => {
    const res = await tools().render_map({ location: 'Võ Văn Tần, Quận 3, TP.HCM', placeName: 'Võ Văn Tần, Quận 3' });
    expect(textJson(res).resolved.place.name).toBe('Võ Văn Tần, Quận 3');
    expect(lastCfg?.place.name).toBe('Võ Văn Tần, Quận 3');
  });

  it('without placeName the geocoder label is used', async () => {
    const res = await tools().render_map({ location: 'HCMC' });
    expect(textJson(res).resolved.place.name).toBe('HCMC');
  });

  it('geocode_place returns candidates for disambiguation, not just the top hit', async () => {
    const j = textJson(await tools().geocode_place({ query: 'Lê Lợi, Quận 1, TP.HCM' }));
    expect(j.candidates).toHaveLength(2);
    expect(j.best.name).toBe('Nguyen Hue Boulevard');
  });

  it('geocode_place surfaces a structured error when nothing matches', async () => {
    const res = await tools().geocode_place({ query: 'zzzzz-nowhere' });
    expect(res.isError).toBe(true);
  });
});

describe('discovery tools', () => {
  it('list_formats includes tiktok 1080×1920 (AC-8)', async () => {
    const j = textJson(await tools().list_formats());
    expect(j.formats.some((f: { name: string; width: number; height: number }) => f.name === 'tiktok' && f.width === 1080 && f.height === 1920)).toBe(true);
  });
  it('list_themes returns all 13 themes', async () => {
    expect(textJson(await tools().list_themes()).themes).toHaveLength(13);
  });
  it('list_themes exposes the full palette so agents can match overlay colors', async () => {
    const { themes } = textJson(await tools().list_themes());
    expect(themes).toHaveLength(13);
    expect(themes[0]).toMatchObject({ id: 'midnight-blue', dark: true });
    expect(themes[0].colors.background).toMatch(/^#/);
    expect(Object.keys(themes[0].colors)).toContain('accent');
  });

  it('MỖI theme trong 13 cái đều đủ id/name/dark và ĐÚNG 15 khoá bảng màu', async () => {
    // Bản cũ chỉ soi `themes[0]`. Một hồi quy bỏ một khoá bảng màu ở CẢ 13
    // theme vẫn xanh, và trường `name` mà AC-9 đòi thì không khẳng định nào
    // chạm tới. "Mỗi cái" và "15 khoá" phải được canh gác đúng như đã hứa.
    const { themes } = textJson(await tools().list_themes());
    expect(themes).toHaveLength(13);

    const KEYS = Object.keys(themes[0].colors).sort();
    expect(KEYS).toHaveLength(15);

    for (const t of themes as { id: string; name: string; dark: boolean; colors: Record<string, string> }[]) {
      expect(typeof t.id, t.id).toBe('string');
      expect(t.id.length, t.id).toBeGreaterThan(0);
      expect(typeof t.name, t.id).toBe('string');
      expect(t.name.length, t.id).toBeGreaterThan(0);
      expect(typeof t.dark, t.id).toBe('boolean');
      // CÙNG bộ khoá cho mọi theme: thiếu một khoá ở một theme là một bản đồ
      // mất hẳn một lớp khi agent đổi tông, chứ không phải sai lệch thẩm mỹ.
      expect(Object.keys(t.colors).sort(), t.id).toEqual(KEYS);
      for (const [k, v] of Object.entries(t.colors)) {
        expect(v, `${t.id}.${k}`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
    }
    // và có cả theme sáng lẫn tối — `dark` không phải hằng số trá hình
    const darks = new Set((themes as { dark: boolean }[]).map((t) => t.dark));
    expect(darks).toEqual(new Set([true, false]));
  });

  it('list_formats dedupes 4k and carries aspect/category/print', async () => {
    const { formats } = textJson(await tools().list_formats());
    expect(formats.filter((f: { name: string }) => f.name === '4k')).toHaveLength(1);
    const tiktok = formats.find((f: { name: string }) => f.name === 'tiktok');
    expect(tiktok).toMatchObject({ aspect: '9:16', category: 'Video' });
    const a4 = formats.find((f: { name: string }) => f.name === 'a4');
    expect(a4.category).toBe('Print');
    expect(a4.print).toEqual({ w: 210, h: 297, unit: 'mm' });
  });

  it('MỖI mục formats có aspect + category, và `print` VẮNG MẶT hẳn ở layout không in', async () => {
    // Nửa CÓ MẶT của `print` đã được canh (a4). Nửa còn lại — "key ABSENT, chứ
    // không phải undefined" — chưa từng có khẳng định nào, mà đó mới là mệnh đề
    // khó: JSON.stringify nuốt `undefined`, nên một hiện thực gán
    // `print: undefined` cho mọi mục trông y hệt qua dây, và chỉ `in` phân biệt
    // được hai thứ đó ở phía object.
    const { formats } = textJson(await tools().list_formats());
    expect(formats.length).toBeGreaterThan(0);

    let printed = 0;
    for (const f of formats as { name: string; aspect: string; category: string; print?: unknown }[]) {
      expect(typeof f.aspect, f.name).toBe('string');
      expect(f.aspect, f.name).toMatch(/^\d+:\d+$/);
      expect(typeof f.category, f.name).toBe('string');
      expect(f.category.length, f.name).toBeGreaterThan(0);

      if (f.category === 'Print') {
        printed++;
        expect(f.print, f.name).toMatchObject({ unit: expect.stringMatching(/^(mm|in)$/) });
      } else {
        expect(f.print, f.name).toBeUndefined();
      }
    }
    expect(printed).toBeGreaterThan(0); // có thật mục Print, không phải nhánh chết
  });

  it('`print` VẮNG MẶT hẳn khỏi object — đo TRƯỚC JSON, vì JSON nuốt undefined', async () => {
    // Mệnh đề "key ABSENT, không phải undefined" KHÔNG đo được qua `textJson`:
    // `JSON.stringify` bỏ hẳn mọi giá trị undefined, nên `{print: undefined}`
    // và object không có khoá `print` ra dây y hệt nhau. Đo ở chính hàm dựng —
    // đó là nơi khác biệt còn tồn tại, và là nơi mọi consumer trong tiến trình
    // nhìn thấy nó.
    const formats = listFormats();
    let absent = 0;
    let present = 0;
    for (const f of formats) {
      if (f.category === 'Print') {
        expect(Object.hasOwn(f, 'print'), f.name).toBe(true);
        present++;
      } else {
        // `toBeUndefined()` ở đây sẽ xanh cả với `print: undefined` — chính là
        // thứ phải loại trừ. Chỉ `hasOwn` phân biệt được.
        expect(Object.hasOwn(f, 'print'), f.name).toBe(false);
        absent++;
      }
    }
    expect(present).toBeGreaterThan(0);
    expect(absent).toBeGreaterThan(0);
  });

  it('MỌI mục — cả 21 — có aspect và category ĐÚNG GIÁ TRỊ THẬT, không chỉ đúng kiểu', async () => {
    // Vòng lặp ở ca trên chỉ soi HÌNH DẠNG (`aspect` khớp /\d+:\d+/, `category`
    // là chuỗi khác rỗng). Một hiện thực gán `aspect: '1:1'` cho tất cả, hoặc
    // dán `category: 'Video'` lên toàn bảng — đúng cái bug Finding 4 — vẫn qua
    // được vòng lặp đó. AC-10 hứa "đúng loại THẬT của nó", nên bảng dưới đây
    // ghim từng mục một, và đối chiếu HAI CHIỀU: không mục nào của hiện thực
    // thiếu trong bảng, không dòng nào của bảng biến mất khỏi hiện thực.
    const EXPECTED: Record<string, { aspect: string; category: string }> = {
      tiktok: { aspect: '9:16', category: 'Video' },
      story: { aspect: '9:16', category: 'Social' },
      square: { aspect: '1:1', category: 'Social' },
      landscape: { aspect: '16:9', category: 'Video' },
      portrait: { aspect: '4:5', category: 'Social' },
      // '4k' thắng va chạm tên với LAYOUTS — category phải là của mục nó nuốt
      '4k': { aspect: '16:9', category: 'Wallpaper' },
      a3: { aspect: '437:620', category: 'Print' },
      a4: { aspect: '620:877', category: 'Print' },
      a5: { aspect: '437:620', category: 'Print' },
      letter: { aspect: '17:22', category: 'Print' },
      'ig-square': { aspect: '1:1', category: 'Social' },
      'ig-story': { aspect: '9:16', category: 'Social' },
      linkedin: { aspect: '4:5', category: 'Social' },
      pinterest: { aspect: '2:3', category: 'Social' },
      fhd: { aspect: '16:9', category: 'Wallpaper' },
      ultrawide: { aspect: '43:18', category: 'Wallpaper' },
      iphone: { aspect: '131:284', category: 'Wallpaper' },
      ipad: { aspect: '139:199', category: 'Wallpaper' },
      'web-wide': { aspect: '16:9', category: 'Web' },
      'web-banner': { aspect: '40:21', category: 'Web' },
      'web-portrait': { aspect: '4:5', category: 'Web' },
    };

    const { formats } = textJson(await tools().list_formats());
    const seen = new Set<string>();
    for (const f of formats as { name: string; width: number; height: number; aspect: string; category: string }[]) {
      expect(EXPECTED[f.name], `mục '${f.name}' không có trong bảng ghim — thêm mục mới phải ghim luôn aspect/category`).toBeDefined();
      expect({ aspect: f.aspect, category: f.category }, f.name).toEqual(EXPECTED[f.name]);
      seen.add(f.name);
    }
    expect([...seen].sort()).toEqual(Object.keys(EXPECTED).sort());

    // và `aspect` phải là tỉ số RÚT GỌN của chính width/height mục đó — nếu
    // bảng trên và hiện thực cùng trôi khỏi kích thước thật thì dòng này bắt.
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    for (const f of formats as { name: string; width: number; height: number; aspect: string }[]) {
      const g = gcd(f.width, f.height);
      expect(f.aspect, f.name).toBe(`${f.width / g}:${f.height / g}`);
    }
  });

  it('gives every FORMATS entry its own correct category, not a blanket Video (Finding 4)', async () => {
    // A hardcoded `category: 'Video'` for every FORMATS entry mislabeled
    // square/story/portrait (all image-first social formats) as Video, and
    // shadowed the Wallpaper '4k' from LAYOUTS with a mislabeled Video '4k' —
    // an agent filtering category === 'Social' got nothing for tiktok/story.
    const { formats } = textJson(await tools().list_formats());
    const byName = (name: string) => formats.find((f: { name: string }) => f.name === name);

    expect(byName('tiktok').category).toBe('Video'); // genuinely video-first
    expect(byName('landscape').category).toBe('Video'); // genuinely video-first
    expect(byName('story').category).toBe('Social'); // 1080x1920, an Instagram/FB Story format
    expect(byName('square').category).toBe('Social'); // 1080x1080, an Instagram square post
    expect(byName('portrait').category).toBe('Social'); // 1080x1350, Instagram's 4:5 portrait post ratio
    // '4k' wins the name collision with LAYOUTS's Desktop 4K Wallpaper entry
    // (identical 3840x2160) — its category must match what it dedupes away,
    // not be silently relabeled Video.
    expect(byName('4k').category).toBe('Wallpaper');
  });
});

describe('list_fonts (PR #3)', () => {
  it('exposes every font render_map accepts, with its typographic metadata', async () => {
    // MỌI mục, không phải `fonts[0]`: bản cũ chỉ soi mục đầu, nên một mục thứ
    // tư thiếu hẳn `titleWeight` vẫn xanh. Đi theo đúng tiền lệ của
    // `list_themes` ngay phía trên — vòng lặp qua cả 13 theme.
    // `titleTracking` được AC-10 gọi tên nhưng trước đây KHÔNG khẳng định nào
    // trong kho chạm tới; nó vào vòng lặp này cùng bốn trường kia.
    const { fonts } = textJson(await tools().list_fonts());
    expect(fonts).toHaveLength(6);
    expect(fonts[0]).toMatchObject({ key: 'Space Grotesk' });

    const keys = new Set<string>();
    for (const f of fonts as { key: string; stack: string; titleWeight: number; titleTracking: number; uppercaseTitle: boolean }[]) {
      expect(typeof f.key, f.key).toBe('string');
      expect(f.key.length, f.key).toBeGreaterThan(0);
      expect(keys.has(f.key), `trùng key ${f.key}`).toBe(false);
      keys.add(f.key);

      // stack phải nói về CHÍNH phông đó — một stack chép chung cho cả sáu mục
      // (lỗi copy-paste kinh điển của bảng này) bị bắt ở đây.
      expect(typeof f.stack, f.key).toBe('string');
      expect(f.stack, f.key).toContain(f.key);
      expect(f.stack, f.key).toMatch(/,\s*(sans-serif|serif|monospace)$/);

      // titleWeight là trọng lượng CSS thật, không phải một số bất kỳ
      expect(typeof f.titleWeight, f.key).toBe('number');
      expect(Number.isInteger(f.titleWeight), f.key).toBe(true);
      expect(f.titleWeight, f.key).toBeGreaterThanOrEqual(100);
      expect(f.titleWeight, f.key).toBeLessThanOrEqual(900);

      // titleTracking: em, không phải px — dải hẹp quanh 0 phân biệt hai đơn vị
      expect(typeof f.titleTracking, f.key).toBe('number');
      expect(Number.isFinite(f.titleTracking), f.key).toBe(true);
      expect(f.titleTracking, f.key).toBeGreaterThanOrEqual(0);
      expect(f.titleTracking, f.key).toBeLessThanOrEqual(0.2);

      expect(typeof f.uppercaseTitle, f.key).toBe('boolean');
    }

    // và ba trường biến thiên KHÔNG phải hằng số trá hình: nếu cả sáu mục cùng
    // một giá trị thì bảng này không mang thông tin nào cho agent.
    const distinct = (pick: (f: { titleWeight: number; titleTracking: number; uppercaseTitle: boolean }) => unknown) =>
      new Set((fonts as { titleWeight: number; titleTracking: number; uppercaseTitle: boolean }[]).map(pick)).size;
    expect(distinct((f) => f.titleWeight)).toBeGreaterThan(1);
    expect(distinct((f) => f.titleTracking)).toBeGreaterThan(1);
    expect(distinct((f) => f.uppercaseTitle)).toBe(2); // có cả true lẫn false
  });

  it('lists ONLY names render_map actually accepts — a listed-but-rejected font is a trap', async () => {
    const { fonts } = textJson(await tools().list_fonts());
    for (const f of fonts) {
      const res = await tools().render_map({ location: { lng: 105.85, lat: 21.02 }, font: f.key });
      expect(res.isError).toBeFalsy();
    }
  });
});

describe('render_animation', () => {
  const point = { highlight: { points: [{ lng: 106.7, lat: 10.78 }] } };

  it('rejects when there is no highlight point to pulse around', async () => {
    const res = await animTools().render_animation({ location: 'HCMC' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/highlight\.points/);
  });

  it('captures frames once and encodes every requested format', async () => {
    renderAnimation.mockClear();
    encodeAnimation.mockClear();
    const res = await animTools().render_animation({
      location: 'HCMC',
      ...point,
      animation: { frames: 8, fps: 10, format: 'both' },
    });
    expect(res.isError).toBeUndefined();
    const j = textJson(res);
    expect(renderAnimation).toHaveBeenCalledTimes(1); // one capture feeds both encodes
    expect(encodeAnimation).toHaveBeenCalledTimes(2);
    expect(j.animation.outputs.map((o: { format: string }) => o.format).sort()).toEqual(['gif', 'mp4']);
    expect(j.animation.frames).toBe(8);
    expect(j.animation.loop).toBe(true);
    expect(imageBlocks(res)).toHaveLength(1); // inline preview frame
  });

  it('defaults GIF to a bounded width and formats to gif-only', async () => {
    encodeAnimation.mockClear();
    const res = await animTools().render_animation({ location: 'HCMC', ...point, format: 'tiktok' });
    expect(res.isError).toBeUndefined();
    expect(encodeAnimation).toHaveBeenCalledTimes(1);
    const opts = encodeAnimation.mock.calls[0][1];
    expect(opts.format).toBe('gif');
    expect(opts.gifWidth).toBe(540);
  });

  it('fails cleanly when the server build has no animation deps', async () => {
    const res = await tools().render_animation({ location: 'HCMC', ...point });
    expect(res.isError).toBe(true);
  });

  it('honours delivery for the preview still (url → no inline base64)', async () => {
    const res = await animTools().render_animation({
      location: { lng: 106.7, lat: 10.78 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      animation: { frames: 4 },
      delivery: 'url',
    });
    expect(res.isError).toBeFalsy();
    expect(imageBlocks(res)).toHaveLength(0); // trước fix: luôn 1 block inline
    expect(textJson(res).image.path).toMatch(/-preview\.png$/);
  });

  it('refuses an animation over MAPPOSTER_CLIP_MAX_BYTES and removes the file', async () => {
    const bigEncode = vi.fn(async (_f: Buffer[], opts: { outPath: string }) => {
      await fs.writeFile(opts.outPath, Buffer.alloc(64)); // stat.size = 64
      return opts.outPath;
    });
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    try {
      const t = makeTools({ render, renderAnimation, encodeAnimation: bigEncode, sinkDir, defaultDelivery: 'both' });
      const res = await t.render_animation({
        location: { lng: 106.7, lat: 10.78 },
        highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
        animation: { frames: 4, format: 'gif' },
      });
      expect(res.isError).toBe(true);
      expect(textJson(res).error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
      const leftovers = (await fs.readdir(sinkDir)).filter((f) => f.endsWith('.gif'));
      expect(leftovers).toHaveLength(0);
    } finally {
      delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
    }
  });

  it('rolls back an already-written gif when format "both" busts the cap on the mp4 output', async () => {
    const partialEncode = vi.fn(async (_f: Buffer[], opts: { format: 'gif' | 'mp4'; outPath: string }) => {
      // gif lands under the cap; mp4 (checked second, per `wanted` order) busts it —
      // keyed off opts.format rather than call order so the test doesn't depend on
      // which format the implementation happens to encode first.
      await fs.writeFile(opts.outPath, Buffer.alloc(opts.format === 'mp4' ? 64 : 5));
      return opts.outPath;
    });
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    try {
      const t = makeTools({ render, renderAnimation, encodeAnimation: partialEncode, sinkDir, defaultDelivery: 'both' });
      const res = await t.render_animation({
        location: { lng: 106.7, lat: 10.78 },
        highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
        animation: { frames: 4, format: 'both' },
      });
      expect(res.isError).toBe(true);
      expect(textJson(res).error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
      const leftovers = (await fs.readdir(sinkDir)).filter((f) => f.endsWith('.gif') || f.endsWith('.mp4'));
      expect(leftovers).toHaveLength(0); // the already-accepted gif must be rolled back, not just the mp4 that tripped the cap
    } finally {
      delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
    }
  });
});

describe('compile_motion (PR #3)', () => {
  // KHÔNG có renderClip/encodeAnimation trong deps: nếu tool đụng tới chúng,
  // test sẽ nổ chứ không âm thầm đi đường render.
  const dryTools = () => makeTools({ render, sinkDir, defaultDelivery: 'url' });

  it('returns the compiled script without spending a single render', async () => {
    render.mockClear();
    const j = textJson(await dryTools().compile_motion({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));

    expect(j.script.camera.length).toBeGreaterThan(1);
    expect(j.fps).toBe(j.script.fps);
    expect(j.durationSec).toBe(j.script.durationSec);
    expect(j.frames).toBe(Math.round(j.script.durationSec * j.script.fps));
    // AC-1 liệt kê `restAtSec` giữa các trường của response, nhưng trước đây
    // KHÔNG khẳng định nào chạm nó — chuỗi `restAtSec` gần đây chỉ là trường
    // ĐẦU VÀO của request. Bỏ nó khỏi response thì cả khối vẫn xanh.
    expect(typeof j.restAtSec).toBe('number');
    expect(j.restAtSec).toBe(j.script.restAtSec);
    expect(j.preset).toBe('pushIn');
    expect(j.resolved.center).toBeDefined();
    // Toàn bộ lý do tool này tồn tại:
    expect(render).not.toHaveBeenCalled();
  });

  it('accepts a raw script, not just a preset', async () => {
    const script = {
      // restAtSec phải <= 0.72×durationSec (invariant R) — 2.8 <= 2.88
      fps: 12, durationSec: 4, restAtSec: 2.8,
      camera: [{ t: 0, center: [105.85, 21.02], zoom: 12 }, { t: 2.8, center: [105.85, 21.02], zoom: 14, ease: 'easeOut' }],
      tracks: [],
    };
    const j = textJson(await dryTools().compile_motion({ location: { lng: 105.85, lat: 21.02 }, motion: { script } }));
    expect(j.script.fps).toBe(12);
    expect(j.frames).toBe(48);
    // Hằng số cứng, KHÔNG phải `j.script.restAtSec`: một hiện thực echo nhầm
    // `durationSec` (4) hay `fps` vào chỗ này vẫn bằng chính nó, nên chỉ con số
    // caller đưa vào mới phân biệt được.
    expect(j.restAtSec).toBe(2.8);
    expect(j.preset).toBeUndefined();
  });

  it('TỪ CHỐI script thô sai khuôn — không echo lại thứ caller đưa vào', async () => {
    // AC-3 nói script thô "được validate", nhưng ca trên chỉ đưa vào một script
    // HỢP LỆ rồi đọc lại nó: một hiện thực bỏ hẳn bước validate và echo nguyên
    // xi input vẫn xanh. Nửa còn thiếu là nửa TỪ CHỐI, và nó phải nằm ở chính
    // `compile_motion` — ca duy nhất chứng minh được validate hiện sống ở
    // `render_clip`, một tool khác, nên không chạm tới đường mã AC-3 nói tới.
    const bad: [string, Record<string, unknown>, RegExp][] = [
      // fps 999 vi phạm motionScriptSchema (z.number().int().min(12).max(30)) —
      // ném ZodError THÔ, phải được prettify thành câu đọc được.
      ['fps ngoài dải', { fps: 999, durationSec: 6, restAtSec: 4, camera: [{ t: 0, center: [105.85, 21.02], zoom: 12 }], tracks: [] }, /fps/i],
      // restAtSec > 0.72×durationSec vi phạm bất biến R — nhánh check KHÁC hẳn
      // nhánh Zod ở trên, nên phải có ca riêng.
      ['restAtSec quá muộn', { fps: 12, durationSec: 6, restAtSec: 5.9, camera: [{ t: 0, center: [105.85, 21.02], zoom: 12 }, { t: 5.9, center: [105.85, 21.02], zoom: 14 }], tracks: [] }, /restAtSec/i],
      // camera rỗng: không có keyframe nào thì không có gì để render.
      ['camera rỗng', { fps: 12, durationSec: 6, restAtSec: 4, camera: [], tracks: [] }, /camera/i],
    ];

    for (const [label, script, msg] of bad) {
      const res = await dryTools().compile_motion({ location: { lng: 105.85, lat: 21.02 }, motion: { script } } as never);
      expect(res.isError, label).toBe(true);
      const j = textJson(res);
      // KHÔNG có script trong phản hồi: "từ chối" mà vẫn kèm script là
      // nhận-rồi-vứt, đúng thứ hợp đồng này từ chối ở mọi chỗ khác.
      expect(j.script, label).toBeUndefined();
      expect(typeof j.error, label).toBe('string');
      expect(j.error, label).toMatch(msg);
      // và câu lỗi là văn xuôi đọc được, không phải mảng issue của Zod
      expect(j.error.startsWith('['), label).toBe(false);
      expect(j.error, label).not.toContain('"code":"invalid_type"');
    }
  });

  it('reports a preset that cannot compile as an error, not an empty script', async () => {
    const res = await dryTools().compile_motion({
      location: { lng: 105.85, lat: 21.02 },
      motion: { preset: 'approach' }, // approach cần highlight.regions
    });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/approach needs highlight\.regions/);
  });

  it('forces chrome clean so the preview cannot disagree with what render_clip renders', async () => {
    const j = textJson(await dryTools().compile_motion({
      location: { lng: 105.85, lat: 21.02 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      chrome: 'poster',
      motion: { preset: 'pushIn' },
    }));
    expect(j.resolved.chrome).toBe('clean');
  });

  it('refuses a missing motion param with the same message render_clip uses', async () => {
    const res = await dryTools().compile_motion({ location: { lng: 105.85, lat: 21.02 } } as never);
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/motion is required/);
  });
});

describe('resolvedOfClip — ĐÚNG MỘT trong hai (PR #6)', () => {
  const cfg = {
    camera: { center: [106.7, 10.78] as [number, number], zoom: 12 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean' as const,
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin' as const, color: '#f43f5e', size: 32 }],
  };

  it('có anchors ⇒ phát camera + anchors, KHÔNG phát anchorsUnavailable', () => {
    const r = resolvedOfClip(cfg, { anchors: fakeAnchors(cfg) }) as Record<string, unknown>;
    expect(r.camera).toEqual({ center: [106.7, 10.78], zoom: 13, bearing: 0, pitch: 0 });
    expect(r.anchors).toBeDefined();
    expect('anchorsUnavailable' in r).toBe(false);
  });

  it('không đo được ⇒ phát anchorsUnavailable, KHÔNG phát anchors lẫn camera', () => {
    const r = resolvedOfClip(cfg, { anchorsUnavailable: 'camera.pitch is 30 — anchors require pitch 0.' }) as Record<string, unknown>;
    expect(r.anchorsUnavailable).toMatch(/pitch/);
    expect('anchors' in r).toBe(false);
    // camera đi cùng anchors: nó là số đo của cùng một lần đọc, không phải
    // echo lại cfg.camera. Không đo được thì cũng không có camera nghỉ.
    expect('camera' in r).toBe(false);
  });

  it('không nhánh nào phát ra CẢ HAI hay KHÔNG GÌ CẢ', () => {
    const outcomes = [{ anchors: fakeAnchors(cfg) }, { anchorsUnavailable: 'lý do bất kỳ' }];
    for (const o of outcomes) {
      const r = resolvedOfClip(cfg, o) as Record<string, unknown>;
      expect(('anchors' in r) !== ('anchorsUnavailable' in r), JSON.stringify(o).slice(0, 40)).toBe(true);
    }
  });
});

describe('render_clip', () => {
  const point = { highlight: { points: [{ lng: 106.7, lat: 10.78 }] } };
  const region = { highlight: { regions: ['District 1'] } };

  const renderClip = vi.fn(async (cfg: RenderConfig) => {
    lastCfg = cfg;
    return {
      frames: [fakePng(cfg.size.width, cfg.size.height), fakePng(cfg.size.width, cfg.size.height)],
      settle: fakePng(cfg.size.width, cfg.size.height),
      anchors: fakeAnchors(cfg),
    };
  });
  const encodeAnimation = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });
  const clipTools = () => makeTools({ render, renderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

  beforeEach(() => {
    renderClip.mockClear();
    encodeAnimation.mockClear();
  });

  it('writes a real MP4 file at clip.path with the expected bytes and a settle file exists on disk', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(res.isError).toBeUndefined();
    const j = textJson(res);

    expect(typeof j.clip.path).toBe('string');
    const written = await fs.readFile(j.clip.path);
    expect(written.toString()).toBe('mp4!');
    expect(j.clip.bytes).toBe(written.length);
    expect(j.clip.fps).toBe(18); // FPS_DEFAULT (motionCompiler.ts) — measured, see Task 9 report
    expect(typeof j.clip.durationSec).toBe('number');
    expect(j.clip.width).toBe(1080);
    expect(j.clip.height).toBe(1920);

    expect(typeof j.settle.path).toBe('string');
    await expect(fs.access(j.settle.path)).resolves.toBeUndefined();
  });

  it('resolved echoes camera + anchors ĐO ĐƯỢC từ lần render này, không phải cfg.camera (PR #6)', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    const j = textJson(res);

    expect(j.resolved.camera).toEqual({ center: lastCfg!.camera.center, zoom: lastCfg!.camera.zoom + 1, bearing: 0, pitch: 0 });
    // Nửa should-NOT: nếu ai đó echo `cfg.camera` cho tiện thì hai con số này
    // trùng nhau và bất biến "camera là camera NGHỈ" chết lặng lẽ.
    expect(j.resolved.camera.zoom).not.toBe(j.resolved.zoom);

    expect(j.resolved.anchors.points).toEqual([{ index: 0, lng: 106.7, lat: 10.78, xPct: 50, yPct: 50, onScreen: true }]);
    expect(j.resolved.anchors.regions).toEqual([]);
    // anchors KHÔNG được nuốt phần resolved cũ
    expect(j.resolved.place).toBeDefined();
    expect(j.resolved.highlights.points).toHaveLength(1);
  });

  it('renderer không đo được anchors ⇒ resolved mang anchorsUnavailable trên MỌI lối ra, không im lặng bỏ trống', async () => {
    const REASON = 'camera.pitch is 30 — anchors require pitch 0.';
    const tiltedClip = vi.fn(async (cfg: RenderConfig) => {
      lastCfg = cfg;
      return {
        frames: [fakePng(cfg.size.width, cfg.size.height)],
        settle: fakePng(cfg.size.width, cfg.size.height),
        anchorsUnavailable: REASON,
      };
    });

    const okJson = textJson(
      await makeTools({ render, renderClip: tiltedClip, encodeAnimation, sinkDir, defaultDelivery: 'both' }).render_clip({
        location: 'HCMC',
        ...point,
        motion: { preset: 'pushIn' },
      }),
    );
    // Clip vẫn ra đời — pitch không làm hỏng clip, chỉ làm anchors mất nghĩa.
    expect(typeof okJson.clip.path).toBe('string');
    expect(okJson.resolved.anchorsUnavailable).toBe(REASON);
    expect('anchors' in okJson.resolved).toBe(false);
    expect('camera' in okJson.resolved).toBe(false);

    const degraded = textJson(
      await makeTools({
        render,
        renderClip: tiltedClip,
        encodeAnimation: vi.fn(async () => {
          throw new Error('ffmpeg boom');
        }),
        sinkDir,
        defaultDelivery: 'both',
      }).render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } }),
    );
    expect(degraded.clipError).toBeDefined();
    expect(degraded.resolved.anchorsUnavailable).toBe(REASON);
    expect('anchors' in degraded.resolved).toBe(false);
  });

  it('resolved.anchors.regions theo đúng thứ tự cfg.highlight.regions', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...region, motion: { preset: 'approach' } });
    const j = textJson(res);
    expect(j.resolved.anchors.regions).toEqual([{ index: 0, bboxCenterPct: [50, 50], bboxPct: [10, 20, 90, 80] }]);
  });

  it('degrade (encode hỏng) và từ chối quá cỡ VẪN mang camera + anchors — chúng đã đo xong rồi', async () => {
    const crashingEncode = vi.fn(async () => {
      throw new Error('ffmpeg boom');
    });
    const degraded = textJson(
      await makeTools({ render, renderClip, encodeAnimation: crashingEncode, sinkDir, defaultDelivery: 'both' }).render_clip({
        location: 'HCMC',
        ...point,
        motion: { preset: 'pushIn' },
      }),
    );
    expect(degraded.clipError).toBeDefined();
    expect(degraded.resolved.camera.zoom).toBe(lastCfg!.camera.zoom + 1);
    expect(degraded.resolved.anchors.points).toHaveLength(1);

    const prevCap = process.env.MAPPOSTER_CLIP_MAX_BYTES;
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '2';
    try {
      const oversize = textJson(
        await makeTools({ render, renderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' }).render_clip({
          location: 'HCMC',
          ...point,
          motion: { preset: 'pushIn' },
        }),
      );
      expect(oversize.ok).toBe(false);
      expect(oversize.resolved.camera.zoom).toBe(lastCfg!.camera.zoom + 1);
      expect(oversize.resolved.anchors.points).toHaveLength(1);
    } finally {
      if (prevCap === undefined) delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
      else process.env.MAPPOSTER_CLIP_MAX_BYTES = prevCap;
    }
  });

  it('motion.restAtSec is 3.9 for pushIn', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(textJson(res).motion.preset).toBe('pushIn');
    expect(textJson(res).motion.restAtSec).toBeCloseTo(3.9, 3);
  });

  it('echoes the compiled MotionScript so agents can inspect and tweak it', async () => {
    const res = await clipTools().render_clip({
      location: { lng: 105.85, lat: 21.03, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.03 }] },
      motion: { preset: 'pushIn' },
    });
    const j = textJson(res);
    expect(j.motion.script).toBeDefined();
    expect(j.motion.script.fps).toBe(j.clip.fps);
    expect(Array.isArray(j.motion.script.camera)).toBe(true);
    expect(j.motion.script.camera.length).toBeGreaterThan(1);
  });

  it('forces chrome clean on the config handed to renderClip even when the caller asks for poster (AC-9)', async () => {
    await clipTools().render_clip({ location: 'HCMC', chrome: 'poster', ...point, motion: { preset: 'pushIn' } });
    expect(lastCfg?.chrome).toBe('clean');
  });

  it('neither preset nor script given → isError', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: {} as any });
    expect(res.isError).toBe(true);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('a valid preset with an out-of-range override surfaces assertValidOverrides\'s range message, not the generic "motion is required" (Finding F)', async () => {
    // fps: 999 used to fail motionParamSchema's OWN z.number().max(30) bound
    // as part of the preset-vs-script union, so the whole union failed and
    // this surfaced the generic "motion is required: ..." message even
    // though a preset object WAS supplied — burying
    // assertValidOverrides's specific, field-named range message
    // (motionCompiler.ts) entirely.
    const res = await clipTools().render_clip({ location: 'HCMC', motion: { preset: 'drift', fps: 999 } });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/fps=999 is out of range/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('approach preset without highlight.regions → isError with an "approach needs" message', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'approach' } });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/approach needs/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('is unavailable (structured error) when the server build has no clip deps', async () => {
    const res = await tools().render_clip({ location: 'HCMC', ...region, motion: { preset: 'approach' } });
    expect(res.isError).toBe(true);
  });

  it('degrade: encode failure → ok(...) with settle + clipError and no clip key; the partial mp4 is not left behind (Finding 1)', async () => {
    // Mimic a real encoder crashing mid-write (ffmpeg killed partway through):
    // the file exists on disk BEFORE the throw, so an implementation that
    // only cleans up on the success path would leak a partial/corrupt file
    // into the PERSISTENT sinkDir forever.
    let leakedPath: string | undefined;
    const crashingEncode = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
      leakedPath = opts.outPath;
      await fs.writeFile(opts.outPath, Buffer.from('partial mp4 bytes from a crashed encoder'));
      throw new Error('ffmpeg encode boom');
    });
    const degradeTools = () => makeTools({ render, renderClip, encodeAnimation: crashingEncode, sinkDir, defaultDelivery: 'both' });

    const res = await degradeTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });

    expect(res.isError).toBeUndefined(); // degrade, not a failure — same as REST
    const j = textJson(res);
    expect('clip' in j).toBe(false);
    expect(typeof j.settle?.path).toBe('string'); // the settle still was still delivered
    expect(typeof j.clipError).toBe('string');
    expect(j.clipError).toMatch(/encode/i);

    expect(leakedPath).toBeDefined();
    await expect(fs.access(leakedPath!)).rejects.toThrow(); // ENOENT — cleaned up, not orphaned in sinkDir
  });

  it('rejects an oversized clip (MAPPOSTER_CLIP_MAX_BYTES) — same drift-guard as REST, settle still delivered, tmp file not left behind (Finding C drift + Finding G)', async () => {
    const prevCap = process.env.MAPPOSTER_CLIP_MAX_BYTES;
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    let writtenPath: string | undefined;
    const bigEncode = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
      writtenPath = opts.outPath;
      await fs.writeFile(opts.outPath, Buffer.alloc(4096, 0x61));
      return opts.outPath;
    });
    const oversizeTools = () => makeTools({ render, renderClip, encodeAnimation: bigEncode, sinkDir, defaultDelivery: 'both' });

    try {
      const res = await oversizeTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
      expect(res.isError).toBe(true); // rejected — not the ok:true encode-failure degrade
      const j = textJson(res);
      expect(j.ok).toBe(false);
      expect(j.error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
      expect('clip' in j).toBe(false);
      expect(typeof j.settle?.path).toBe('string'); // settle still preserved, not thrown away (Finding G)

      expect(writtenPath).toBeDefined();
      await expect(fs.access(writtenPath!)).rejects.toThrow(); // ENOENT — not orphaned in sinkDir
    } finally {
      if (prevCap === undefined) delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
      else process.env.MAPPOSTER_CLIP_MAX_BYTES = prevCap;
    }
  });

  it('a frame-capture failure (renderClip itself throws) still returns an error result — the degrade did not widen', async () => {
    const throwingRenderClip = vi.fn(async () => {
      throw new Error('capture crashed');
    });
    const failTools = () => makeTools({ render, renderClip: throwingRenderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

    const res = await failTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(res.isError).toBe(true);
    expect(textJson(res).ok).toBe(false);
    expect(encodeAnimation).not.toHaveBeenCalled();
  });

  it('a structurally invalid raw script motion produces a readable error string, not a serialized ZodError dump (Finding 2)', async () => {
    // fps: 999 fails motionScriptSchema's z.number().int().min(12).max(30) —
    // validateMotionScript's own schema.parse() throws a RAW z.ZodError here,
    // before any of the R/O/L/B/I invariant checks (which throw a plain Error
    // with a prefix instead). Proven only via the REST test until now.
    const res = await clipTools().render_clip({
      location: 'HCMC',
      ...point,
      motion: {
        script: { fps: 999, durationSec: 6, restAtSec: 5.9, camera: [{ t: 0, center: [106.7, 10.78], zoom: 10 }], tracks: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    expect(res.isError).toBe(true);
    const { error } = textJson(res);
    expect(typeof error).toBe('string');
    expect(error.length).toBeGreaterThan(0);
    // A raw ZodError serialized via String(e) / e.message would be a `[ { ... } ]`
    // issues array containing entries like `"code":"invalid_type"` —
    // prettifyError must turn that into readable prose instead.
    expect(error.startsWith('[')).toBe(false);
    expect(error).not.toContain('"code":"invalid_type"');
  });
});

describe('cost metadata (PR #3)', () => {
  // Fake riêng: trả đúng số khung mà script yêu cầu, như renderer thật. Fake dùng
  // chung ở describe render_clip cố định 2 khung, nên không kiểm được hợp đồng
  // "cost.frames là số khung THẬT SỰ đã render".
  const FRAMES = 7;
  const costRenderClip = vi.fn(async (cfg: RenderConfig) => ({
    frames: Array.from({ length: FRAMES }, () => fakePng(cfg.size.width, cfg.size.height)),
    settle: fakePng(cfg.size.width, cfg.size.height),
    anchors: fakeAnchors(cfg),
  }));
  const costEncode = vi.fn(async (_f: Buffer[], opts: { outPath: string }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });
  const costTools = () => makeTools({ render, renderClip: costRenderClip, encodeAnimation: costEncode, sinkDir, defaultDelivery: 'both' });

  it('reports what the call actually cost, in names that carry their unit', async () => {
    const j = textJson(await costTools().render_clip({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));

    expect(j.cost.frames).toBe(FRAMES); // số khung renderer TRẢ VỀ, không phải số script khai
    expect(typeof j.cost.renderMs).toBe('number');
    expect(typeof j.cost.encodeMs).toBe('number');
    expect(j.cost.renderMs).toBeGreaterThanOrEqual(0);
    expect(j.cost.bytes).toBe(j.clip.bytes);
    // Tên phải mang đơn vị — 'time'/'size' là thứ phía tiêu thụ đoán sai đơn vị.
    expect(j.cost).not.toHaveProperty('time');
    expect(j.cost).not.toHaveProperty('size');
  });

  it('still reports cost on the encode-failure degrade path, where it matters most', async () => {
    const crashingEncode = vi.fn(async () => { throw new Error('ffmpeg exploded'); });
    const t = makeTools({ render, renderClip: costRenderClip, encodeAnimation: crashingEncode, sinkDir, defaultDelivery: 'both' });
    const j = textJson(await t.render_clip({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));
    expect(j.clipError).toBeDefined();
    expect(typeof j.cost.renderMs).toBe('number');   // render ĐÃ xảy ra, đã tốn tiền
    expect(j.cost.bytes).toBe(0);                     // encode thì không
    // Nửa should-NOT-fire: không được có khối `clip` khai thành công khi
    // không có file nào ra đời — cost có mặt KHÔNG được kéo theo clip có mặt.
    expect(j.clip).toBeUndefined();
  });
});

describe('render_clip concurrency gate (Decision 2)', () => {
  const point = { highlight: { points: [{ lng: 106.7, lat: 10.78 }] } };
  const encodeAnimation = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });

  afterEach(() => {
    delete process.env.MAPPOSTER_CLIP_CONCURRENCY;
  });

  it('MAPPOSTER_CLIP_CONCURRENCY=1: a second render_clip call while one is still in flight is rejected, not queued', async () => {
    process.env.MAPPOSTER_CLIP_CONCURRENCY = '1';

    // Held open until the test explicitly lets it finish, so the FIRST call
    // is provably still "in flight" (past prepareClipRender, mid-render)
    // when the SECOND call is issued.
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const renderClip = vi.fn(async (cfg: RenderConfig) => {
      await gate;
      return { frames: [fakePng(cfg.size.width, cfg.size.height)], settle: fakePng(cfg.size.width, cfg.size.height), anchors: fakeAnchors(cfg) };
    });
    const gatedTools = () => makeTools({ render, renderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

    const first = gatedTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    // let the first call actually reach (and hold) its renderClip call before firing the second
    await vi.waitFor(() => expect(renderClip).toHaveBeenCalledTimes(1));

    const second = await gatedTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(second.isError).toBe(true);
    expect(textJson(second).error).toMatch(/Too many concurrent clip renders/);
    expect(renderClip).toHaveBeenCalledTimes(1); // the second call never reached the render step

    releaseFirst();
    const firstResult = await first;
    expect(firstResult.isError).toBeUndefined();

    // slot freed after the first call finished — a third call now succeeds
    const third = await gatedTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(third.isError).toBeUndefined();
  });
});

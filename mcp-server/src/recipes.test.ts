import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) =>
    typeof input === 'string'
      ? { center: [105.85, 21.03], zoom: 12, place: { name: 'Hoàn Kiếm', country: 'Vietnam', lat: 21.03, lng: 105.85 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } },
  ),
  searchCandidates: vi.fn(async () => []),
  resolveBoundary: vi.fn(async () => ({
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [[[105.8, 21.0], [105.9, 21.0], [105.9, 21.06], [105.8, 21.06], [105.8, 21.0]]] },
        },
      ],
    },
    osmType: 'relation',
    osmId: 1234,
    displayName: 'Hoàn Kiếm, Hà Nội, Việt Nam',
    placeRank: 18,
  })),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

import { RECIPES, listRecipes, getRecipe } from './recipes';
import { makeTools, RECIPE_TOOL_SHAPE, type ToolResult } from './tools';
import { prepareClipRender } from './motionCompiler';
import type { RenderConfig } from '../../src/render/renderConfig';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const textJson = (res: ToolResult) => JSON.parse((res.content.find((c: any) => c.type === 'text') as any).text);

function fakePng(w: number, h: number): Buffer {
  const b = Buffer.alloc(30);
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

describe('recipe catalog', () => {
  it('list_recipes advertises region-spotlight with params, duration and an example', () => {
    const { recipes } = listRecipes();
    const r = recipes.find((x) => x.name === 'region-spotlight');
    expect(r).toBeDefined();
    expect(r!.durationSec).toBeGreaterThan(0);
    expect(Object.keys(r!.params).length).toBeGreaterThan(0);
    expect(r!.example.recipe).toBe('region-spotlight');
  });

  // Bất biến chống-tài-liệu-nói-dối #1.
  it.each(Object.keys(RECIPES))('the advertised example for %s actually compiles', (name) => {
    const spec = RECIPES[name];
    const { recipe, ...rest } = spec.example as { recipe: string } & Record<string, unknown>;
    expect(recipe).toBe(name);
    const parsed = spec.schema.safeParse(rest);
    expect(parsed.success, `example for ${name} fails its own schema`).toBe(true);
    // Compile phải chạy được, và phải ra đúng hình dạng render_clip nhận.
    const call = spec.compile(parsed.data as never);
    expect(call.location).toBeDefined();
    expect(call.motion).toBeDefined();
  });

  // Bất biến chống-tài-liệu-nói-dối #2: mô tả tham số không được lệch schema.
  // Thêm một trường vào schema mà quên mô tả (hoặc ngược lại) làm ca này đỏ.
  it.each(Object.keys(RECIPES))('%s: params described == params accepted', (name) => {
    const spec = RECIPES[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaKeys = Object.keys((spec.schema as any).shape ?? {}).sort();
    expect(Object.keys(spec.params).sort()).toEqual(schemaKeys);
  });

  it('refuses an unknown recipe and names the known ones', () => {
    expect(() => getRecipe('khong-co-that')).toThrow(/Unknown recipe: khong-co-that\. Known recipes: .*region-spotlight/);
  });

  // AC-11 — bất biến giữ cho "kế thừa bảo đảm" đúng theo THỜI GIAN, không chỉ
  // đúng hôm nay. Các ca hành vi ở dưới vẫn xanh nếu ai đó thêm một đường
  // render riêng cho recipe; chỉ phép quét cấu trúc này bắt được.
  it('the recipe layer never reaches the renderer itself — it only goes through render_clip', async () => {
    const raw = await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'recipes.ts'), 'utf8');
    // Quét CODE, không quét văn xuôi: comment trong recipes.ts nhắc
    // `deps.renderClip` bằng TÊN khi giải thích chính bất biến này. Một phép
    // quét không bóc comment sẽ trừng phạt việc ghi lại lý do — đúng thứ file
    // đó cần nhiều nhất — và tệ hơn: nó buộc người ta xoá lời giải thích để
    // làm xanh một ca đo, tức đổi tài liệu lấy màu xanh.
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => {
        const s = l.trim();
        return !s.startsWith('//') && !s.startsWith('*');
      })
      .join('\n');
    for (const forbidden of ['deps.renderClip', 'deps.render', 'deps.encodeAnimation', 'renderClipFrames', 'renderFrame']) {
      expect(code, `recipes.ts gọi ${forbidden} — recipe phải uỷ nhiệm qua render_clip, nếu không nó sẽ trôi khỏi AC-9/trần khung/khe clip/nhánh degrade`).not.toContain(forbidden);
    }
  });
});

describe('MCP registration — tầng mà mọi test khác đi vòng qua', () => {
  // Vì sao ca này tồn tại: `render_recipe` từng KHAI với MCP chỉ `{recipe,
  // delivery}`. MCP SDK dựng `z.object(inputSchema)` và Zod LOẠI BỎ khoá không
  // khai, nên qua đúng giao thức agent dùng, một lời gọi hợp lệ trả về
  // "region: Required". Mọi test khác gọi `makeTools()` trực tiếp nên không ca
  // nào chạm tới lỗi đó — nó sống sót qua review, CI, và một lần merge.
  it('the declared MCP input shape covers every parameter every recipe accepts', () => {
    const declared = new Set(Object.keys(RECIPE_TOOL_SHAPE));
    expect(declared.has('recipe')).toBe(true);
    for (const [name, spec] of Object.entries(RECIPES)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const key of Object.keys((spec.schema as any).shape)) {
        expect(declared.has(key), `render_recipe không khai '${key}' với MCP, nên tham số này của recipe '${name}' sẽ bị Zod loại bỏ trước khi tới handler`).toBe(true);
      }
    }
  });

  // Khoá lại GIỚI HẠN, không phải mong muốn. `.strict()` của recipe chỉ nhìn
  // thấy những khoá lọt qua được hình dạng KHAI với MCP; SDK loại bỏ phần còn
  // lại trước đó. Ca này tồn tại để tài liệu không lại hứa rộng hơn thứ đo được
  // — nếu ai đó về sau tìm ra cách từ chối được cả khoá ngoài tập, ca này sẽ đỏ
  // và bắt họ cập nhật README + contract cùng lúc.
  it('a key outside the declared shape is stripped by the boundary, NOT refused by .strict()', () => {
    const parsed = z.object(RECIPE_TOOL_SHAPE).parse({
      recipe: 'region-spotlight',
      region: 'Hoàn Kiếm, Hà Nội',
      khoaRac: 1,
    }) as Record<string, unknown>;
    // ĐÚNG MỘT khẳng định, có chủ đích. Bản đầu của ca này còn kiểm luôn
    // "phần còn lại vẫn hợp lệ" — và negative control cho thấy nó đỏ vì
    // `region` bị mất chứ không vì `khoaRac` còn lại, tức tên ca nói một
    // đằng còn thứ nó gác là một nẻo. Phần kia nay là ca riêng bên dưới.
    expect('khoaRac' in parsed, 'nếu khoá lạ CÒN sau khi parse thì .strict() sẽ bắt được nó — README và contract phải sửa lại').toBe(false);
  });

  it('a key that belongs to ANOTHER recipe does survive the boundary, and .strict() refuses it', () => {
    const parsed = z.object(RECIPE_TOOL_SHAPE).parse({
      recipe: 'region-spotlight',
      region: 'Hoàn Kiếm, Hà Nội',
      pois: ['X'], // tham số của `amenities`, nên nó CÓ trong hình dạng khai
    }) as Record<string, unknown>;
    expect('pois' in parsed).toBe(true);
    const { recipe: _r, ...rest } = parsed;
    expect(RECIPES['region-spotlight'].schema.safeParse(rest).success).toBe(false);
  });

  it('a call parsed through the DECLARED shape still carries the recipe params through', () => {
    // Mô phỏng đúng thứ SDK làm: parse lời gọi bằng z.object(inputSchema).
    const parsed = z.object(RECIPE_TOOL_SHAPE).parse({
      recipe: 'compare-locations',
      subjects: ['A', 'B'],
      reference: 'C',
    });
    expect(parsed).toMatchObject({ recipe: 'compare-locations', subjects: ['A', 'B'], reference: 'C' });
  });
});

describe('region-spotlight compile', () => {
  const compile = (p: Record<string, unknown>) => RECIPES['region-spotlight'].compile(p as never);

  it('frames the camera on the same region it outlines, and dims around it', () => {
    const call = compile({ region: 'Hoàn Kiếm, Hà Nội' });
    // location == region: auto-frame bám bbox của vùng, và country anchor cho
    // highlight cũng rút ra từ đây — nếu hai thứ này tách nhau, một vùng cùng
    // tên ở nước khác có thể kéo cả khung đi.
    expect(call.location).toBe('Hoàn Kiếm, Hà Nội');
    expect(call.highlight?.regions).toEqual(['Hoàn Kiếm, Hà Nội']);
    expect(call.highlight?.dim).toBe(true);
    expect(call.motion).toEqual({ preset: 'approach' });
  });

  it('dim is not a caller-settable parameter — a recipe cannot switch off its own defining trait', () => {
    const parsed = RECIPES['region-spotlight'].schema.safeParse({ region: 'Hoàn Kiếm, Hà Nội', dim: false });
    expect(parsed.success).toBe(false);
    // Và giá trị vẫn là true khi compile từ input hợp lệ.
    expect(compile({ region: 'Hoàn Kiếm, Hà Nội' }).highlight?.dim).toBe(true);
  });

  it('carries an explicit colour through as the object region form', () => {
    const call = compile({ region: 'Hoàn Kiếm, Hà Nội', color: '#e8b04b' });
    expect(call.highlight?.regions).toEqual([{ name: 'Hoàn Kiếm, Hà Nội', color: '#e8b04b' }]);
  });

  it('omits keys the caller did not set instead of passing them as undefined', () => {
    const call = compile({ region: 'Hoàn Kiếm, Hà Nội' });
    expect('theme' in call).toBe(false);
    expect('fps' in (call.motion as object)).toBe(false);
  });

  it('passes fps/durationSec overrides down to the preset', () => {
    const call = compile({ region: 'Hoàn Kiếm, Hà Nội', fps: 12, durationSec: 4 });
    expect(call.motion).toEqual({ preset: 'approach', fps: 12, durationSec: 4 });
  });

  it('what it compiles to is a call the clip pipeline actually accepts (AC-9 chrome forced clean)', async () => {
    const call = compile({ region: 'Hoàn Kiếm, Hà Nội' });
    const prep = await prepareClipRender(call, call.motion);
    try {
      // Không dừng ở "compile không ném": đi qua đúng bộ chuẩn bị mà
      // render_clip dùng, và chốt hai tính chất recipe hứa.
      expect(prep.cfg.chrome).toBe('clean');
      expect(prep.cfg.highlight?.dim).toBe(true);
      expect(prep.motion.restAtSec).toBeGreaterThan(0);
    } finally {
      prep.releaseClipSlot?.();
    }
  });
});

describe('render_recipe', () => {
  let sinkDir: string;
  const render = vi.fn(async (cfg: RenderConfig) => fakePng(cfg.size.width, cfg.size.height));
  const renderClip = vi.fn(async (cfg: RenderConfig) => ({
    frames: [fakePng(cfg.size.width, cfg.size.height), fakePng(cfg.size.width, cfg.size.height)],
    settle: fakePng(cfg.size.width, cfg.size.height),
    anchors: { camera: { center: cfg.camera.center, zoom: cfg.camera.zoom, bearing: 0, pitch: 0 }, points: [], regions: [] },
  }));
  const encodeAnimation = vi.fn(async (_f: Buffer[], opts: { outPath: string }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });
  const tools = () => makeTools({ render, renderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

  beforeEach(async () => {
    sinkDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-recipe-'));
    renderClip.mockClear();
    encodeAnimation.mockClear();
  });
  afterEach(async () => {
    await fs.rm(sinkDir, { recursive: true, force: true });
  });

  it('renders one clip and echoes which recipe produced it', async () => {
    const res = await tools().render_recipe({ recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội' });
    expect(res.isError).toBeFalsy();
    const j = textJson(res);
    expect(j.recipe).toBe('region-spotlight');
    // Uỷ nhiệm thật, không phải đường render thứ hai: hợp đồng của render_clip
    // đi qua nguyên vẹn — clip, settle, motion.script đã compile, resolved.
    expect(j.clip.path).toMatch(/\.mp4$/);
    expect(j.settle).toBeDefined();
    expect(j.motion.preset).toBe('approach');
    expect(j.motion.script.fps).toBeGreaterThan(0);
    expect(j.resolved.anchors ?? j.resolved.anchorsUnavailable).toBeDefined();
    expect(renderClip).toHaveBeenCalledTimes(1);
  });

  it('the clip it renders is the region it was asked for, dimmed', async () => {
    await tools().render_recipe({ recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội', theme: 'ruby' });
    const cfg = renderClip.mock.calls[0][0];
    expect(cfg.highlight?.dim).toBe(true);
    expect(cfg.highlight?.regions).toHaveLength(1);
    expect(cfg.theme).toBe('ruby');
    expect(cfg.chrome).toBe('clean');
  });

  it('refuses an unknown recipe without touching the renderer', async () => {
    const res = await tools().render_recipe({ recipe: 'khong-co-that', region: 'x' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/Unknown recipe/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('refuses a mistyped parameter instead of silently ignoring it', async () => {
    // Caller là agent KHÔNG nhìn thấy ảnh: một tham số bị lờ đi sẽ trả về clip
    // "thành công" nhưng sai nội dung, và không ai phát hiện được.
    const res = await tools().render_recipe({ recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội', them: 'ruby' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/tham số không hợp lệ/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('refuses a missing required parameter before spending a render', async () => {
    const res = await tools().render_recipe({ recipe: 'region-spotlight' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/region/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('echoes the recipe on the failure branch too, not just on success', async () => {
    const boom = vi.fn(async () => {
      throw new Error('encoder exploded');
    });
    const t = makeTools({ render, renderClip, encodeAnimation: boom, sinkDir, defaultDelivery: 'both' });
    const res = await t.render_recipe({ recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội' });
    const j = textJson(res);
    // Nhánh degrade của render_clip: settle sống sót, và caller fan-out nhiều
    // recipe vẫn biết kết quả này thuộc recipe nào — đây là chỗ nó cần biết nhất.
    expect(j.recipe).toBe('region-spotlight');
    expect(j.settle).toBeDefined();
    expect(j.clipError).toMatch(/encode failed/);
  });
});

# PR #0 (spike setNow) + PR #1 (Tier 0 param plumbing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở khoá 12 capability engine đã có sẵn qua tham số MCP/REST + sửa 4 bug production (PR #1), sau khi spike `setNow()` xác định lại chi phí cluster motion (PR #0).

**Architecture:** PR #1 chỉ đụng tầng resolver/schema (`mcp-server/src/`) — engine (`src/render/`, `src/lib/`) đã hỗ trợ mọi field từ trước qua `RenderConfig` (`layers?`, `detail?`, `font?`, `RenderHighlightRegion.color`, `RenderMarker.{icon,color,size}`). PR #0 là spike throwaway trên branch riêng, chỉ merge báo cáo (docs-only → không tốn thuế gate).

**Tech Stack:** TypeScript, Zod, Vitest, MapLibre GL JS, Playwright (headless render), MCP SDK.

## Global Constraints

- **CẤM đụng `src/lib/export.ts` và `src/lib/mapStyle.ts`** — t3_path, kéo theo human judgment re-verify từng criterion (spec §5, nghiên cứu §7).
- Mọi field Zod thêm vào PHẢI có runtime assert tương ứng trong `resolveConfig.ts` — `makeTools` được gọi trực tiếp bỏ qua tầng Zod (pattern hiện có: `assertColor`, `assertTheme`, `assertZoom`).
- Immutability: không mutate object — spread/map để tạo bản mới.
- Không `console.log` trong production code.
- Commit theo conventional commits (`feat:`, `fix:`, `test:`), **không** footer attribution.
- Sau toàn bộ tasks: `npm run verify` phải xanh (typecheck + Vitest + Playwright).
- Thuế acceptance-gate là cố định trên PR: mọi thay đổi code làm stale cả hai hợp đồng T3 (`mcp-map-render`, `map-motion-clip`) — gộp toàn bộ Tier 0 vào MỘT PR, không tách.
- Trước khi code: `bash scripts/pre-merge-check.sh --base main` để chốt baseline stale-set (hiện đang sạch).

---

### Task 0: Spike `setNow()` — PR #0, branch `spike/setnow`, THROWAWAY

Spike khám phá, không theo TDD. Deliverable duy nhất được merge: báo cáo GO/NO-GO.

**Files:**
- Create: `mcp-server/scripts/spike-setnow.ts` (throwaway)
- Modify (throwaway, KHÔNG merge): `src/render/main.tsx`
- Create (merge duy nhất): `docs/research/2026-08-06-setnow-spike.md`

**Câu hỏi spike trả lời:** `maplibregl.setNow(ms)` có thay được bộ máy tự viết `idleOnce` / `waitSourceLoaded` / `verifyAndReapplyGeoAt` / `restBase` trong frame loop không? Nếu có, ms/frame giảm bao nhiêu và determinism (byte-identical) còn giữ không?

- [ ] **Step 0.1: Tạo branch + xác minh API**

```bash
git checkout main && git checkout -b spike/setnow
grep -n -A 20 "setNow" node_modules/maplibre-gl/dist/maplibre-gl.d.ts | head -40
```

Expected: JSDoc của `setNow(time: number)` — override đồng hồ animation toàn cục của MapLibre để frame-step. Ghi lại signature chính xác vào báo cáo.

- [ ] **Step 0.2: Đọc frame loop hiện tại**

Đọc `src/render/main.tsx` (toàn bộ — tập trung `renderClipFrames` handler, vùng `renderMotionFrame` ~dòng 605-626, `verifyAndReapplyGeoAt` ~dòng 502-515) và `mcp-server/src/renderFrame.ts` (hàm `renderClipFrames` ~dòng 131-140). Ghi chú: mỗi frame hiện chờ gì (idle event? source loaded?) và snapshot `restBase` hoạt động thế nào.

- [ ] **Step 0.3: Viết benchmark baseline**

`mcp-server/scripts/spike-setnow.ts` — chạy 2 lần cùng config, đo ms/frame và hash từng frame:

```typescript
import { createHash } from 'node:crypto';
// Dùng đúng bootstrap thật của server — xem mcp-server/scripts/ hiện có
// (check-vn-addresses.ts là mẫu cho cách import) và mcp-server/src/deps.ts
// cho cách renderClip được bind vào pool.
import { createDeps } from '../src/deps';

const CONFIG = {
  location: { lng: 105.8524, lat: 21.0285, zoom: 14 },
  highlight: { points: [{ lng: 105.8524, lat: 21.0285 }] },
  format: 'tiktok',
  motion: { preset: 'pushIn' as const },
};

async function run(label: string) {
  const deps = await createDeps(); // nếu tên khác, lấy từ cách stdio.ts khởi tạo
  const t0 = Date.now();
  // resolveConfig + prepareClipRender + renderClip — mirror luồng tools.ts render_clip
  // ... (điền theo API thật khi đọc deps.ts ở Step 0.2)
  const hashes: string[] = []; // sha256 từng frame Buffer
  console.error(`${label}: totalMs=${Date.now() - t0} frames=${hashes.length}`);
  return hashes;
}

const a = await run('run-1');
const b = await run('run-2');
console.error(`deterministic: ${a.every((h, i) => h === b[i])}`);
```

- [ ] **Step 0.4: Chạy baseline**

```bash
npx vite build && npx tsx mcp-server/scripts/spike-setnow.ts 2>&1 | tee /tmp/spike-baseline.txt
```

Ghi: ms/frame trung bình, determinism true/false.

- [ ] **Step 0.5: Thử nghiệm setNow trong frame loop**

Trong `src/render/main.tsx`, tại frame loop của clip capture: thay cơ chế chờ-idle mỗi frame bằng:

```typescript
import maplibregl from 'maplibre-gl';
// trước khi capture frame i:
maplibregl.setNow(i * (1000 / fps));
map.triggerRepaint();
// chờ MỘT rAF thay vì idle:
await new Promise((r) => requestAnimationFrame(() => r(null)));
```

Giữ nguyên `verifyAndReapplyGeoAt` ở lượt đầu; thử tắt dần từng mảnh (idle wait → restBase snapshot) và đo lại sau mỗi lần tắt. `npx vite build` sau mỗi sửa.

- [ ] **Step 0.6: Chạy experiment + so sánh**

```bash
npx vite build && npx tsx mcp-server/scripts/spike-setnow.ts 2>&1 | tee /tmp/spike-setnow.txt
```

So với baseline: ms/frame, determinism (bắt buộc vẫn true — nếu false ở mọi biến thể → NO-GO), chất lượng frame (mở vài PNG xem tile có trắng/mờ không).

- [ ] **Step 0.7: Viết báo cáo GO/NO-GO**

`docs/research/2026-08-06-setnow-spike.md`: bảng số đo baseline vs setNow (ms/frame, determinism, chất lượng), mảnh nào của bộ máy idle/verify thay được, mảnh nào không, và verdict:
- **GO** → mở follow-up định giá lại cluster motion (các mục L trong nghiên cứu §5 có thể thành S)
- **NO-GO** → ghi lý do đo được; giữ nguyên định giá

- [ ] **Step 0.8: Merge báo cáo, vứt code**

```bash
git checkout main && git checkout -b docs/setnow-spike-report
git checkout spike/setnow -- docs/research/2026-08-06-setnow-spike.md
git add docs/research/2026-08-06-setnow-spike.md
git commit -m "docs(research): kết quả spike setNow — <GO|NO-GO>, <X>ms/frame vs <Y>ms/frame baseline"
# spike/setnow KHÔNG merge — xoá sau khi báo cáo đã vào main
```

---

## PR #1 — branch `feat/tier0-agent-params`

```bash
git checkout main && git checkout -b feat/tier0-agent-params
bash scripts/pre-merge-check.sh --base main   # baseline: cây sạch
```

### Task 1: `layers` + `detail` + `font` params (Tier 0 #1, #2, #5)

Engine đã nhận cả ba qua `RenderConfig` (`src/render/renderConfig.ts:34-37` — `layers?: Partial<LayerState>`, `detail?: number`, `font?: FontKey`; `applyRenderConfig.ts:55` đã đọc `cfg.detail ?? 0.6`). Chỉ thiếu schema + resolver.

**Files:**
- Modify: `mcp-server/src/tools.ts:301-311` (renderMapShape), `mcp-server/src/resolveConfig.ts` (RenderMapParams :9-27, thân resolveConfig :259-268)
- Test: `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- Produces: `RenderMapParams.layers?: Partial<LayerState>`, `.detail?: number (0..1)`, `.font?: FontKey`; lỗi `"Pass either labels or layers.roadLabels, not both"`; lỗi `"Invalid detail: … (must be between 0 and 1)"`; lỗi `"Unknown font: …"`.

- [ ] **Step 1.1: Viết failing tests**

Thêm vào `describe('resolveConfig', …)` trong `mcp-server/src/resolveConfig.test.ts` (file đã mock `./geocode` ở đầu — dùng lại, không mock thêm):

```typescript
it('passes layers, detail and font through to the render config', async () => {
  const cfg = await resolveConfig({
    location: { lng: 106.7, lat: 10.78 },
    layers: { buildings: false, parks: false },
    detail: 0.9,
    font: 'Oswald',
  });
  expect(cfg.layers).toEqual({ buildings: false, parks: false });
  expect(cfg.detail).toBe(0.9);
  expect(cfg.font).toBe('Oswald');
});

it('merges labels:true into layers.roadLabels but refuses both at once', async () => {
  const cfg = await resolveConfig({ location: { lng: 106.7, lat: 10.78 }, labels: true, layers: { water: false } });
  expect(cfg.layers).toEqual({ water: false, roadLabels: true });
  await expect(
    resolveConfig({ location: { lng: 106.7, lat: 10.78 }, labels: true, layers: { roadLabels: false } }),
  ).rejects.toThrow(/either labels or layers\.roadLabels, not both/);
});

it('rejects out-of-range detail and unknown font', async () => {
  await expect(resolveConfig({ location: { lng: 106.7, lat: 10.78 }, detail: 1.5 })).rejects.toThrow(/invalid detail/i);
  await expect(resolveConfig({ location: { lng: 106.7, lat: 10.78 }, font: 'Comic Sans' as never })).rejects.toThrow(/unknown font/i);
});
```

- [ ] **Step 1.2: Chạy xác nhận fail**

```bash
npx vitest run mcp-server/src/resolveConfig.test.ts
```

Expected: 3 test mới FAIL (`cfg.layers` undefined / không throw).

- [ ] **Step 1.3: Implement**

`mcp-server/src/resolveConfig.ts` — mở rộng interface (:9-27):

```typescript
import { FONTS } from '../../src/data/fonts';
import type { FontKey, GeoJSONFeatureCollection, LayerState, MarkerIconKey } from '../../src/types';

export interface RenderMapParams {
  // …các field hiện có giữ nguyên…
  /** Per-layer visibility. Mutually exclusive with `labels` for roadLabels. */
  layers?: Partial<LayerState>;
  /** 0..1 map detail (road-width ramp; minor roads appear strictly above 0.12). */
  detail?: number;
  font?: FontKey;
}
```

Thêm asserts (cạnh `assertZoom`):

```typescript
function assertDetail(d: number): number {
  if (!Number.isFinite(d) || d < 0 || d > 1) throw new Error(`Invalid detail: ${d} (must be between 0 and 1)`);
  return d;
}
function assertFont(key: string): FontKey {
  if (FONTS.some((f) => f.key === key)) return key as FontKey;
  throw new Error(`Unknown font: ${key}. Known fonts: ${FONTS.map((f) => f.key).join(', ')}`);
}
```

Trong `resolveConfig`, khối validate-cheap-first (sau dòng `const color = …` :186):

```typescript
if (params.labels !== undefined && params.layers?.roadLabels !== undefined) {
  throw new Error('Pass either labels or layers.roadLabels, not both — they set the same switch');
}
const detail = params.detail != null ? assertDetail(params.detail) : undefined;
const font = params.font != null ? assertFont(params.font) : undefined;
```

Và return (:259-268) — thay dòng `layers:` cũ:

```typescript
    layers:
      params.layers || params.labels
        ? { ...(params.layers ?? {}), ...(params.labels ? { roadLabels: true } : {}) }
        : undefined,
    detail,
    font,
```

`mcp-server/src/tools.ts` — trong `renderMapShape` (:301-311) thêm:

```typescript
const layerStateSchema = z
  .object({
    landcover: z.boolean(), buildings: z.boolean(), water: z.boolean(), parks: z.boolean(),
    roads: z.boolean(), rail: z.boolean(), aeroway: z.boolean(), roadLabels: z.boolean(),
  })
  .partial()
  .strict();
const fontSchema = z.enum(['Space Grotesk', 'Montserrat', 'Playfair Display', 'Oswald', 'Bebas Neue', 'Merriweather']);

const renderMapShape = {
  // …giữ nguyên các key hiện có…
  layers: layerStateSchema.optional(),
  detail: z.number().min(0).max(1).optional(),
  font: fontSchema.optional(),
};
```

- [ ] **Step 1.4: Chạy xác nhận pass**

```bash
npx vitest run mcp-server/src/resolveConfig.test.ts mcp-server/src/tools.test.ts
```

Expected: PASS toàn bộ (test cũ không đỏ — `layers` cũ chỉ sinh từ `labels`, hành vi giữ nguyên).

- [ ] **Step 1.5: Commit**

```bash
git add mcp-server/src/resolveConfig.ts mcp-server/src/tools.ts mcp-server/src/resolveConfig.test.ts
git commit -m "feat(mcp): expose layers/detail/font params — engine đã wired, chỉ thiếu dây schema"
```

### Task 2: Per-region color (Tier 0 #3)

Renderer đã hỗ trợ (`RenderHighlightRegion.color`, test xanh `src/lib/mapStyle.test.ts:189-207`); resolver hiện ghi cứng `color: null` ở cả hai nhánh (`resolveConfig.ts:221,223`).

**Files:**
- Modify: `mcp-server/src/tools.ts:287` (highlightSchema.regions), `mcp-server/src/resolveConfig.ts:11-13` (type) + `:213-225` (vòng regions)
- Test: `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- Produces: `highlight.regions[]: string | { name: string; color?: string } | { geojson: GeoJSONFeatureCollection; color?: string }` — color qua `assertColor` từng phần tử.

- [ ] **Step 2.1: Failing test**

```typescript
it('carries per-region color through and validates it', async () => {
  const gj = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[1, 1], [2, 1], [2, 2], [1, 1]]] } }] };
  const cfg = await resolveConfig({
    location: 'Ho Chi Minh City',
    highlight: { regions: [{ name: 'District 1', color: '#ff0000' }, { geojson: gj, color: '#00ff00' }, 'District 3'] },
  });
  expect(cfg.highlight?.regions.map((r) => r.color)).toEqual(['#ff0000', '#00ff00', null]);
  await expect(
    resolveConfig({ location: 'Ho Chi Minh City', highlight: { regions: [{ name: 'District 1', color: 'red' }] } }),
  ).rejects.toThrow(/highlight\.regions\[\]\.color/);
});
```

- [ ] **Step 2.2: Run → FAIL** — `npx vitest run mcp-server/src/resolveConfig.test.ts`

- [ ] **Step 2.3: Implement**

Type (`resolveConfig.ts:12`):

```typescript
    regions?: (string | { name: string; color?: string } | { geojson: GeoJSONFeatureCollection; color?: string })[];
```

Vòng regions (:213-225) — thay toàn bộ:

```typescript
  const regions: RenderHighlightRegion[] = [];
  for (const r of params.highlight?.regions ?? []) {
    const rColor = typeof r === 'object' && r.color != null ? assertColor(r.color, 'highlight.regions[].color') : null;
    if (typeof r === 'string' || 'name' in r) {
      const name = typeof r === 'string' ? r : r.name;
      const gj = await resolveBoundary(name, anchor);
      if (!gj) throw new Error(`No boundary found for region "${name}"${anchor ? ` in ${anchor}` : ''}`);
      regions.push({ geojson: gj, color: rColor });
    } else {
      regions.push({ geojson: assertGeojson(r.geojson), color: rColor });
    }
  }
```

Lưu ý: guard `namedHighlight` (:197-199) phải nhận cả dạng `{name}`:

```typescript
  const namedHighlight =
    (params.highlight?.regions ?? []).some((r) => typeof r === 'string' || 'name' in r) ||
    (params.highlight?.points ?? []).some((p) => typeof p === 'string' || 'query' in p);
```

(`'query' in p` chuẩn bị cho Task 3 — thêm ngay để không sửa hai lần.)

Schema (`tools.ts:287`):

```typescript
    regions: z
      .array(z.union([
        z.string().min(1),
        z.object({ name: z.string().min(1), color: hexColor.optional() }),
        z.object({ geojson: z.any(), color: hexColor.optional() }),
      ]))
      .optional(),
```

- [ ] **Step 2.4: Run → PASS** — `npx vitest run mcp-server/src/resolveConfig.test.ts mcp-server/src/tools.test.ts`

- [ ] **Step 2.5: Commit** — `git commit -m "feat(mcp): per-region highlight color — renderer đã có test xanh, resolver thôi ghi null"`

### Task 3: Per-point object form (Tier 0 #4)

`RenderMarker` đã đủ `{icon, color, size}` (`renderConfig.ts:20-25`); resolver flatten hết về icon chung + size 44 (`resolveConfig.ts:227-237`). `drawMarker` KHÔNG clamp size → clamp tại boundary.

**Files:**
- Modify: `mcp-server/src/tools.ts:288`, `mcp-server/src/resolveConfig.ts:13-17` (type) + `:227-237`
- Test: `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- Produces: `highlight.points[]: string | { lng, lat, icon?, color?, size? } | { query: string, icon?, color?, size? }`; size clamp 18..140 (throw ngoài khoảng); lỗi `"Invalid highlight.points[].size"`, `"Invalid highlight.points[].color"`.

- [ ] **Step 3.1: Failing test**

```typescript
it('carries per-point icon/color/size and geocodes the query form', async () => {
  const cfg = await resolveConfig({
    location: 'Ho Chi Minh City',
    highlight: {
      points: [
        { lng: 106.7, lat: 10.78, icon: 'star', color: '#ff00ff', size: 60 },
        { query: 'Bến Thành Market', icon: 'heart' },
        'Võ Văn Tần',
      ],
      pointIcon: 'home',
      color: '#e8b04b',
    },
  });
  expect(cfg.markers).toHaveLength(3);
  expect(cfg.markers?.[0]).toMatchObject({ icon: 'star', color: '#ff00ff', size: 60 });
  expect(cfg.markers?.[1]).toMatchObject({ icon: 'heart', color: '#e8b04b', size: 44 }); // fallback màu chung
  expect(cfg.markers?.[2]).toMatchObject({ icon: 'home', color: '#e8b04b', size: 44 }); // fallback pointIcon
});

it('rejects out-of-range point size and bad point color', async () => {
  await expect(
    resolveConfig({ location: 'HCMC', highlight: { points: [{ lng: 106.7, lat: 10.78, size: 500 }] } }),
  ).rejects.toThrow(/highlight\.points\[\]\.size/);
  await expect(
    resolveConfig({ location: 'HCMC', highlight: { points: [{ lng: 106.7, lat: 10.78, color: 'javascript:x' }] } }),
  ).rejects.toThrow(/highlight\.points\[\]\.color/);
});
```

- [ ] **Step 3.2: Run → FAIL**

- [ ] **Step 3.3: Implement**

Type (`resolveConfig.ts:13`):

```typescript
    points?: (
      | string
      | { lng: number; lat: number; icon?: MarkerIconKey; color?: string; size?: number }
      | { query: string; icon?: MarkerIconKey; color?: string; size?: number }
    )[];
```

Assert (cạnh `assertColor`):

```typescript
/** drawMarker không clamp gì — một size 5000 vẽ tràn canvas, size 0 tàng hình. */
function assertMarkerSize(n: number): number {
  if (!Number.isFinite(n) || n < 18 || n > 140) throw new Error(`Invalid highlight.points[].size: ${n} (must be between 18 and 140)`);
  return n;
}
```

Vòng markers (:227-237) — thay toàn bộ:

```typescript
  const markers: RenderMarker[] = [];
  for (const p of params.highlight?.points ?? []) {
    const opts = typeof p === 'string' ? undefined : p;
    const center =
      typeof p === 'string'
        ? (await resolveLocation(p, anchor)).center
        : 'query' in p
          ? (await resolveLocation(p.query, anchor)).center
          : assertLngLat(p.lng, p.lat);
    markers.push({
      lng: center[0],
      lat: center[1],
      icon: opts?.icon ?? params.highlight?.pointIcon ?? 'pin',
      color: opts?.color != null ? assertColor(opts.color, 'highlight.points[].color') : (color ?? '#ffffff'),
      size: opts?.size != null ? assertMarkerSize(opts.size) : 44,
    });
  }
```

Schema (`tools.ts:288`):

```typescript
const markerIconSchema = z.enum(['pin', 'heart', 'home', 'star', 'circle', 'square']);
const pointOpts = { icon: markerIconSchema.optional(), color: hexColor.optional(), size: z.number().min(18).max(140).optional() };
// trong highlightSchema:
    points: z
      .array(z.union([
        z.string().min(1),
        z.object({ lng, lat, ...pointOpts }),
        z.object({ query: z.string().min(1), ...pointOpts }),
      ]))
      .optional(),
```

(Dạng named BẮT BUỘC key `query` — union `{lng,lat}` vs chuỗi trần sẽ nhập nhằng với Zod khi thiếu key phân biệt.) Dòng `pointIcon: z.enum([...])` hiện có (:292) đổi thành `pointIcon: markerIconSchema.optional()` — DRY.

- [ ] **Step 3.4: Run → PASS** — `npx vitest run mcp-server/src/resolveConfig.test.ts mcp-server/src/tools.test.ts`

- [ ] **Step 3.5: Commit** — `git commit -m "feat(mcp): per-point icon/color/size + query form — RenderMarker đã đủ field từ trước"`

### Task 4: Camera bounds + seed bearing vào clip (Tier 0 #8, #9 — 2 bug production)

Bug 1: `cameraSchema` (:297) nhận `bearing`/`pitch` **không bound** — `pitch: 200` được nhận, MapLibre clamp im lặng. Bug 2: preset compiler (`motionCompiler.ts compile()`) sinh keyframe `{t, center, zoom}` **không có bearing** → `camera: {bearing: 45}` + preset → clip render ở bearing 0, im lặng.

**Files:**
- Modify: `mcp-server/src/tools.ts:296-298`, `mcp-server/src/resolveConfig.ts:178-179`, `mcp-server/src/motionCompiler.ts` (`compileMotion`)
- Test: `mcp-server/src/resolveConfig.test.ts`, `mcp-server/src/motionCompiler.test.ts`

**Interfaces:**
- Produces: bearing hợp lệ 0..360, pitch 0..60 (**60** — maxPitch mặc định MapLibre; 85 là nhận-rồi-vứt); mọi keyframe compiler sinh ra mang `bearing` của `cfg.camera` khi có.

- [ ] **Step 4.1: Failing tests**

`resolveConfig.test.ts`:

```typescript
it('bounds camera bearing to 0..360 and pitch to 0..60', async () => {
  await expect(resolveConfig({ location: 'HCMC', camera: { pitch: 200 } })).rejects.toThrow(/invalid pitch/i);
  await expect(resolveConfig({ location: 'HCMC', camera: { bearing: -5 } })).rejects.toThrow(/invalid bearing/i);
  const cfg = await resolveConfig({ location: 'HCMC', camera: { bearing: 45, pitch: 30 } });
  expect(cfg.camera).toMatchObject({ bearing: 45, pitch: 30 });
});
```

`motionCompiler.test.ts` (dùng helper cfg sẵn có trong file; nếu file có `baseCfg`/`cfgWith` thì tái dùng, không thì tạo `RenderConfig` tối thiểu như các test hiện có):

```typescript
it('seeds cfg.camera.bearing into every compiled keyframe (production bug: bearing silently dropped)', () => {
  const cfg: RenderConfig = {
    camera: { center: [105.85, 21.03], zoom: 14, bearing: 45 },
    size: { width: 1080, height: 1920 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'Hanoi', country: 'Vietnam', lat: 21.03, lng: 105.85 },
    markers: [{ lng: 105.85, lat: 21.03, icon: 'pin', color: '#ffffff', size: 44 }],
  };
  const script = compileMotion('pushIn', cfg);
  expect(script.camera.length).toBeGreaterThan(1);
  for (const k of script.camera) expect(k.bearing).toBe(45);
});
```

- [ ] **Step 4.2: Run → FAIL**

```bash
npx vitest run mcp-server/src/resolveConfig.test.ts mcp-server/src/motionCompiler.test.ts
```

- [ ] **Step 4.3: Implement**

`resolveConfig.ts` asserts (cạnh `assertZoom`):

```typescript
function assertBearing(b: number): number {
  if (!Number.isFinite(b) || b < 0 || b > 360) throw new Error(`Invalid bearing: ${b} (must be between 0 and 360)`);
  return b;
}
/** 60, không phải 85: maxPitch mặc định của MapLibre là 60 — nhận 85 rồi để engine clamp là nhận-rồi-vứt. */
function assertPitch(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 60) throw new Error(`Invalid pitch: ${p} (must be between 0 and 60)`);
  return p;
}
```

Gọi tại :178-179 (cạnh assert center/zoom hiện có):

```typescript
  if (params.camera?.bearing != null) assertBearing(params.camera.bearing);
  if (params.camera?.pitch != null) assertPitch(params.camera.pitch);
```

`tools.ts:296-298`:

```typescript
const cameraSchema = z
  .object({
    center: z.tuple([lng, lat]).optional(),
    zoom: zoomLevel.optional(),
    bearing: z.number().min(0).max(360).optional(),
    pitch: z.number().min(0).max(60).optional(),
  })
  .optional();
```

`motionCompiler.ts` — helper + gọi trong `compileMotion`:

```typescript
/** Bug fix: preset compiler sinh keyframe không bearing → cfg.camera.bearing bị nuốt im lặng trên clip. */
function seedBearing(script: MotionScript, bearing: number | undefined): MotionScript {
  if (bearing == null || bearing === 0) return script;
  return { ...script, camera: script.camera.map((k) => ({ ...k, bearing: k.bearing ?? bearing })) };
}

export function compileMotion(preset: MotionPreset, cfg: RenderConfig, overrides?: PresetOverrides, maxFrames?: number): MotionScript {
  return validateMotionScript(seedBearing(compile(preset, cfg, overrides), cfg.camera.bearing), motionContextOf(cfg, maxFrames));
}
```

- [ ] **Step 4.4: Run → PASS** — cả hai file test + `npx vitest run mcp-server/src/tools.test.ts` (render_clip path đi qua compileMotion).

- [ ] **Step 4.5: Commit** — `git commit -m "fix(mcp): bound camera pitch/bearing tại boundary + seed bearing vào preset keyframes"`

### Task 5: `list_themes` palette + `list_formats` metadata (Tier 0 #6, #11)

**Files:**
- Modify: `mcp-server/src/tools.ts:264-266`, `mcp-server/src/resolveConfig.ts:124-129` (`listFormats`)
- Test: `mcp-server/src/tools.test.ts` (describe `discovery tools` :176)

**Interfaces:**
- Produces: `list_themes → {themes: [{id, name, dark, colors}]}` (15-key palette); `listFormats(): FormatInfo[]` với `{name, width, height, aspect, category, print?}`, dedupe theo name (FORMATS thắng — `'4k'` có ở cả FORMATS lẫn LAYOUTS).

- [ ] **Step 5.1: Failing tests** (thêm vào describe `discovery tools`)

```typescript
it('list_themes exposes the full palette so agents can match overlay colors', async () => {
  const { themes } = textJson(await tools().list_themes());
  expect(themes).toHaveLength(13);
  expect(themes[0]).toMatchObject({ id: 'midnight-blue', dark: true });
  expect(themes[0].colors.background).toMatch(/^#/);
  expect(Object.keys(themes[0].colors)).toContain('accent');
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
```

- [ ] **Step 5.2: Run → FAIL** — `npx vitest run mcp-server/src/tools.test.ts`

- [ ] **Step 5.3: Implement**

`resolveConfig.ts` (:124-129) — thay `listFormats`:

```typescript
export interface FormatInfo {
  name: string;
  width: number;
  height: number;
  /** reduced ratio, e.g. '9:16' */
  aspect: string;
  category: 'Video' | 'Print' | 'Social' | 'Wallpaper' | 'Web';
  print?: { w: number; h: number; unit: 'mm' | 'in' };
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const aspectOf = (w: number, h: number): string => {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
};

/** List every format name an agent may pass. FORMATS wins a name collision ('4k' exists in both). */
export function listFormats(): FormatInfo[] {
  const out = new Map<string, FormatInfo>();
  for (const [name, s] of Object.entries(FORMATS)) {
    out.set(name, { name, ...s, aspect: aspectOf(s.width, s.height), category: 'Video' });
  }
  for (const l of LAYOUTS) {
    if (out.has(l.id)) continue;
    out.set(l.id, {
      name: l.id, width: l.width, height: l.height,
      aspect: aspectOf(l.width, l.height), category: l.category,
      ...(l.print ? { print: l.print } : {}),
    });
  }
  return [...out.values()];
}
```

`tools.ts:264-266`:

```typescript
    async list_themes(): Promise<ToolResult> {
      return ok({ themes: THEMES.map((t) => ({ id: t.id, name: t.name, dark: t.dark, colors: t.colors })) });
    },
```

- [ ] **Step 5.4: Run → PASS** — test cũ `:177` (tiktok AC-8) và `:181` (length 13) vẫn xanh.

- [ ] **Step 5.5: Commit** — `git commit -m "feat(mcp): list_themes trả palette 15-key, list_formats dedupe + aspect/category/print"`

### Task 6: Echo MotionScript đã compile (Tier 0 #7)

`prep.motion` là chính MotionScript — đang bị dùng chỉ để lấy `restAtSec`/`fps` rồi vứt. Echo nó mở vòng lặp preset→inspect→tweak cho agent. 2 dòng + tests.

**Files:**
- Modify: `mcp-server/src/tools.ts:184`, `mcp-server/src/http.ts:285` (dòng `motionOut`)
- Test: `mcp-server/src/tools.test.ts` (describe `render_clip` :229), `mcp-server/src/http.test.ts`

**Interfaces:**
- Produces: mọi response render_clip / POST /render-clip (kể cả 3 nhánh degrade — encode-fail, oversize, thành công) mang `motion.script: MotionScript`.

- [ ] **Step 6.1: Failing test** (tools.test.ts, dùng `clipTools` helper :244 sẵn có)

```typescript
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
```

http.test.ts — tìm test POST /render-clip thành công hiện có, thêm assert `body.motion.script.camera` tồn tại (theo pattern assert của test đó).

- [ ] **Step 6.2: Run → FAIL** — `npx vitest run mcp-server/src/tools.test.ts mcp-server/src/http.test.ts`

- [ ] **Step 6.3: Implement** — tools.ts:184:

```typescript
          const motionOut = { ...(preset ? { preset } : {}), restAtSec: motion.restAtSec, script: motion };
```

http.ts:285 (dòng `motionOut` tương ứng):

```typescript
            const motionOut = { ...(preset ? { preset } : {}), restAtSec: motion.restAtSec, script: motion };
```

Cả hai file tái dùng `motionOut` cho mọi nhánh degrade → 3 nhánh được echo miễn phí. Nếu có test cũ pin đúng shape `motion` bằng `toEqual` → mở rộng expectation thêm `script` (đây là AC-mở-rộng, không phải đổi hành vi).

- [ ] **Step 6.4: Run → PASS**

- [ ] **Step 6.5: Commit** — `git commit -m "feat(mcp): echo compiled MotionScript trong render_clip/REST — mở vòng preset→inspect→tweak"`

### Task 7: `render_animation` honour `delivery` + byte cap (Tier 0 #10 — bug production)

Schema quảng cáo `delivery` (`{...renderMapShape}` :355) nhưng handler lờ đi; và đây là output path duy nhất không có `MAPPOSTER_CLIP_MAX_BYTES`.

**Files:**
- Modify: `mcp-server/src/tools.ts:104-151`
- Test: `mcp-server/src/tools.test.ts` (describe `render_animation` :186, dùng `animTools` :66)

**Interfaces:**
- Produces: `animation.outputs[i] += {bytes}`; preview qua `deliver()` (delivery:'url' → không còn base64 inline); over-cap → `fail` + file bị xoá.

- [ ] **Step 7.1: Failing tests**

```typescript
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
```

- [ ] **Step 7.2: Run → FAIL**

- [ ] **Step 7.3: Implement** — trong `render_animation` (:128-147), thay từ `const name = …` đến `return ok(…)`:

```typescript
        const name = fileNameFor(cfg);
        const cap = envNumber(process.env, 'MAPPOSTER_CLIP_MAX_BYTES', DEFAULT_CLIP_MAX_BYTES, { min: 1 });
        const outputs: { format: 'gif' | 'mp4'; path: string; bytes: number }[] = [];
        const wanted: ('gif' | 'mp4')[] = format === 'both' ? ['gif', 'mp4'] : [format];
        for (const f of wanted) {
          const outPath = await deps.encodeAnimation(pngs, {
            fps,
            format: f,
            outPath: `${deps.sinkDir}/${name}.${f}`,
            gifWidth: f === 'gif' ? (anim.gifWidth ?? Math.min(540, cfg.size.width)) : undefined,
          });
          const { size: bytes } = await fs.stat(outPath);
          if (bytes > cap) {
            // Cùng chính sách với render_clip (Finding C): file quá cỡ trong sinkDir
            // bền vững sẽ tích tụ mãi mãi nếu không xoá tại đây.
            await fs.rm(outPath, { force: true }).catch(() => {});
            for (const o of outputs) await fs.rm(o.path, { force: true }).catch(() => {});
            return fail(`animation ${f} is ${bytes} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower frames/fps or size`);
          }
          outputs.push({ format: f, path: outPath, bytes });
        }

        // Trước đây preview LUÔN inline bất kể `delivery` — schema quảng cáo
        // delivery (renderMapShape) rồi handler lờ nó đi.
        const preview = pngs[Math.floor(pngs.length / 2)];
        const image = await deliver(preview, `${name}-preview`, mode(params.delivery), { sinkDir: deps.sinkDir });
        return ok(
          { image, animation: { outputs, frames, fps, width: cfg.size.width, height: cfg.size.height, loop: true }, resolved: resolvedOf(cfg) },
          [image],
        );
```

Và signature: `async render_animation(params: RenderMapParams & { animation?: {…}; delivery?: DeliveryMode })`.

- [ ] **Step 7.4: Run → PASS** — test cũ describe `render_animation` vẫn xanh (defaultDelivery 'both' → base64 vẫn inline).

- [ ] **Step 7.5: Commit** — `git commit -m "fix(mcp): render_animation honour delivery + MAPPOSTER_CLIP_MAX_BYTES cap — path duy nhất không cap"`

### Task 8: OSM identity trong `resolved` + nới kiểu `boundaryCache` (Tier 0 #12 — kèm bug cache)

`resolveBoundary` trả geojson trần → caller không biết ĐÃ match relation nào. Nới kiểu cache là bắt buộc — cache kiểu cũ sẽ trả shape cũ ở lần gọi thứ hai (bug silent).

**Files:**
- Modify: `mcp-server/src/geocode.ts:41` (cache) + `:209-237` (resolveBoundary), `mcp-server/src/resolveConfig.ts` (caller + `summarizeHighlights` :156-163), `src/render/renderConfig.ts:14-17` (RenderHighlightRegion)
- Modify (mock ripple): `mcp-server/src/resolveConfig.test.ts:12-15`, `mcp-server/src/tools.test.ts:21` — mock `resolveBoundary` phải trả shape mới
- Test: `mcp-server/src/geocode.test.ts`, `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- Produces: `resolveBoundary(): Promise<ResolvedBoundary | null>` với `ResolvedBoundary = { geojson, osmType?, osmId?, displayName?, placeRank? }`; `resolved.highlights.regions[i] += {osmType, osmId, displayName, placeRank}`. (Spec ghi `adminLevel` — Nominatim search không trả field đó; `placeRank` là granularity tương đương có sẵn trên `GeoResult` — ghi chú thay thế này vào README khi cập nhật.)

- [ ] **Step 8.1: Failing tests**

`resolveConfig.test.ts` — cập nhật mock đầu file TRƯỚC (shape mới):

```typescript
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
```

(tools.test.ts mock `:21` cập nhật tương tự.) Test mới:

```typescript
it('echoes the matched OSM identity in resolved.highlights.regions', async () => {
  const cfg = await resolveConfig({ location: 'Ho Chi Minh City', highlight: { regions: ['District 1'] } });
  const summary = summarizeHighlights(cfg);
  expect(summary.regions[0]).toMatchObject({
    osmType: 'relation',
    osmId: 1973756,
    displayName: 'District 1, Ho Chi Minh City, Vietnam',
    placeRank: 18,
  });
  expect(summary.regions[0].bbox).not.toBeNull();
});
```

`geocode.test.ts` — tìm test resolveBoundary hiện có, đổi expectation từ FeatureCollection trần sang `.geojson`, và thêm test cache-hit trả cùng shape:

```typescript
it('returns the same ResolvedBoundary shape on a cache hit (bug: stale cache type)', async () => {
  // gọi 2 lần cùng key — lần 2 đi qua boundaryCache
  const a = await resolveBoundary('District 1', 'Vietnam');
  const b = await resolveBoundary('District 1', 'Vietnam');
  expect(b).toEqual(a);
  expect(b?.geojson.type).toBe('FeatureCollection');
});
```

(theo đúng harness mock fetch sẵn có của geocode.test.ts — tái dùng fixture Nominatim trong file.)

- [ ] **Step 8.2: Run → FAIL** — `npx vitest run mcp-server/src/geocode.test.ts mcp-server/src/resolveConfig.test.ts`

- [ ] **Step 8.3: Implement**

`geocode.ts`:

```typescript
export interface ResolvedBoundary {
  geojson: GeoJSONFeatureCollection;
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
  displayName?: string;
  /** Nominatim granularity (city ~16, road ~26). Search không trả admin_level. */
  placeRank?: number;
}

// :41 — nới kiểu, `null` vẫn là giá-trị-thật ("không có polygon")
const boundaryCache = new Map<string, ResolvedBoundary | null>();
```

Cuối `resolveBoundary` (:225-237):

```typescript
  const hit = hits.find((h) => h.osmType === 'relation') ?? hits[0];

  await throttle();
  const b = await fetchRegionBoundary(hit);
  const resolved: ResolvedBoundary | null = b
    ? { geojson: b.geojson, osmType: hit.osmType, osmId: hit.osmId, displayName: hit.displayName, placeRank: hit.placeRank }
    : null;
  lruSet(boundaryCache, key, resolved);
  return resolved;
```

và signature `:209` → `Promise<ResolvedBoundary | null>`.

`src/render/renderConfig.ts:14-17`:

```typescript
export interface RenderHighlightRegion {
  geojson: GeoJSONFeatureCollection;
  color: string | null;
  /** OSM identity of the matched boundary — echoed into resolved.highlights, ignored by the render page. */
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
  displayName?: string;
  placeRank?: number;
}
```

`resolveConfig.ts` — nhánh named trong vòng regions (đã viết ở Task 2) đổi thành:

```typescript
      const b = await resolveBoundary(name, anchor);
      if (!b) throw new Error(`No boundary found for region "${name}"${anchor ? ` in ${anchor}` : ''}`);
      regions.push({ geojson: b.geojson, color: rColor, osmType: b.osmType, osmId: b.osmId, displayName: b.displayName, placeRank: b.placeRank });
```

`summarizeHighlights` (:156-163):

```typescript
  const regions = (cfg.highlight?.regions ?? []).map((r) => {
    const bbox = bboxOfRegions([r]);
    const center: [number, number] | null = bbox ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] : null;
    return {
      bbox,
      center,
      ...(r.osmType != null ? { osmType: r.osmType, osmId: r.osmId, displayName: r.displayName, placeRank: r.placeRank } : {}),
    };
  });
```

(`ResolvedHighlights` type :146-149 mở rộng field optional tương ứng.)

- [ ] **Step 8.4: Run → PASS toàn bộ**

```bash
npx vitest run mcp-server/
```

Expected: mọi file test mcp-server xanh (mock ripple đã xử lý ở Step 8.1).

- [ ] **Step 8.5: Commit** — `git commit -m "feat(mcp): echo OSM identity của boundary đã match + nới kiểu boundaryCache (bug: cache hit trả shape cũ)"`

### Task 9: Verify toàn cục + README + chuẩn bị gate

**Files:**
- Modify: `README.md` (bảng tool params — thêm layers/detail/font/per-region color/per-point opts/camera bounds/motion.script echo/list_* mới)

- [ ] **Step 9.1: Full verify**

```bash
npm run verify
```

Expected: typecheck + Vitest + Playwright đều xanh. Nếu Playwright đỏ do schema mới → đọc lỗi, sửa test E2E tương ứng (E2E không đụng schema mcp — không kỳ vọng đỏ).

- [ ] **Step 9.2: Gated MCP integration test**

```bash
npm run test:mcp
```

Expected: build app + render PNG thật qua đường mới (layers/font param đi tới pixel).

- [ ] **Step 9.3: Cập nhật README**

Mục "MCP map-render server": ví dụ `render_map` thêm `layers`/`detail`/`font`; ghi chú camera bounds (pitch ≤ 60); `render_clip` response thêm `motion.script`; `list_themes`/`list_formats` shape mới; ghi chú `placeRank` thay `adminLevel` và lý do. Commit: `git commit -m "docs: README cho 12 param Tier 0"`.

- [ ] **Step 9.4: Pre-merge check + acceptance gate**

```bash
bash scripts/pre-merge-check.sh --base main
```

Expected: stale-set = đúng các file PR này đụng → cả hai hợp đồng cần re-verify. Chạy quy trình acceptance-gate hiện hành (re-run evals `mcp-map-render` 12 eval + `map-motion-clip` 17 eval; judgment evals cần human verdict; 2 commit chữ ký riêng — chủ repo thực hiện).

- [ ] **Step 9.5: Push + PR**

```bash
git push -u origin feat/tier0-agent-params
gh pr create --title "feat: Tier 0 — mở 12 capability engine đã có qua param + 4 bug fix" --body "$(cat <<'EOF'
## Tóm tắt
- 12 param plumbing: layers, detail, font, per-region color, per-point icon/color/size/query, camera bounds, list_themes palette, list_formats metadata, echo motion.script, OSM identity trong resolved
- 4 bug production: bearing bị nuốt trên clip, pitch không bound, render_animation lờ delivery + không cap bytes, boundaryCache shape
- Không đụng src/lib/export.ts / src/lib/mapStyle.ts (t3_path)

Spec: docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md (PR #1)
Plan: docs/superpowers/plans/2026-08-06-pr0-spike-setnow-pr1-tier0.md

## Test plan
- [ ] npm run verify xanh
- [ ] npm run test:mcp xanh
- [ ] Re-verify 2 hợp đồng acceptance (evidence mới + chữ ký)
EOF
)"
```

---

## Self-Review (đã chạy)

1. **Spec coverage:** PR #0 = spec §5 dòng #0 ✓; PR #1 = spec §5 dòng #1, đủ 12 mục Tier 0 (#1→T1, #2→T1, #3→T2, #4→T3, #5→T1, #6→T5, #7→T6, #8→T4, #9→T4, #10→T7, #11→T5, #12→T8) + 4 bug ✓. Các PR #2+ của spec nằm ngoài plan này — lập plan riêng sau khi PR #1 merge (và sau kết quả spike #0).
2. **Placeholder scan:** Task 0 Step 0.3 có phần "điền theo API thật" — chấp nhận được vì là spike khám phá (bước 0.2 đọc API trước); mọi task PR #1 có code đầy đủ ✓.
3. **Type consistency:** `ResolvedBoundary` dùng thống nhất T8; `markerIconSchema`/`pointOpts` khai báo T3 và dùng tại chỗ; `FormatInfo` chỉ T5; `seedBearing` chỉ T4; spec ghi `adminLevel` → plan dùng `placeRank` (field thật của `GeoResult`, `src/lib/geocoding.ts:59`) — ghi chú đổi tên nằm ở T8 Interfaces + README T9.3 ✓.

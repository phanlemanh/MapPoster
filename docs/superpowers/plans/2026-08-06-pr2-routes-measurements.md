# PR #2 — `routes` plumbing + measurements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Cho agent vẽ tuyến đường lên bản đồ (`routes`) và hỏi số đo hình học (`measure`) — keystone của 5 tính năng sau (road routing, routeDraw, arrow, connector, distance badge) và là thứ recipe `connectivity` cần.

**Architecture:** Giống PR #1 — engine đã tiêu thụ được, chỉ thiếu dây. `src/lib/mapStyle.ts` **đã** dựng source `routes` + layer `route-line` với per-feature `color`/`width` và fallback `coalesce` về theme accent (mapStyle.ts:78-96, :246-256). Khâu đứt duy nhất: `applyRenderConfig` không bao giờ set `store.routes`, nên store giữ mặc định `[]`. Measurements là code thuần mới, không đụng render.

**Tech Stack:** TypeScript, Zod, Vitest, MapLibre GL JS, Playwright.

## Global Constraints

- **CẤM đụng `src/lib/export.ts` và `src/lib/mapStyle.ts`** — t3_path. mapStyle đã đủ năng lực, không có lý do chạm. Giữ gói này ở **T2**.
- Mọi field Zod mới PHẢI có runtime assert trong `resolveConfig.ts` — `makeTools` được gọi trực tiếp, bỏ qua tầng Zod.
- **Đặt tên số đo phải nói rõ phép đo**: `straightLineKm` (đường chim bay) và `lengthKm` (chiều dài polyline) — **không bao giờ** dùng `km` trần. Một con số không nói nó đo kiểu gì sẽ chảy thẳng vào cổng no-fab của phía tiêu thụ.
- Immutability: spread/map, không mutate.
- Không `console.log` trong production code.
- Conventional commits, không footer attribution.
- Sau toàn bộ: `npm run verify` + `npm run test:mcp` xanh.
- Thuế gate: mọi thay đổi code làm stale **cả bốn** hợp đồng đã ký → gộp một PR.

---

### Task 1: `geometry.ts` — số đo hình học thuần

File mới, không phụ thuộc gì trong repo. Làm trước để Task 3 có sẵn.

**Files:**
- Create: `mcp-server/src/geometry.ts`
- Test: `mcp-server/src/geometry.test.ts`

**Interfaces:**
- Produces: `haversineMeters(a: LngLat, b: LngLat): number`, `initialBearingDeg(a, b): number`, `polylineLengthMeters(coords: LngLat[]): number`, `geometryAreaM2(geom): number`, `centroidOf(geom): LngLat | null`, `spanKmOf(bbox): {ew, ns}`; type `LngLat = [number, number]`.

**Điểm dễ sai — đọc kỹ:** `bboxOfRegions` hiện có dùng `flat()` đệ quy **mù**, cố ý không phân biệt outer ring với hole (đúng cho bbox). Diện tích **không tái dùng được nó**: signed ring area cần đúng cấu trúc ring. Test bắt buộc dùng polygon **có lỗ**, không phải hình vuông.

- [ ] **Step 1.1: Viết failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { haversineMeters, initialBearingDeg, polylineLengthMeters, geometryAreaM2, centroidOf } from './geometry';

describe('haversineMeters', () => {
  it('measures a known city pair within 0.5%', () => {
    // Hà Nội → TP.HCM, ~1157 km great-circle
    const m = haversineMeters([105.8342, 21.0278], [106.6297, 10.8231]);
    expect(m / 1000).toBeGreaterThan(1150);
    expect(m / 1000).toBeLessThan(1165);
  });
  it('is zero for identical points and symmetric', () => {
    expect(haversineMeters([105, 21], [105, 21])).toBe(0);
    expect(haversineMeters([105, 21], [106, 22])).toBeCloseTo(haversineMeters([106, 22], [105, 21]), 6);
  });
});

describe('initialBearingDeg', () => {
  it('reads 90 due east and 0 due north, normalised to 0..360', () => {
    expect(initialBearingDeg([105, 0], [106, 0])).toBeCloseTo(90, 1);
    expect(initialBearingDeg([105, 21], [105, 22])).toBeCloseTo(0, 1);
    expect(initialBearingDeg([105, 21], [104, 21])).toBeGreaterThan(269);
  });
});

describe('polylineLengthMeters', () => {
  it('sums consecutive legs, not the straight line end to end', () => {
    // dogleg: đi đông rồi đi bắc — dài hơn đường chim bay
    const path: [number, number][] = [[105, 21], [106, 21], [106, 22]];
    const poly = polylineLengthMeters(path);
    const direct = haversineMeters([105, 21], [106, 22]);
    expect(poly).toBeGreaterThan(direct);
  });
  it('returns 0 for fewer than two points', () => {
    expect(polylineLengthMeters([])).toBe(0);
    expect(polylineLengthMeters([[105, 21]])).toBe(0);
  });
});

describe('geometryAreaM2', () => {
  it('SUBTRACTS holes — the case a bbox-style blind flatten gets wrong', () => {
    const outer = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const hole = [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75], [0.25, 0.25]];
    const solid = geometryAreaM2({ type: 'Polygon', coordinates: [outer] });
    const holed = geometryAreaM2({ type: 'Polygon', coordinates: [outer, hole] });
    expect(holed).toBeLessThan(solid);
    // lỗ chiếm 25% diện tích ô ngoài
    expect(holed / solid).toBeCloseTo(0.75, 1);
  });
  it('is winding-order independent (a reversed ring is not negative area)', () => {
    const cw = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
    const ccw = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    expect(geometryAreaM2({ type: 'Polygon', coordinates: [cw] }))
      .toBeCloseTo(geometryAreaM2({ type: 'Polygon', coordinates: [ccw] }), 0);
  });
  it('sums the parts of a MultiPolygon', () => {
    const a = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const b = [[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]];
    const one = geometryAreaM2({ type: 'Polygon', coordinates: [a] });
    const two = geometryAreaM2({ type: 'MultiPolygon', coordinates: [[a], [b]] });
    expect(two).toBeCloseTo(one * 2, -6);
  });
  it('is 0 for non-area geometry', () => {
    expect(geometryAreaM2({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })).toBe(0);
  });
});
```

- [ ] **Step 1.2: Run → FAIL** — `npx vitest run mcp-server/src/geometry.test.ts` (module không tồn tại)

- [ ] **Step 1.3: Implement `mcp-server/src/geometry.ts`**

```typescript
/**
 * Số đo hình học trên mặt cầu. Không phụ thuộc gì trong repo — thuần toán.
 *
 * KHÔNG tái dùng bboxOfRegions của resolveConfig: nó flatten đệ quy MÙ, cố ý
 * không phân biệt outer ring với hole (đúng cho bbox, sai cho diện tích).
 */
export type LngLat = [number, number];

const R = 6_371_008.8; // bán kính Trái Đất trung bình IUGG, mét
const rad = (d: number): number => (d * Math.PI) / 180;

export function haversineMeters(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Phương vị ban đầu a→b, 0..360, 0 = bắc. */
export function initialBearingDeg(a: LngLat, b: LngLat): number {
  const φ1 = rad(a[1]), φ2 = rad(b[1]), Δλ = rad(b[0] - a[0]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function polylineLengthMeters(coords: LngLat[]): number {
  let m = 0;
  for (let i = 1; i < coords.length; i++) m += haversineMeters(coords[i - 1], coords[i]);
  return m;
}

/** Diện tích một ring theo công thức thặng dư cầu. Dấu phụ thuộc chiều quay. */
function ringAreaM2(ring: LngLat[]): number {
  if (ring.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % ring.length];
    total += rad(p2[0] - p1[0]) * (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
  }
  return (total * R * R) / 2;
}

/**
 * Diện tích hình học, ĐÃ TRỪ LỖ. Ring đầu là outer, các ring sau là hole —
 * theo đúng quy ước GeoJSON, không đoán theo chiều quay (dữ liệu OSM thực tế
 * có cả hai chiều, nên dựa vào dấu là dựa vào thứ không đảm bảo).
 */
export function geometryAreaM2(geom: { type: string; coordinates: unknown } | null | undefined): number {
  if (!geom) return 0;
  const poly = (rings: LngLat[][]): number =>
    rings.reduce((acc, ring, i) => acc + (i === 0 ? Math.abs(ringAreaM2(ring)) : -Math.abs(ringAreaM2(ring))), 0);
  if (geom.type === 'Polygon') return Math.max(0, poly(geom.coordinates as LngLat[][]));
  if (geom.type === 'MultiPolygon') return (geom.coordinates as LngLat[][][]).reduce((a, r) => a + Math.max(0, poly(r)), 0);
  return 0;
}

/** Trọng tâm bbox của mọi toạ độ trong geometry — đủ cho nhãn, không phải tâm khối lượng. */
export function centroidOf(geom: { type: string; coordinates: unknown } | null | undefined): LngLat | null {
  if (!geom) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (arr: unknown): void => {
    if (Array.isArray(arr) && typeof arr[0] === 'number') {
      const [lng, lat] = arr as number[];
      if (lng < w) w = lng; if (lng > e) e = lng; if (lat < s) s = lat; if (lat > n) n = lat;
    } else if (Array.isArray(arr)) arr.forEach(walk);
  };
  walk(geom.coordinates);
  return isFinite(w) ? [(w + e) / 2, (s + n) / 2] : null;
}

/** Bề ngang/bề dọc của một bbox, tính bằng km trên mặt cầu. */
export function spanKmOf(bbox: [number, number, number, number]): { ew: number; ns: number } {
  const [w, s, e, n] = bbox;
  const midLat = (s + n) / 2;
  return {
    ew: haversineMeters([w, midLat], [e, midLat]) / 1000,
    ns: haversineMeters([(w + e) / 2, s], [(w + e) / 2, n]) / 1000,
  };
}
```

- [ ] **Step 1.4: Run → PASS** — `npx vitest run mcp-server/src/geometry.test.ts`

- [ ] **Step 1.5: Commit** — `git commit -m "feat(mcp): geometry.ts — haversine, bearing, polyline length, diện tích trừ lỗ"`

### Task 2: `routes` xuống tới pixel

**Files:**
- Modify: `src/render/renderConfig.ts` (thêm `RenderRoute` + `routes?`), `src/render/applyRenderConfig.ts` (set `store.routes`)
- Test: `src/render/applyRenderConfig.test.ts`

**Interfaces:**
- Produces: `RenderRoute = { geojson: GeoJSONFeatureCollection; color: string; width: number }`; `RenderConfig.routes?: RenderRoute[]`; store nhận `RouteItem[]` với `id: 'rt-${i}'`, `name: ''`.

- [ ] **Step 2.1: Failing test** (thêm vào `src/render/applyRenderConfig.test.ts`)

```typescript
it('wires cfg.routes into the store so buildMapStyle can draw them', () => {
  const line = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[105.85, 21.02], [105.86, 21.03]] } }] };
  applyRenderConfig({ ...baseCfg, routes: [{ geojson: line, color: '#ff0000', width: 6 }] });
  const routes = usePosterStore.getState().routes;
  expect(routes).toHaveLength(1);
  expect(routes[0]).toMatchObject({ id: 'rt-0', color: '#ff0000', width: 6 });
  expect(routes[0].geojson).toEqual(line);
});

it('clears routes when a later config carries none (no leak between renders)', () => {
  const line = { type: 'FeatureCollection', features: [] };
  applyRenderConfig({ ...baseCfg, routes: [{ geojson: line, color: '#ff0000', width: 6 }] });
  applyRenderConfig(baseCfg);
  expect(usePosterStore.getState().routes).toEqual([]);
});
```

(Dùng `baseCfg` sẵn có trong file; nếu chưa có thì tạo `RenderConfig` tối thiểu theo mẫu các test hiện có.)

- [ ] **Step 2.2: Run → FAIL**

- [ ] **Step 2.3: Implement**

`src/render/renderConfig.ts` — thêm cạnh `RenderMarker`:

```typescript
export interface RenderRoute {
  geojson: GeoJSONFeatureCollection;
  color: string;
  width: number;
}
```
và trong `RenderConfig`, cạnh `markers?`:
```typescript
  routes?: RenderRoute[];
```

`src/render/applyRenderConfig.ts` — cạnh `markers`:

```typescript
  const routes: RouteItem[] = (cfg.routes ?? []).map((r, i) => ({
    id: `rt-${i}`,
    name: '',
    geojson: r.geojson,
    color: r.color,
    width: r.width,
  }));
```
thêm `RouteItem` vào import type, và `routes,` vào `usePosterStore.setState({...})`.

**Ghi chú bắt buộc:** `setState` phải luôn ghi `routes` (kể cả mảng rỗng) — bỏ trống thì tuyến của lần render trước còn lại trong store dùng chung, rò giữa hai lần render.

- [ ] **Step 2.4: Run → PASS** — `npx vitest run src/render/`

- [ ] **Step 2.5: Commit** — `git commit -m "feat(render): nối RenderConfig.routes vào store — mapStyle đã dựng route-line từ trước"`

### Task 3: Tham số `routes` + `measure` ở tầng tool

**Files:**
- Modify: `mcp-server/src/resolveConfig.ts`, `mcp-server/src/tools.ts`
- Test: `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- Consumes: `geometry.ts` (Task 1), `RenderRoute` (Task 2).
- Produces:
  - `RenderMapParams.routes?: ({ geojson } | { coords: [number,number][] })[] & { color?, width? }`
  - `RenderMapParams.measure?: { pairs?: [number, number][] }`
  - `resolved.routes[i] = { bbox, lengthKm, pointCount }`
  - `resolved.measures = { pairs: [{from,to,straightLineKm,bearingDeg}], routes: [{index,lengthKm}], regions: [{index,areaKm2,spanKm,centroid}] }`
  - `MAX_TOTAL_GEOJSON_BYTES`; lỗi `"total inline GeoJSON is N bytes, over the M-byte limit"`
  - Auto-frame học routes: chỉ có routes mà không có regions/points thì khung vẫn ôm tuyến.

- [ ] **Step 3.1: Failing tests**

```typescript
it('accepts both route forms, defaults style, and echoes measurements', async () => {
  const cfg = await resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    routes: [
      { coords: [[105.85, 21.02], [105.86, 21.02]], color: '#ff0000', width: 8 },
      { geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[105.80, 21.00], [105.81, 21.01]] } }] } },
    ],
  });
  expect(cfg.routes).toHaveLength(2);
  expect(cfg.routes?.[0]).toMatchObject({ color: '#ff0000', width: 8 });
  expect(cfg.routes?.[1]).toMatchObject({ width: 4 });          // mặc định
  expect(cfg.routes?.[1].color).toBe('#e8b04b');                // accent theme mặc định
  const r = summarizeRoutes(cfg);
  expect(r[0].pointCount).toBe(2);
  expect(r[0].lengthKm).toBeGreaterThan(1);
  expect(r[0].bbox).toEqual([105.85, 21.02, 105.86, 21.02]);
});

it('frames on routes when there is no region or point', async () => {
  const cfg = await resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    routes: [{ coords: [[105.0, 21.0], [106.0, 22.0]] }],
  });
  expect(cfg.camera.center[0]).toBeCloseTo(105.5, 3);
  expect(cfg.camera.center[1]).toBeCloseTo(21.5, 3);
});

it('measures point pairs with a name that says WHICH measurement it is', async () => {
  const cfg = await resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    highlight: { points: [{ lng: 105.8342, lat: 21.0278 }, { lng: 106.6297, lat: 10.8231 }] },
    measure: { pairs: [[0, 1]] },
  });
  const m = summarizeMeasures(cfg);
  expect(m.pairs[0]).toMatchObject({ from: 0, to: 1 });
  expect(m.pairs[0].straightLineKm).toBeGreaterThan(1150);
  expect(m.pairs[0].bearingDeg).toBeGreaterThan(180);           // HN → HCM là hướng nam
  expect('km' in m.pairs[0]).toBe(false);                       // tên trần bị cấm
});

it('refuses a measure pair pointing at a point that does not exist', async () => {
  await expect(resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
    measure: { pairs: [[0, 5]] },
  })).rejects.toThrow(/measure\.pairs/);
});

it('rejects a route with fewer than two coords, and a bad colour/width', async () => {
  const one = { location: { lng: 105.85, lat: 21.02 }, routes: [{ coords: [[105.85, 21.02]] }] };
  await expect(resolveConfig(one as never)).rejects.toThrow(/routes\[\]\.coords/);
  await expect(resolveConfig({ location: { lng: 105.85, lat: 21.02 }, routes: [{ coords: [[105.85, 21.02], [105.86, 21.02]], color: 'red' }] } as never)).rejects.toThrow(/routes\[\]\.color/);
  await expect(resolveConfig({ location: { lng: 105.85, lat: 21.02 }, routes: [{ coords: [[105.85, 21.02], [105.86, 21.02]], width: 99 }] } as never)).rejects.toThrow(/routes\[\]\.width/);
});

it('caps TOTAL inline geometry, not just each payload', async () => {
  const big = (n: number) => ({ coords: Array.from({ length: n }, (_, i) => [105 + i * 1e-6, 21]) });
  await expect(resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    routes: Array.from({ length: 40 }, () => big(20000)),
  } as never)).rejects.toThrow(/total inline GeoJSON/i);
});

it('reports region area with holes subtracted and a span in km', async () => {
  const outer = [[105.0, 21.0], [105.1, 21.0], [105.1, 21.1], [105.0, 21.1], [105.0, 21.0]];
  const hole = [[105.04, 21.04], [105.06, 21.04], [105.06, 21.06], [105.04, 21.06], [105.04, 21.04]];
  const cfg = await resolveConfig({
    location: { lng: 105.05, lat: 21.05 },
    highlight: { regions: [{ geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [outer, hole] } }] } }] },
  });
  const m = summarizeMeasures(cfg);
  expect(m.regions[0].areaKm2).toBeGreaterThan(0);
  expect(m.regions[0].spanKm.ew).toBeGreaterThan(9);
  expect(m.regions[0].centroid[0]).toBeCloseTo(105.05, 2);
});
```

- [ ] **Step 3.2: Run → FAIL**

- [ ] **Step 3.3: Implement `resolveConfig.ts`**

Type (cạnh `points?`):
```typescript
  routes?: ({ geojson: GeoJSONFeatureCollection } | { coords: [number, number][] })[] extends never ? never :
    ({ geojson?: GeoJSONFeatureCollection; coords?: [number, number][]; color?: string; width?: number })[];
  measure?: { pairs?: [number, number][] };
```
(Giữ dạng object phẳng có `geojson?`/`coords?` — union chặt sẽ khiến `render_variants` merge override khó dùng.)

Hằng + assert:
```typescript
/** Cap TỔNG, không phải mỗi payload: 40 tuyến × 2 MiB vẫn lọt cap-mỗi-payload. */
export const MAX_TOTAL_GEOJSON_BYTES = 8 * 1024 * 1024;

const DEFAULT_ROUTE_WIDTH = 4;

function assertRouteWidth(n: number): number {
  if (!Number.isFinite(n) || n < 1 || n > 16) throw new Error(`Invalid routes[].width: ${n} (must be between 1 and 16)`);
  return n;
}
function coordsToFeatureCollection(coords: [number, number][]): GeoJSONFeatureCollection {
  if (!Array.isArray(coords) || coords.length < 2) {
    throw new Error(`Invalid routes[].coords: needs at least 2 positions, got ${Array.isArray(coords) ? coords.length : 0}`);
  }
  for (const c of coords) assertLngLat(c[0], c[1]);
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] };
}
```

Trong `resolveConfig`, sau khối regions/markers:
```typescript
  const routes: RenderRoute[] = (params.routes ?? []).map((r) => {
    const geojson = r.coords ? coordsToFeatureCollection(r.coords) : assertGeojson(r.geojson, 'routes[].geojson');
    return {
      geojson,
      color: r.color != null ? assertColor(r.color, 'routes[].color') : (getTheme(theme).colors.accent),
      width: r.width != null ? assertRouteWidth(r.width) : DEFAULT_ROUTE_WIDTH,
    };
  });
  const totalBytes = [...regions.map((x) => x.geojson), ...routes.map((x) => x.geojson)]
    .reduce((a, g) => a + Buffer.byteLength(JSON.stringify(g)), 0);
  if (totalBytes > MAX_TOTAL_GEOJSON_BYTES) {
    throw new Error(`Invalid request: total inline GeoJSON is ${totalBytes} bytes, over the ${MAX_TOTAL_GEOJSON_BYTES}-byte limit`);
  }
```

Validate `measure.pairs` **trước** mọi lời gọi mạng (cùng chỗ với các assert rẻ), nhưng chỉ số phải so với số point ĐÃ resolve — nên đặt sau vòng markers:
```typescript
  for (const [a, b] of params.measure?.pairs ?? []) {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= markers.length || b >= markers.length) {
      throw new Error(`Invalid measure.pairs entry [${a}, ${b}]: index out of range (${markers.length} point(s) available)`);
    }
  }
```

Auto-frame học routes — sửa nhánh `if (cam.zoom == null)`:
```typescript
    const framed = regions.length ? bboxOfGeojsons(regions.map((r) => r.geojson))
                 : routes.length  ? bboxOfGeojsons(routes.map((r) => r.geojson))
                 : null;
```
(Đổi tên `bboxOfRegions` → `bboxOfGeojsons(list: GeoJSONFeatureCollection[])` và cập nhật 2 call site; giữ nguyên thuật toán flatten mù — đúng cho bbox.)

Return: thêm `routes: routes.length ? routes : undefined` và `measure: params.measure`.

Hai hàm tóm tắt mới:
```typescript
export interface ResolvedRoute { bbox: [number, number, number, number] | null; lengthKm: number; pointCount: number }

export function summarizeRoutes(cfg: RenderConfig): ResolvedRoute[] {
  return (cfg.routes ?? []).map((r) => {
    const coords: LngLat[] = [];
    for (const f of r.geojson?.features ?? []) {
      const g = f?.geometry;
      if (g?.type === 'LineString') coords.push(...(g.coordinates as LngLat[]));
      else if (g?.type === 'MultiLineString') for (const part of g.coordinates as LngLat[][]) coords.push(...part);
    }
    return { bbox: bboxOfGeojsons([r.geojson]), lengthKm: polylineLengthMeters(coords) / 1000, pointCount: coords.length };
  });
}

export function summarizeMeasures(cfg: RenderConfig): ResolvedMeasures { /* pairs / routes / regions theo Interfaces */ }
```

`tools.ts` — schema + gắn vào `resolvedOf`:
```typescript
const routeSchema = z.object({
  geojson: z.any().optional(),
  coords: z.array(z.tuple([lng, lat])).min(2).optional(),
  color: hexColor.optional(),
  width: z.number().min(1).max(16).optional(),
}).refine((r) => (r.geojson == null) !== (r.coords == null), { message: 'pass exactly one of routes[].geojson or routes[].coords' });

// trong renderMapShape:
  routes: z.array(routeSchema).optional(),
  measure: z.object({ pairs: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])).optional() }).strict().optional(),
```
và trong `resolvedOf(cfg)` thêm `routes: summarizeRoutes(cfg)` + `measures: summarizeMeasures(cfg)` (chỉ khi có dữ liệu, để response không phình cho lời gọi không dùng).

- [ ] **Step 3.4: Run → PASS** — `npx vitest run mcp-server/`

- [ ] **Step 3.5: Commit** — `git commit -m "feat(mcp): tham số routes + measure, resolved.routes/measures, cap tổng geometry"`

### Task 4: Bất biến cấu trúc + verify + README

**Files:**
- Create: `_acceptance/routes-measurements/scripts/routes-invariants.ts`
- Modify: `README.md`

- [ ] **Step 4.1: Script bất biến** — I1 t3_path (`export.ts`, `mapStyle.ts`) không đụng vs merge-base; I2 mọi field mới có runtime assert vừa định-nghĩa-vừa-được-gọi; I3 không có tên số đo trần `km:` trong `resolveConfig.ts` (chỉ `lengthKm`/`straightLineKm`/`areaKm2`).

Bắt buộc: chứng minh script FAIL được (tạm bỏ một assert → chạy → thấy đỏ → khôi phục).

- [ ] **Step 4.2: `npm run verify` + `npm run test:mcp`** — cả hai phải xanh.

- [ ] **Step 4.3: README** — mục `render_map`: `routes` (hai dạng), `measure.pairs`, và `resolved.routes`/`resolved.measures`; ghi rõ `straightLineKm` là đường chim bay chứ không phải quãng đường đi.

- [ ] **Step 4.4: Commit + push + PR**

---

## Self-Review

1. **Spec coverage:** spec §5 dòng PR #2 = routes plumbing (Task 2+3) + measurements (Task 1+3) ✓. `bboxOfRegions` học routes ✓. Cap tổng ✓. Tên `straightLineKm` ✓. Không đụng mapStyle ✓.
2. **Placeholder scan:** `summarizeMeasures` thân hàm để "theo Interfaces" — chấp nhận được vì kiểu trả về đã đặc tả đầy đủ ở khối Interfaces của Task 3; mọi phần khác có code đủ.
3. **Type consistency:** `RenderRoute` (Task 2) dùng lại ở Task 3 ✓; `LngLat`/`polylineLengthMeters` (Task 1) dùng ở Task 3 ✓; `bboxOfGeojsons` đổi tên một lần, cập nhật 2 call site ✓.

# PR #5 — Road routing (OSRM)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development hoặc superpowers:executing-plans.

**Goal:** Cho agent hỏi "đường đi thực tế từ A tới B" và nhận về polyline bám đường kèm km/phút — thứ LLM **không thể tự sinh**. Đây là mảnh cuối recipe `connectivity` cần (video "từ dự án đi đâu cũng gần").

**Architecture:** File mới `mcp-server/src/route.ts` gọi OSRM, trả GeoJSON LineString. `resolveRoutes` (PR #2) nhận thêm dạng thứ ba `{ route: {...} }` bên cạnh `coords`/`geojson`. Không đụng engine render — tuyến đi vào đúng `RenderConfig.routes` đã có.

**Tech Stack:** TypeScript, Zod, Vitest, OSRM HTTP API.

## Global Constraints

- **CẤM đụng `src/lib/export.ts` và `src/lib/mapStyle.ts`** — t3_path.
- **Host OSRM CHỈ đến từ env, KHÔNG BAO GIỜ từ tham số caller.** Đây là lời gọi mạng ra ngoài đầu tiên mà nội dung do caller ảnh hưởng; để caller chọn host là SSRF vào tiến trình đang giữ browser pool và cổng loopback.
- Mọi field Zod mới PHẢI có runtime assert trong `resolveConfig.ts`.
- Attribution **không đổi**: `ATTRIBUTION_TEXT` đã có "© OpenStreetMap contributors", mà OSRM chạy trên dữ liệu OSM → không có lý do kéo `export.ts` vào.
- Immutability; không `console.log`; conventional commits, không footer attribution.
- Sau toàn bộ: `npm run verify` (**hai** project tsc) + `npm run test:mcp` xanh.
- Thuế gate: làm stale **cả sáu** hợp đồng đã ký → một PR.

## Ba rủi ro phải xử lý, không được bỏ qua

**R1 — Lời gọi mạng nằm TRONG clip slot.** `resolveConfig` chạy bên trong slot đã lấy (`motionCompiler.ts` `prepareClipRenderWithSlot`), mà clip concurrency mặc định = 1. Một router chậm sẽ giữ slot toàn cục trong lúc phía sau đếm ngược deadline pool 10 phút. → **timeout cứng** cho mọi lời gọi router, mặc định 8s, env chỉnh được; hết giờ là ném lỗi caller-actionable chứ không treo.

**R2 — SSRF.** Host phải từ env. Toạ độ đi vào URL phải là số đã validate, không phải chuỗi caller đưa thẳng.

**R3 — FOSSGIS demo không phải hạ tầng production.** Instance công cộng không có SLA và có chính sách dùng hợp lý. → mặc định trỏ vào đó để chạy được ngay, nhưng README **và** thông điệp lỗi phải nói rõ production tự host; và phải có rate-limit nối tiếp giống `geocode.ts`.

---

### Task 1: `route.ts` — client OSRM

**Files:** Create `mcp-server/src/route.ts`, `mcp-server/src/route.test.ts`

**Interfaces:**
- Produces: `resolveRoute(input: RouteRequest, env?): Promise<ResolvedRouteGeometry>` với
  `RouteRequest = { from: [number,number]; to: [number,number]; via?: [number,number][]; mode?: 'car'|'moto'|'walk' }`
  `ResolvedRouteGeometry = { geojson: GeoJSONFeatureCollection; distanceKm: number; durationMin: number; provider: string; pointCount: number }`
- `OSRM_PROFILE = { car: 'driving', moto: 'driving', walk: 'foot' }` — OSRM demo chỉ phục vụ `driving`/`foot`/`bike`; **moto ánh xạ sang driving và điều đó phải được ghi ra**, không giả vờ có profile riêng.
- Env: `MAPPOSTER_OSRM_URL` (mặc định `https://routing.openstreetmap.de/routed-car`), `MAPPOSTER_ROUTE_TIMEOUT_MS` (8000), `MAPPOSTER_ROUTE_CACHE_MAX` (200), `MAPPOSTER_ROUTE_MIN_SPACING_MS` (250).

- [ ] **Step 1.1: Failing tests** (`mcp-server/src/route.test.ts`) — mock `fetch`, không gọi mạng thật:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveRoute, __resetRouteCache, __setRouteSpacingMs, decimate, OSRM_PROFILE } from './route';

const okBody = (coords: [number, number][], distance = 12400, duration = 1680) => ({
  code: 'Ok',
  routes: [{ distance, duration, geometry: { type: 'LineString', coordinates: coords } }],
});

beforeEach(() => { __resetRouteCache(); __setRouteSpacingMs(0); vi.restoreAllMocks(); });

describe('resolveRoute', () => {
  it('asks OSRM for full GeoJSON geometry and returns km/min', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(okBody([[105.8, 21.0], [105.9, 21.1]]))));
    vi.stubGlobal('fetch', f);

    const r = await resolveRoute({ from: [105.8, 21.0], to: [105.9, 21.1], mode: 'car' });

    const url = String(f.mock.calls[0][0]);
    // geometries=geojson là lý do chọn OSRM thay Valhalla: khỏi phải viết
    // polyline decoder, và khỏi một lớp có thể sai lặng lẽ.
    expect(url).toContain('overview=full');
    expect(url).toContain('geometries=geojson');
    expect(url).toContain('105.8,21');
    expect(r.distanceKm).toBeCloseTo(12.4, 3);
    expect(r.durationMin).toBeCloseTo(28, 3);
    expect(r.geojson.features[0].geometry.type).toBe('LineString');
    expect(r.pointCount).toBe(2);
  });

  it('maps moto to the driving profile and says so in provider', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(okBody([[1, 1], [2, 2]])))));
    const r = await resolveRoute({ from: [1, 1], to: [2, 2], mode: 'moto' });
    expect(OSRM_PROFILE.moto).toBe('driving');
    expect(r.provider).toMatch(/driving/);
  });

  it('sends via points in order between from and to', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(okBody([[1, 1], [2, 2]]))));
    vi.stubGlobal('fetch', f);
    await resolveRoute({ from: [1, 1], via: [[1.5, 1.5]], to: [2, 2] });
    expect(String(f.mock.calls[0][0])).toContain('1,1;1.5,1.5;2,2');
  });

  it('caches an identical request instead of paying the network twice', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(okBody([[1, 1], [2, 2]]))));
    vi.stubGlobal('fetch', f);
    await resolveRoute({ from: [1, 1], to: [2, 2] });
    await resolveRoute({ from: [1, 1], to: [2, 2] });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('reports a no-route answer as a caller-actionable error, not an empty line', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: 'NoRoute', routes: [] }))));
    await expect(resolveRoute({ from: [1, 1], to: [2, 2] })).rejects.toThrow(/no route/i);
  });

  it('names the self-hosting remedy when the upstream fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })));
    // Thông điệp phải nói được caller/vận hành làm gì tiếp, không chỉ "503".
    await expect(resolveRoute({ from: [1, 1], to: [2, 2] })).rejects.toThrow(/MAPPOSTER_OSRM_URL/);
  });

  it('gives up on a hung upstream rather than holding the clip slot', async () => {
    // R1: resolveConfig chạy TRONG clip slot (concurrency 1). Không có timeout
    // thì một router treo sẽ giữ slot toàn cục tới tận deadline pool 10 phút.
    vi.stubGlobal('fetch', vi.fn((_u: string, init?: { signal?: AbortSignal }) =>
      new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('aborted')))),
    ));
    await expect(
      resolveRoute({ from: [1, 1], to: [2, 2] }, { ...process.env, MAPPOSTER_ROUTE_TIMEOUT_MS: '30' }),
    ).rejects.toThrow(/timed out/i);
  });
});

describe('decimate', () => {
  it('caps the point count while keeping both endpoints', () => {
    const many = Array.from({ length: 5000 }, (_, i) => [i / 1000, 0] as [number, number]);
    const out = decimate(many, 700);
    expect(out.length).toBeLessThanOrEqual(700);
    expect(out[0]).toEqual(many[0]);
    expect(out[out.length - 1]).toEqual(many[many.length - 1]);
  });

  it('leaves a short line untouched', () => {
    const few: [number, number][] = [[0, 0], [1, 1], [2, 2]];
    expect(decimate(few, 700)).toEqual(few);
  });
});
```

- [ ] **Step 1.2: Run → FAIL** (`npx vitest run mcp-server/src/route.test.ts`)
- [ ] **Step 1.3: Implement `route.ts`.** Điểm bắt buộc:
  - `baseUrl` đọc từ `env.MAPPOSTER_OSRM_URL`, **không** nhận từ tham số hàm công khai.
  - Toạ độ ghép vào URL qua `Number(...)` đã validate, không nội suy chuỗi thô.
  - `AbortSignal.timeout(ms)` cho mọi fetch; bắt `AbortError` → ném lỗi có chữ "timed out" + tên env chỉnh.
  - LRU + throttle nối tiếp **sao chép mẫu `geocode.ts`** (`lruGet`/`lruSet`/`queue`), không phát minh lại.
  - `decimate(coords, max)`: giữ điểm đầu/cuối, lấy mẫu đều ở giữa.
  - Test seam `__resetRouteCache` / `__setRouteSpacingMs` như `geocode.ts` đã làm.
- [ ] **Step 1.4: Run → PASS** · **Step 1.5: Commit**

### Task 2: `routes[].route` ở tầng resolver + tool

**Files:** Modify `mcp-server/src/resolveConfig.ts`, `mcp-server/src/tools.ts` · Test `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- `RouteInput` nhận thêm `route?: { from, to, via?, mode? }` — **đúng một** trong `coords`/`geojson`/`route`.
- `resolved.routes[i]` khi đi qua router mang thêm `distanceKm`, `durationMin`, `provider`.
- `from`/`to` nhận `[lng,lat]` **hoặc** chuỗi địa danh (geocode qua `resolveLocation`, thừa hưởng anchor quốc gia đã có).

- [ ] **Step 2.1: Failing tests** — mock `./route` giống cách file này đã mock `./geocode`:

```typescript
it('accepts a route request and echoes distance/duration alongside the geometry', async () => {
  const cfg = await resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    routes: [{ route: { from: [105.8, 21.0], to: [105.9, 21.1], mode: 'car' }, color: '#ff0000' }],
  });
  expect(cfg.routes?.[0].color).toBe('#ff0000');
  const [r] = summarizeRoutes(cfg);
  expect(r.distanceKm).toBeCloseTo(12.4, 1);
  expect(r.durationMin).toBeCloseTo(28, 1);
  expect(r.provider).toMatch(/osrm/i);
  // lengthKm (tổng polyline ta tự đo) KHÁC distanceKm (router báo) — hai phép
  // đo khác nhau, phải cùng tồn tại chứ không được gộp.
  expect(r.lengthKm).toBeGreaterThan(0);
});

it('refuses an entry carrying more than one of coords/geojson/route', async () => {
  await expect(resolveConfig({
    location: { lng: 105.85, lat: 21.02 },
    routes: [{ coords: [[1, 1], [2, 2]], route: { from: [1, 1], to: [2, 2] } }],
  } as never)).rejects.toThrow(/exactly one of/);
});

it('geocodes a named from/to through the same country anchor as highlights', async () => {
  const cfg = await resolveConfig({
    location: 'Ho Chi Minh City',
    routes: [{ route: { from: 'Bến Thành', to: 'Tân Sơn Nhất' } }],
  });
  expect(geocode.resolveLocation).toHaveBeenCalledWith('Bến Thành', 'Vietnam');
  expect(cfg.routes).toHaveLength(1);
});
```

- [ ] **Step 2.2: Run → FAIL** · **Step 2.3: Implement** — `resolveRoutes` thành `async`, ba nhánh loại trừ; `tools.ts` thêm `route` vào `routeSchema` với `.refine` đếm đúng-một-trong-ba. `summarizeRoutes` echo thêm ba trường khi có.
- [ ] **Step 2.4: Run → PASS** · **Step 2.5: Commit**

### Task 3: Bất biến + verify + README + hợp đồng

- [ ] **Step 3.1:** `_acceptance/road-routing/scripts/routing-invariants.ts` — I1 t3_path; **I2 host router CHỈ đến từ env** (grep: không có `baseUrl` nào đọc từ tham số công khai, và `MAPPOSTER_OSRM_URL` là nguồn duy nhất); I3 mọi `fetch` trong `route.ts` mang `signal`; I4 `route.ts` không import `export.ts`/`mapStyle.ts`. Chứng minh script fail được.
- [ ] **Step 3.2:** `npm run verify` (hai project tsc) + `npm run test:mcp`.
- [ ] **Step 3.3:** README — dạng `route`, bảng mode→profile (**nêu rõ moto = driving**), env, và cảnh báo production tự host.
- [ ] **Step 3.4:** hợp đồng + evals + verify context sạch + Cổng 2 + PR.

---

## Self-Review

1. **Spec coverage:** spec §5 PR #5 = road routing OSRM, file mới `route.ts`, self-host cho production — Task 1-3 phủ đủ ✓.
2. **Placeholder scan:** Step 1.3 liệt kê điểm bắt buộc thay vì dán cả file; chấp nhận được vì test ở 1.1 đã khoá toàn bộ hợp đồng hàm ✓.
3. **Type consistency:** `RouteRequest`/`ResolvedRouteGeometry` (Task 1) dùng lại nguyên vẹn ở Task 2; `RouteInput` mở rộng chứ không thay ✓.
4. **Rủi ro đã biết:** `resolveRoutes` chuyển sang async kéo theo `resolveConfig` — vốn đã async nên không lan ra ngoài; phải kiểm `render_variants` merge override vẫn chạy.

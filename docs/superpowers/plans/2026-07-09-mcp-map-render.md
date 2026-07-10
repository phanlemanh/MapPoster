# MCP Map-Render Service (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose MapPoster's renderer to AI agents via an MCP server that returns still map images (PNG) — geocoded, highlighted (point/region), in TikTok/other formats — by driving the existing web app in a headless browser.

**Architecture:** A stable primitive `renderFrame(config) → PNG` renders a fully-resolved config through the MapPoster app's new headless "render mode" (Playwright page pool). Geocoding + boundary lookup run in Node with caching. MCP tools compose on `renderFrame`.

**Tech Stack:** Node + TypeScript, `@modelcontextprotocol/sdk`, Playwright (already a devDep), Vitest, the existing React/MapLibre app.

> **Correction applied in S4 round 1 (do not follow the hash below).** Tasks 3 and 7 originally
> specified `#config=` in the URL. That is a *same-document* navigation, so a reused pooled page
> never reloads and returns a stale frame. The shipped code uses `?config=` plus a `configKey`
> assertion in `renderFrame`. See the design doc.

## Global Constraints

- Reuse existing pure modules — do NOT duplicate: `src/data/{themes,layouts,fonts,markers}.ts`, `src/lib/{mapStyle,geocoding,format}.ts`, `src/lib/export.ts` (refactored), `src/types.ts`, highlight/marker logic. Copy-paste of these = plan failure.
- The internal primitive is `renderFrame(config: RenderConfig): Promise<Buffer>`. Every tool calls it. No tool renders by another path (keeps the Hướng-B swap non-breaking).
- Geocoding/boundary lookups happen ONLY in Node (`mcp-server/`), never inside the headless page. The page receives a fully-resolved `RenderConfig` (concrete coords + GeoJSON) and loads tiles only.
- `chrome` default = `"clean"` (no city-title overlay). Delivery default for stills = `both` (base64 + file path). Sink = a configured shared-volume dir.
- Formats include `tiktok` = 1080×1920. All export dims ≤ 4096px per edge (WebGL budget).
- The existing app's own export/download path MUST stay green (Playwright export E2E is the guard).
- Node ≥ 20 (global `fetch`). Do not add heavy deps beyond the MCP SDK; Playwright is already present.
- Out of scope this plan: `render_sequence`, `render_clip`/mp4, S3/GCS sink, auth/quota, native (B) engine.

---

### Task 1: Refactor `export.ts` — extract reusable `composePoster`

Split the compositing (map + markers + text + attribution → canvas) from the download side-effect so both the app and render mode reuse it. **T3 path (`src/lib/export.ts`) — app export must not regress.**

**Files:**
- Modify: `src/lib/export.ts`
- (guard) Existing `e2e/mapposter.spec.ts` export test is the regression check.

**Interfaces:**
- Produces:
  - `async function composePoster(map: MlMap, opts: ComposeOpts): Promise<HTMLCanvasElement>` — raises pixelRatio, waits idle, draws map+markers+text+attribution onto a canvas of `opts.width × opts.height`, restores ratio, returns the canvas. (This is the current body of `exportPoster` minus the file download.)
  - `interface ComposeOpts { width: number; height: number; markers: MarkerItem[]; text: ExportTextConfig; }` (ExportTextConfig = the existing `ExportOptions['text']` shape.)
  - `exportPoster(opts)` stays as the download wrapper: `const c = await composePoster(map, {...}); format==='png' ? downloadPng(c,...) : downloadPdf(c, layout, ...)`.
- Consumes: existing `drawMarker`, `drawPosterText`, `drawAttribution`.

- [ ] **Step 1: Extract `composePoster`.** Move the "device px / setPixelRatio / waitForIdle / drawImage / markers / text / attribution / restore" block out of `exportPoster` into `composePoster(map, opts)` returning `out` (the canvas). `exportPoster` computes `layout` → `opts.width/height`, calls `composePoster`, then does `downloadPng`/`downloadPdf`. Export `composePoster` + `ComposeOpts`.

```ts
export interface ComposeOpts {
  width: number;
  height: number;
  markers: MarkerItem[];
  text: ExportOptions['text'];
}

export async function composePoster(map: MlMap, opts: ComposeOpts): Promise<HTMLCanvasElement> {
  const canvasEl = map.getCanvas();
  const cssW = canvasEl.clientWidth || canvasEl.width;
  const ratio = opts.width / cssW;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyMap = map as any;
  const originalRatio = typeof anyMap.getPixelRatio === 'function' ? anyMap.getPixelRatio() : window.devicePixelRatio || 1;
  if (typeof anyMap.setPixelRatio === 'function') { anyMap.setPixelRatio(ratio); map.triggerRepaint(); await waitForIdle(map); }
  const out = document.createElement('canvas');
  out.width = opts.width; out.height = opts.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Could not create export canvas');
  try {
    ctx.drawImage(canvasEl, 0, 0, out.width, out.height);
    for (const m of opts.markers) { const p = map.project([m.lng, m.lat]); drawMarker(ctx, m, p.x, p.y, ratio); }
    if (opts.text.show) { await drawPosterText(ctx, out.width, out.height, { /* map from opts.text as today */ } as PosterTextConfig); }
    drawAttribution(ctx, out.width, out.height, opts.text.color);
  } finally {
    if (typeof anyMap.setPixelRatio === 'function') { anyMap.setPixelRatio(originalRatio); map.triggerRepaint(); }
  }
  return out;
}
```

- [ ] **Step 2: Re-point `exportPoster`** to `const out = await composePoster(map, { width: layout.width, height: layout.height, markers: opts.markers, text: opts.text });` then keep the existing `downloadPng`/`downloadPdf` calls.
- [ ] **Step 3: Typecheck.** Run: `npx tsc -b` — Expected: exit 0.
- [ ] **Step 4: Regression — app export still works.** Run: `npm run test:e2e -- -g "export"` — Expected: the "Download → PNG" test passes (a real 1080×1920-class PNG downloads).
- [ ] **Step 5: Commit.** `git add src/lib/export.ts && git commit -m "refactor(export): extract composePoster from exportPoster"`

**Serves:** AC-1, AC-10 (compose reused headlessly). **independent:** false (foundation).

---

### Task 2: `RenderConfig` type + `applyRenderConfig` (store hydration)

Isomorphic type describing a fully-resolved render, plus a function that deterministically sets the store from it (bypassing geocode/onboarding).

**Files:**
- Create: `src/render/renderConfig.ts`
- Create: `src/render/applyRenderConfig.ts`
- Test: `src/render/applyRenderConfig.test.ts`

**Interfaces:**
- Produces (`renderConfig.ts`):

```ts
import type { FontKey, GeoJSONFeatureCollection, LayerState, MarkerIconKey } from '../types';
export interface RenderCamera { center: [number, number]; zoom: number; bearing?: number; pitch?: number; }
export interface RenderConfig {
  camera: RenderCamera;
  size: { width: number; height: number };
  theme: string;
  layers?: Partial<LayerState>;
  detail?: number;
  chrome: 'clean' | 'label' | 'poster';
  font?: FontKey;
  place: { name: string; country: string; lat: number; lng: number };
  highlight?: { regions: { geojson: GeoJSONFeatureCollection; color: string | null }[]; color: string | null; fill: boolean; dim: boolean };
  markers?: { lng: number; lat: number; icon: MarkerIconKey; color: string; size: number }[];
}
```

- Produces (`applyRenderConfig.ts`): `function applyRenderConfig(cfg: RenderConfig): void` — calls `usePosterStore.setState(...)` to set location/view/theme/layers/detail/font/markers/highlightRegions/highlightFill/highlightDim/highlightEnabled and chrome→`showText` (`clean`→false, `label`/`poster`→true; `poster`→showCity true, `label`→showCity false), and `onboardingDone: true`.
- Consumes: `usePosterStore`, `getLayout`/`DEFAULT_LAYERS`.

- [ ] **Step 1: Write the failing test.**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePosterStore } from '../store/usePosterStore';
import { applyRenderConfig } from './applyRenderConfig';
import type { RenderConfig } from './renderConfig';

const cfg: RenderConfig = {
  camera: { center: [106.7, 10.78], zoom: 15 },
  size: { width: 1080, height: 1920 },
  theme: 'midnight-blue',
  chrome: 'clean',
  place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 },
  markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#fff', size: 40 }],
};

describe('applyRenderConfig', () => {
  beforeEach(() => usePosterStore.setState(usePosterStore.getState(), true));
  it('hydrates store deterministically and skips onboarding', () => {
    applyRenderConfig(cfg);
    const s = usePosterStore.getState();
    expect(s.onboardingDone).toBe(true);
    expect(s.themeId).toBe('midnight-blue');
    expect(s.view.center).toEqual([106.7, 10.78]);
    expect(s.view.zoom).toBe(15);
    expect(s.showText).toBe(false);           // chrome clean
    expect(s.markers).toHaveLength(1);
    expect(s.location.name).toBe('HCMC');
  });
  it('chrome=poster enables the title overlay', () => {
    applyRenderConfig({ ...cfg, chrome: 'poster' });
    expect(usePosterStore.getState().showText).toBe(true);
    expect(usePosterStore.getState().showCity).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fail.** Run: `npx vitest run src/render/applyRenderConfig.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement `renderConfig.ts` (type above) + `applyRenderConfig.ts`.** Map `chrome`→flags; set markers with generated ids; set highlight fields (enabled = highlight?.regions?.length>0).
- [ ] **Step 4: Run — pass.** Run: `npx vitest run src/render/applyRenderConfig.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit.** `git add src/render/ && git commit -m "feat(render): RenderConfig type + applyRenderConfig store hydration"`

**Serves:** AC-2, AC-3, AC-9. **independent:** true (vs Task 1 — different files).

---

### Task 3: Render mode entry (`render.html` + `RenderApp` + `window.__mapposter`)

A headless page that applies a `RenderConfig` and exposes the render API. Reuses `MapView` + `PosterOverlay`.

**Files:**
- Create: `src/render/RenderApp.tsx`, `src/render/main.tsx`
- Create: `render.html`
- Modify: `vite.config.ts` (multi-page build: `index.html` + `render.html`)
- Test: `e2e/render-mode.spec.ts`

**Interfaces:**
- Consumes: Task 1 `composePoster`, Task 2 `applyRenderConfig`/`RenderConfig`, `getMapInstance`, `MapView`, `PosterOverlay`, `Attribution`.
- Produces (`window.__mapposter`):

```ts
interface MapPosterApi {
  ready: Promise<void>;
  renderFrame(): Promise<{ dataUrl: string; width: number; height: number }>;
  setCamera(cam: RenderCamera): Promise<void>;
}
```

- `RenderApp.tsx`: renders ONLY a fixed-size poster frame (`MapView` + `PosterOverlay` + `Attribution`) at the config's aspect — no sidebar/panels/onboarding/settings-bar.
- `main.tsx`: parse `RenderConfig` from `location.hash` (`#config=<base64url json>`), `applyRenderConfig`, mount `RenderApp`, then set `window.__mapposter`. `ready` resolves after `getMapInstance().once('idle')` post-apply + `document.fonts.ready`. `renderFrame()` = `composePoster(map, {width,height,markers,text})` → `canvas.toDataURL('image/png')`.

- [ ] **Step 1: Write the failing e2e** (`e2e/render-mode.spec.ts`): navigate `/render.html#config=<b64 of tiktok config>`, `await window.__mapposter.ready`, call `renderFrame()`, assert returned `width===1080 && height===1920` and no `.onboard-overlay` present. (Mock Nominatim not needed — config is pre-resolved; tiles load from network.)
- [ ] **Step 2: Run — fail.** Run: `npx playwright test e2e/render-mode.spec.ts` — Expected: FAIL (render.html 404).
- [ ] **Step 3: Implement `RenderApp.tsx`** — a `<div className="render-stage">` sizing the poster-frame to fit the viewport at `size` aspect; children `MapView`, `PosterOverlay`, `Attribution`.
- [ ] **Step 4: Implement `main.tsx`** — parse hash config, `applyRenderConfig`, `createRoot().render(<RenderApp/>)`, then:

```ts
const map = getMapInstance();
let resolveReady: () => void;
const ready = new Promise<void>((r) => (resolveReady = r));
const done = async () => { await (document as any).fonts?.ready; resolveReady(); };
map ? map.once('idle', done) : setTimeout(done, 3000);
(window as any).__mapposter = {
  ready,
  async renderFrame() {
    const m = getMapInstance()!;
    const s = usePosterStore.getState();
    const layout = { width: cfg.size.width, height: cfg.size.height };
    const canvas = await composePoster(m, { width: layout.width, height: layout.height, markers: s.markers, text: textFromStore(s) });
    return { dataUrl: canvas.toDataURL('image/png'), width: layout.width, height: layout.height };
  },
  async setCamera(cam) { getMapInstance()!.jumpTo(cam); await new Promise((r) => getMapInstance()!.once('idle', r)); },
};
```

- [ ] **Step 5: Multi-page `vite.config.ts`** — `build.rollupOptions.input: { main: 'index.html', render: 'render.html' }`. `render.html` loads `/src/render/main.tsx`.
- [ ] **Step 6: Run — pass.** Run: `npm run build && npx playwright test e2e/render-mode.spec.ts` — Expected: PASS (renderFrame yields 1080×1920).
- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat(render): headless render mode + window.__mapposter API"`

**Serves:** AC-1, AC-10. **independent:** false (needs Tasks 1, 2).

---

### Task 4: `mcp-server` package scaffold

**Files:** Create `mcp-server/package.json`, `mcp-server/tsconfig.json`, `mcp-server/src/config.ts`.

**Interfaces:** Produces `interface ServerConfig { appDistDir: string; appPort: number; poolSize: number; sinkDir: string; }` + `loadServerConfig(env): ServerConfig` (reads env with defaults: poolSize=2, sinkDir=`./_render-out`).

- [ ] **Step 1:** `package.json` (name `@mapposter/mcp-server`, type module, deps: `@modelcontextprotocol/sdk`, `playwright`; devDeps inherit root vitest). tsconfig extends root style, `moduleResolution: bundler`, allows importing `../src/**`.
- [ ] **Step 2:** `config.ts` with `loadServerConfig`.
- [ ] **Step 3:** Install: `npm i -w mcp-server @modelcontextprotocol/sdk` (or root install if not using workspaces — then plain `npm i @modelcontextprotocol/sdk`). Run: `npx tsc -p mcp-server/tsconfig.json --noEmit` — Expected: exit 0.
- [ ] **Step 4: Commit.** `git add mcp-server && git commit -m "chore(mcp): scaffold mcp-server package"`

**Serves:** infra. **independent:** true.

---

### Task 5: Node geocode + boundary cache

Reuse `src/lib/geocoding.ts`; add caching + a ≤1 req/s queue.

**Files:** Create `mcp-server/src/geocode.ts`, `mcp-server/src/geocode.test.ts`.

**Interfaces:**
- Produces: `resolveLocation(input: string | {lng:number;lat:number;zoom?:number}): Promise<{center:[number,number];zoom:number;place:{name:string;country:string;lat:number;lng:number}}>`; `resolveBoundary(place: string): Promise<GeoJSONFeatureCollection|null>`. Both memoized by key; a shared serialized queue enforces ≥1000ms spacing on upstream calls.
- Consumes: `searchPlaces`, `fetchRegionBoundary` from `../../src/lib/geocoding`.

- [ ] **Step 1: Failing test (AC-4).** Mock `fetch`; call `resolveLocation('Hanoi')` twice + `resolveLocation('Paris')` once; assert upstream `fetch` called exactly 2 times (Hanoi cached on 2nd, Paris fresh).

```ts
import { vi, describe, it, expect, afterEach } from 'vitest';
import { resolveLocation, __resetGeoCache } from './geocode';
afterEach(() => { vi.unstubAllGlobals(); __resetGeoCache(); });
it('caches identical queries, misses on different ones (AC-4)', async () => {
  const fn = vi.fn(async (_u?: string) => ({ ok: true, json: async () => [{ place_id: 1, osm_type: 'relation', osm_id: 9, lat: '21', lon: '105', display_name: 'Hanoi, Vietnam', boundingbox: ['20.9','21.1','105.7','105.9'], address: { city: 'Hanoi', country: 'Vietnam' } }] }) as any);
  vi.stubGlobal('fetch', fn);
  await resolveLocation('Hanoi'); await resolveLocation('Hanoi'); await resolveLocation('Paris');
  expect(fn).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run — fail.** Run: `npx vitest run mcp-server/src/geocode.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `geocode.ts`: `Map` caches keyed by normalized query; `resolveLocation` string→`searchPlaces()[0]`; coords→pass-through with default zoom; `resolveBoundary`→`fetchRegionBoundary`. Add `__resetGeoCache()` (test seam). Serialized queue with 1000ms min spacing.
- [ ] **Step 4: Run — pass.** Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(mcp): node geocode + boundary cache with rate-limit"`

**Serves:** AC-4. **independent:** true.

---

### Task 6: `resolveConfig` — tool params → `RenderConfig`

**Files:** Create `mcp-server/src/resolveConfig.ts`, `mcp-server/src/resolveConfig.test.ts`.

**Interfaces:**
- Produces: `resolveConfig(params: RenderMapParams): Promise<RenderConfig>` and the param type `RenderMapParams` (matches tool schema: `location`, `highlight?`, `format?`, `theme?`, `chrome?`, `camera?`).
- Auto-framing: point → `zoom` clamp [14,17] (default 16) unless camera override; region → fit bbox of geojson → center+zoom (compute from bbox, reuse `zoomFromBbox`-style math); format→`size` via `getLayout` + a `tiktok` preset (add to a `FORMATS` map that includes layouts + `tiktok:{1080,1920}`).
- Consumes: Task 2 `RenderConfig`, Task 5 `resolveLocation`/`resolveBoundary`, `getLayout`/`LAYOUTS`, `getTheme`.

- [ ] **Step 1: Failing tests.** (a) `resolveConfig({location:'HCMC', format:'tiktok'})` → `size==={1080,1920}`, `camera.center` ≈ geocoded (mock geocode). (b) `highlight.points:['addr']` → one marker at geocoded coord + `camera.zoom` in [14,17]. (c) `highlight.regions:['Quận 3']` → `highlight.regions[0].geojson` is the mocked FC. (d) `chrome` defaults to `clean`.
- [ ] **Step 2: Run — fail.**
- [ ] **Step 3: Implement** with `FORMATS` map, auto-frame helpers, `resolveLocation`/`resolveBoundary` calls.
- [ ] **Step 4: Run — pass.**
- [ ] **Step 5: Commit.** `git commit -am "feat(mcp): resolveConfig (params → RenderConfig, auto-framing, formats)"`

**Serves:** AC-1, AC-2, AC-3, AC-8, AC-9. **independent:** false (needs 2, 5).

---

### Task 7: App static server + Playwright pool + `renderFrame` primitive

**Files:** Create `mcp-server/src/appServer.ts`, `mcp-server/src/browserPool.ts`, `mcp-server/src/renderFrame.ts`, `mcp-server/src/renderFrame.test.ts`.

**Interfaces:**
- Produces: `startAppServer(cfg): Promise<{url:string; close():Promise<void>}>` (serves `appDistDir` static). `createPool(cfg): {acquire():Promise<Page>; release(p):void; close():Promise<void>}`. `renderFrame(config: RenderConfig, deps): Promise<Buffer>` — acquire page → `page.goto(appUrl + '/render.html#config=' + b64(config))` → `page.waitForFunction('window.__mapposter?.ready')` then `await ready` → `page.evaluate(() => window.__mapposter.renderFrame())` → decode dataUrl → Buffer.
- Consumes: Task 3 render mode (served from `dist/`), Task 4 config.

- [ ] **Step 1: Failing integration test.** Build web first; start app server + pool; `renderFrame(tiktokConfig)` → assert Buffer decodes to a 1080×1920 PNG (read PNG IHDR width/height from the buffer bytes). Marked as needing the built app (`npm run build` in a `beforeAll`).
- [ ] **Step 2: Run — fail.**
- [ ] **Step 3: Implement** appServer (node `http` + a tiny static handler or `sirv`), browserPool (launch chromium with `--use-gl=angle --use-angle=swiftshader` etc. matching `playwright.config.ts`), `renderFrame`.
- [ ] **Step 4: Run — pass.** Run: `npx vitest run mcp-server/src/renderFrame.test.ts` — Expected: PASS (PNG 1080×1920).
- [ ] **Step 5: Commit.** `git commit -am "feat(mcp): app static server + browser pool + renderFrame primitive"`

**Serves:** AC-1, AC-10. **independent:** false (needs 3, 4).

---

### Task 8: Delivery / sink

**Files:** Create `mcp-server/src/delivery.ts`, `mcp-server/src/delivery.test.ts`.

**Interfaces:** Produces `deliver(png: Buffer, name: string, mode: 'both'|'url'|'inline', cfg): Promise<{path?:string; base64?:string; width:number; height:number; format:'png'}>` — writes to `cfg.sinkDir` when mode≠inline; includes base64 when mode≠url.

- [ ] **Step 1: Failing test.** `deliver(buf,'x','both',cfg)` → result has `path` (file exists) AND `base64`; `mode:'url'` → no base64.
- [ ] **Step 2–4: implement + pass.**
- [ ] **Step 5: Commit.** `git commit -am "feat(mcp): delivery sink (both/url/inline)"`

**Serves:** AC-7. **independent:** true.

---

### Task 9: MCP tools + server

**Files:** Create `mcp-server/src/tools.ts`, `mcp-server/src/server.ts`, `mcp-server/src/tools.test.ts`.

**Interfaces:**
- Produces: `registerTools(server, deps)` registering `render_map`, `render_variants`, `geocode_place`, `list_themes`, `list_formats` (Zod input schemas per the design contract). `render_map` = `resolveConfig` → `renderFrame` → `deliver`. `render_variants` = map over variants. `createServer(deps): McpServer`.
- Consumes: Tasks 5,6,7,8; `THEMES`, `FORMATS`.

- [ ] **Step 1: Failing tests.** With `renderFrame` stubbed to a fixed PNG: `render_map({location:'HCMC',format:'tiktok'})` → result `image.width===1080` + `resolved.center` set (AC-1); `render_variants({base, variants:[{theme:'ocean'},{theme:'ruby'}]})` → 2 images (AC-5); `list_formats()` includes `tiktok` (AC-8); custom `{width:1234,height:567}` flows to `renderFrame` config (AC-8); `chrome:'clean'` → config.chrome clean, `'poster'`→poster (AC-9); `render_map({location:'zzzzz'})` with geocode returning [] → `{ok:false,error}` not a throw (AC-11).
- [ ] **Step 2: Run — fail.**
- [ ] **Step 3: Implement** tools with Zod schemas + error wrapping (return structured error content, never throw to transport).
- [ ] **Step 4: Run — pass.** Run: `npx vitest run mcp-server/src/tools.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(mcp): tools (render_map/variants/geocode_place/list_*) + server"`

**Serves:** AC-1, AC-2, AC-3, AC-5, AC-8, AC-9, AC-11. **independent:** false (needs 5–8).

---

### Task 10: Transports — stdio + HTTP

**Files:** Create `mcp-server/src/stdio.ts`, `mcp-server/src/http.ts`, `mcp-server/src/transports.test.ts`.

**Interfaces:** `stdio.ts` = entry wiring `createServer` to `StdioServerTransport`. `http.ts` = entry wiring to the SDK's Streamable HTTP transport on `appPort+1`. Both call one `createServer(deps)`.

- [ ] **Step 1: Failing test (AC-6).** Start server over an in-memory/stdio pair AND over HTTP; `client.listTools()` on each returns a set including `render_map, render_variants, geocode_place, list_themes, list_formats`.
- [ ] **Step 2: Run — fail.**
- [ ] **Step 3: Implement** both entries + a shared `createServer`.
- [ ] **Step 4: Run — pass.** Run: `npx vitest run mcp-server/src/transports.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(mcp): stdio + HTTP transports"`

**Serves:** AC-6. **independent:** false (needs 9).

---

### Task 11: Wire tests into `npm test` + scripts + docs

**Files:** Modify `vitest.config.ts` (include `mcp-server/**/*.test.ts`), `package.json` (scripts), `README.md` (mcp-server section), `_acceptance/config.yaml` (already has `test.api`/`test.e2e`).

- [ ] **Step 1:** `vitest.config.ts` → `include: ['src/**/*.{test,spec}.{ts,tsx}', 'mcp-server/**/*.test.ts']`; keep `exclude: ['e2e/**', ...]` (renderFrame integration test that needs the built app + browser stays under a separate `test:e2e`-style tag OR guarded by `describe.skipIf(!built)` — put the browser-driven `renderFrame.test.ts` behind an env flag `MCP_INTEGRATION=1` so `npm test` stays fast; document it).
- [ ] **Step 2:** `package.json` scripts: `"mcp:stdio":"node --import tsx mcp-server/src/stdio.ts"`, `"mcp:http":"node --import tsx mcp-server/src/http.ts"`, `"test:mcp":"MCP_INTEGRATION=1 vitest run mcp-server"` (browser-driven suite). Add `tsx` devDep.
- [ ] **Step 3:** Run full gate. Run: `npm test` — Expected: all unit/integration (non-browser) pass. Run: `npm run test:e2e` — Expected: render-mode + existing E2E pass.
- [ ] **Step 4:** README: how to run the server + example `render_map` call.
- [ ] **Step 5: Commit.** `git commit -am "chore(mcp): wire tests + scripts + docs"`

**Serves:** makes all `test` evals runnable (executor resolution). **independent:** false (final wiring).

---

## Self-Review

**Spec coverage:** AC-1→T1/T3/T6/T7/T9 · AC-2→T2/T6/T9 · AC-3→T2/T6/T9 · AC-4→T5 · AC-5→T9 · AC-6→T10 · AC-7→T8 · AC-8→T6/T9 · AC-9→T2/T6/T9 · AC-10→T1/T3/T7 · AC-11→T9 · AC-12→judgment on a render produced via T9 (E12 example image). All 12 ACs covered.

**Independent tasks (S3 fan-out candidates):** T2, T4, T5, T8 (distinct files, no cross-deps). T1 is foundation for T3/T7. T3 needs T1+T2; T6 needs T2+T5; T7 needs T3+T4; T9 needs T5-T8; T10 needs T9; T11 last.

**Suggested order:** T1 ∥ T2 ∥ T4 ∥ T5 ∥ T8 → T3 (after T1,T2) ∥ T6 (after T2,T5) → T7 (after T3,T4) → T9 (after T5,T6,T7,T8) → T10 → T11.

**Placeholder scan:** interface signatures + test code concrete; mechanical glue (static handler, Zod schemas) described with exact shapes. **Type consistency:** `RenderConfig`, `composePoster`, `renderFrame`, `resolveConfig`, `deliver` names are stable across tasks.

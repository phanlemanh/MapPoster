# MapPoster

A fully client-side web app for creating and downloading **artistic map posters & wallpapers** — a Terraink-style clone. Search any place, pick a color theme and a layout, and export a high-resolution PNG or print-ready PDF.

No backend, no API keys. Map data comes from [OpenFreeMap](https://openfreemap.org/) vector tiles (OpenStreetMap / OpenMapTiles) rendered with MapLibre GL JS.

## Tech stack

- **React 18 + TypeScript + Vite**
- **MapLibre GL JS** — map engine (`preserveDrawingBuffer` enabled for high-res export)
- **OpenFreeMap** planet vector tiles — `https://tiles.openfreemap.org/planet` (no key)
- **Nominatim** — geocoding autocomplete (debounced, abortable, respects rate limits)
- **Zustand** (+ `persist`) — state management saved to `localStorage`
- **jsPDF** — PDF export · **@tmcw/togeojson** — GPX parsing

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + unit tests + production build
```

## Testing

Two layers, both automated:

| Command | What it runs |
|---------|--------------|
| `npm test` | **Vitest** unit/integration suite (jsdom) — pure logic: map-style generation, GPX parsing, geocoding (mocked `fetch`), the Zustand store + v1→v2 migration, coordinate/slug formatting, and theme/layout/font data integrity. ~0.5s. |
| `npm run test:e2e` | **Playwright** E2E — drives the real UI in headless Chromium (SwiftShader WebGL) with Nominatim mocked: onboarding → search → theme/layout/style → multi-region highlight → drop a marker → export a PNG download. |
| `npm run verify` | typecheck + Vitest + Playwright (full gate) |

`npm run build` runs the fast Vitest suite as a gate before bundling. The Playwright suite is kept separate (it starts a browser) — run it via `npm run test:e2e` or in CI. First-time E2E needs the browser: `npx playwright install chromium`.

## MCP map-render server

`mcp-server/` exposes MapPoster's renderer to AI agents via MCP, so an agent (e.g. a video pipeline) can fetch a still map illustration on demand — geocoded, point/region-highlighted, in TikTok/other formats. It drives the app's **headless render mode** (`render.html`) in a Playwright page pool behind a stable `renderFrame(config) → PNG` primitive; geocoding + boundary lookup run in Node with caching.

```bash
npm run build          # produce dist/ (the render harness the server serves)
npm run mcp:stdio      # run over stdio (local)
npm run mcp:http       # run over Streamable HTTP (hosted, port 4181)
npm run test:mcp       # gated integration test (builds app + renders a real PNG)
```

Tools: `render_map`, `render_variants`, `geocode_place`, `list_themes`, `list_formats`. Example call:

```jsonc
render_map({
  "location": "Võ Văn Tần, Quận 3, HCMC",
  "highlight": { "points": ["Võ Văn Tần, HCMC"] },
  "format": "tiktok",        // 1080×1920
  "theme": "midnight-blue",
  "chrome": "clean"
})
// → { image: { path, base64, width: 1080, height: 1920 },
//     resolved: { center, zoom, place, theme, highlights: { regions:[{bbox,center}], points:[{lng,lat}] } } }
```

`resolved` echoes every choice the server made on your behalf — the camera it framed, the theme it used, and the extent of each region it resolved by name, so a caller can tell *which* "District 1" it got. An unknown `theme` is refused rather than quietly replaced with the default.

Config via env: `MAPPOSTER_DIST` (default `dist`), `MAPPOSTER_APP_PORT`, `MAPPOSTER_APP_HOST` (default `127.0.0.1`), `MAPPOSTER_POOL` (pages, default 2), `MAPPOSTER_SINK` (output dir, default `_render-out`), `MAPPOSTER_HTTP_HOST` (default `127.0.0.1` — these tools drive a browser and write files, so hosted deployments must opt in with `0.0.0.0`). Design: `docs/superpowers/specs/2026-07-09-mcp-map-render-design.md`.

The HTTP transport is unauthenticated, so it refuses any request whose `Host` it does not answer to, and any request carrying an `Origin` at all — a server-to-server MCP client sends none, a web page always does. Loopback binding alone would not stop DNS rebinding. A hosted deployment must therefore declare `MAPPOSTER_HTTP_ALLOWED_HOSTS=maps.internal` (and `MAPPOSTER_HTTP_ALLOWED_ORIGINS=https://studio.internal` if a browser calls it); otherwise only loopback `Host` headers are accepted and the server says so on startup. Request bodies are capped at 8 MiB (`MAPPOSTER_HTTP_MAX_BODY`) and refused with `413` — `Host` and `Origin` are trivially forged by exactly the non-browser clients the guard admits, so an unbounded body would OOM the process and take the shared browser pool with it.

**Two listeners, not one.** Alongside the MCP transport, `mcp-server` runs a small static server (`MAPPOSTER_APP_PORT`, default 4180) that serves `dist/` to its own headless browser. It has no access control beyond a path-traversal guard, so it binds `127.0.0.1` (`MAPPOSTER_APP_HOST`). It starts for **both** transports, including stdio — a `listen(port, callback)` there would bind every interface and quietly publish `dist/` to the LAN on every deployment.

### Vietnamese addresses

Nominatim's free-form parser does not understand how VN addresses are written, so `resolveLocation` canonicalises them first (measured against the live API — `npx tsx mcp-server/scripts/check-vn-addresses.ts`):

- `TP.HCM` / `TPHCM` / `HCMC` / `TP. Hồ Chí Minh` / `Sài Gòn` → `Ho Chi Minh City`; likewise `Hà Nội` → `Hanoi`, `Đà Nẵng` → `Da Nang`.
- `Quận 3` / `Q.7` → `District 3` / `District 7`; `Phường 5` → `Ward 5`; a leading `Đường` is dropped.
- A leading house number is retried without it (`123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh` returns **0 hits**; the street alone resolves correctly). The **district is never dropped automatically** — that would match a same-named street 60 km away in the same (post-2025-merger, very large) Ho Chi Minh City.
- Same-granularity hits are re-ordered by Nominatim's `importance`; different granularities keep the order Nominatim chose. Concretely: hits are bucketed by `place_rank` and each bucket is sorted. Re-ordering *across* ranks would let the city outrank the district you asked for, and a comparator that merely returns `0` across ranks is [not a valid ordering](src/lib/geocoding.ts) — its result depends on the order Nominatim happened to send.
- Labels use the *matched feature* (`Võ Văn Tần`, `District 3`, `Hoàn Kiếm Lake`), not the administrative parent — which today is `Thủ Đức` for most of HCMC.
- **Regions go through the same pipeline as points**: canonicalised, filtered to the city the query names, then the polygon of that exact OSM relation is fetched by id.
- Every highlight is anchored to the **country** of the location being rendered. Auto-framing follows a region's bounding box, so an unanchored `District 1` — whose top Nominatim hit is a real district in **Liberia** — would silently relocate the whole poster. When `location` is `{lng,lat}` it carries no country, so one reverse-geocode supplies the anchor; if that lookup can't say what country the map is in, a highlight named by string is **refused** rather than resolved unguarded.

**Known limits.** Free-form ranking still mis-resolves some street addresses (`Đường Lê Lợi, Quận 1` ranks a nearby primary school first), and ward-level boundaries usually do not exist (`Phường Bến Nghé, Quận 1` → no polygon). An ambiguous region outside the anchor country is **refused**, not guessed. For anything that must be exact, call `geocode_place` — it returns a **candidate list** — then pass explicit `{lng,lat}` plus `placeName` to `render_map`. `placeName` overrides the poster label entirely.

Both paths are probed against the live API by `npx tsx mcp-server/scripts/check-vn-addresses.ts`; the unit tests mock `fetch`, so only that script can tell you whether ranking and boundary selection are still right.

## Features

Left sidebar opens slide-over panels:

| Panel | What it does |
|-------|--------------|
| **Location** | Nominatim autocomplete search, "Get my location" (Geolocation API), first-run onboarding modal |
| **Theme** | 12 presets (Midnight Blue, Carrara, Blush, Sandstone, Terracotta, Neon, Ruby, Sage, Blueprint, Forest, Noir, Ocean) — each re-tints every map layer |
| **Layout** | 16 sizes across Print (A3/A4/A5/Letter), Social (IG Square/Story, LinkedIn, Pinterest), Wallpaper (FHD/4K/Ultrawide/iPhone/iPad), Web |
| **Style** | Toggle poster text (city/country/coords), choose typeface (Space Grotesk, Montserrat, Playfair Display, Oswald, Bebas Neue, Merriweather) |
| **Layers** | Show/hide landcover, buildings, water, parks, roads, rail, aeroway + detail slider |
| **Markers** | Drop pin/heart/home/star/circle/square, drag to move, drag corner handle to resize, recolor |
| **Routes** | Upload `.gpx`, draw the track, recolor / adjust width |
| **Settings** | Lock map (freeze pan/zoom), enable rotation, reset |

### Export

`preserveDrawingBuffer` is on, so the WebGL canvas can be read back. On download the preview map's `pixelRatio` is temporarily raised so its backing store becomes the layout's exact pixel size (identical framing, more pixels). The map canvas, DOM markers (re-projected), the poster text overlay and the license attribution are composited onto a single canvas at full resolution, then exported as **PNG** (`toBlob`) or **PDF** (jsPDF; print sizes use physical mm/in page dimensions).

## Architecture

```
src/
  data/        themes · layouts · fonts · marker icons
  lib/         mapStyle (theme -> MapLibre style) · geocoding · gpx · export · posterText · format
  store/       usePosterStore (zustand + persist)
  components/  Sidebar · PosterCanvas · MapView · PosterOverlay · SettingsBar · OnboardingModal
    panels/    one component per tool panel
```

The map style is generated from the active theme, layer toggles, detail level and routes (`lib/mapStyle.ts`) with **no symbol/text layers**, so the map reads as a clean artistic base and the poster title is a separate overlay drawn identically in the DOM preview and on the export canvas.

## Attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), tiles by [OpenMapTiles](https://openmaptiles.org/) / [OpenFreeMap](https://openfreemap.org/), rendered with [MapLibre](https://maplibre.org/). Attribution is shown in-app **and baked into every exported image**.

## Notes

- Nominatim's policy asks for identification. Browsers forbid overriding the `User-Agent` header from `fetch` (they send the page Referer automatically), so requests also pass the supported `email` parameter and are debounced to respect the ~1 req/s limit.
- StrictMode is intentionally omitted in `main.tsx`: its dev-only double-invocation of effects races the MapLibre map create/teardown lifecycle.

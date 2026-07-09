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
// → { image: { path, base64, width: 1080, height: 1920 }, resolved: { center, zoom, place } }
```

Config via env: `MAPPOSTER_DIST` (default `dist`), `MAPPOSTER_APP_PORT`, `MAPPOSTER_POOL` (pages, default 2), `MAPPOSTER_SINK` (output dir, default `_render-out`). Design: `docs/superpowers/specs/2026-07-09-mcp-map-render-design.md`.

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

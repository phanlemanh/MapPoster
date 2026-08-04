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

One command after cloning — installs deps, builds the render harness, fetches the
headless browser:

```bash
npm run setup
```

There are **two independent ways to use MapPoster** — you do not need one to run
the other:

**1. The web app** (design and download posters yourself)

```bash
npm run dev      # → http://localhost:5173
```

**2. The MCP server** (let an AI agent render maps for you — see below). It is
already wired for Claude Code via [`.mcp.json`](.mcp.json): open this folder in
Claude Code, approve the `mapposter` server, and ask it to render a map. The
server runs its own headless browser — the `npm run dev` app does **not** need to
be running. The first render builds `dist/` if `npm run setup` didn't (a one-time
~10 s), then each render takes a few seconds.

<sub>`npm run build` = typecheck both projects + unit tests + production bundle.
`npm run setup` is the lighter "just make it runnable" path.</sub>

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
npm run mcp:stdio      # run over stdio (local) — builds dist/ on first run if missing
npm run mcp:http       # run over Streamable HTTP (hosted, port 4181)
npm run test:mcp       # gated integration test (builds app + renders a real PNG)
```

The server serves the built app from `dist/` to its headless browser and rebuilds
it automatically if it is missing. If you **edit app source** (`src/`) and want the
server to pick it up, rebuild explicitly — a stale `dist/` is served silently:

```bash
npx vite build
```

Tools: `render_map`, `render_variants`, `render_clip`, `geocode_place`, `list_themes`, `list_formats`. Example call:

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

`render_clip` renders the same place/highlight contract as `render_map`, plus a
`motion` param, as a short **text-free** MP4 camera-motion clip (AC-9: `chrome`
is always forced to `'clean'`, no matter what the caller asks for — the only
*chosen* text a clip may ever show is OpenStreetMap's own road labels, and
only when `layers.roadLabels` opts in). **One exception, baked in regardless
of `chrome`**: the OSM/OpenFreeMap/MapLibre licence attribution is drawn onto
every frame (`drawAttribution` in `src/lib/export.ts`) — a licence obligation
for that map data, kept in the pixels so compliance never depends on a
downstream consumer remembering to render it separately. Every other piece of
text (poster title, POI facts, price, distance, …) belongs in the *consuming*
DOM layer, never on the clip canvas; a test (`src/lib/export.test.ts`) locks
this down — with `chrome: 'clean'`, the attribution string is the only thing
`fillText`/`strokeText` ever draws. `motion` is either a named preset (`approach` —
flies in and reveals a region boundary; `pushIn` — pushes into and pulses
around a point; `drift` — a slow pan/zoom) with optional `fps`/`durationSec`
overrides, or a raw MotionScript `{ script }`. Example call:

```jsonc
render_clip({
  "location": "Hoàn Kiếm Lake, Hanoi",
  "highlight": { "points": ["Hoàn Kiếm Lake, Hanoi"] },
  "format": "tiktok",
  "motion": { "preset": "pushIn" }
})
// → { clip: { path, bytes, durationSec, fps, width: 1080, height: 1920 },
//     settle: { path, base64, format: 'png', width, height },
//     motion: { preset: 'pushIn', restAtSec },
//     resolved: { center, zoom, place, theme, highlights: {...} } }
```

Unlike every other tool here, the clip itself is **written to a file** under
`MAPPOSTER_SINK` and returned as `clip.path` rather than inlined as base64 —
a multi-megabyte MP4 would bloat the JSON-RPC stdio channel MCP runs over.
`delivery` (inline/file/both) still applies to the `settle` still, same as the
other image tools. If the MP4 encoder fails (missing ffmpeg, a corrupt frame),
the tool never throws the whole call away: the frames were already captured,
so it degrades to `{ settle, motion, resolved, clipError }` — the settle still
always exists.

**`render_clip` / `POST /render-clip` are synchronous and can take minutes at
production sizes** (measured: ~1.1s/frame cold at 1080×1920 — spec §3 — so a
6s/18fps clip is roughly two minutes; the frame budget defaults to
`MAPPOSTER_MAX_CLIP_FRAMES=288`, i.e. worst case ~5 minutes). A full async job
queue is a later package, not this one — for now, treat both as **trusted
internal callers only**, and size timeouts accordingly:

- The MCP SDK's default client request timeout is **60s** — well under a
  clip's own runtime — so an MCP caller MUST raise its request timeout before
  calling `render_clip`, or call `/render-clip` over REST instead (no MCP
  transport timeout in the way).
- Two protections keep one slow clip from starving every OTHER request on
  this server (owner decision, 2026-08-04): `pool.acquire()` now fails with a
  clear error after `MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS` (default 10 minutes)
  instead of hanging forever — previously, two concurrent clips could pin
  every page in `MAPPOSTER_POOL` (default 2) for their whole runtime and
  every ordinary `/render` behind them would simply never resolve. And clip
  renders themselves are capped at `MAPPOSTER_CLIP_CONCURRENCY` (default
  **1** — clips are the expensive path; serializing them is the point)
  concurrently in flight, shared by REST `/render-clip` and MCP `render_clip`
  alike so neither surface can independently saturate the pool. Over the
  limit: REST answers **429**, and `render_clip` returns its normal
  `isError:true` result — both carry the same message.

`highlight.color` must be a hex colour (`#e8b04b`) — it is interpolated into the marker SVG's `fill` and reaches `innerHTML` in the render page, so anything else is refused at the boundary.

The render config never travels in the URL. It is parked in-process and the page fetches it by id — a query param would put the whole payload in the request head, which Node caps at 16 KB, and a single city boundary encodes to ~20 KB. The id still changes every render, which is what forces the real document reload the stale-frame guard depends on. Inline `highlight.regions[].geojson` is shape-checked and capped at 2 MiB.

Numeric env vars are validated at startup rather than coerced: `Number('8mb')` is `NaN`, and every `size > NaN` comparison is false — a typo would silently switch the request-body cap off, or make `MAPPOSTER_POOL` produce a pool that never mints a page.

A render that fails discards its browser page rather than returning it to the pool: a crashed page put back in the idle list would poison that slot for the life of the process. If Chromium itself dies, the whole runtime is rebuilt on the next call — and a transient startup failure (a busy port, a flaky launch) is never memoized, so it retries instead of bricking every later render.

`resolved` echoes every choice the server made on your behalf — the camera it framed, the theme it used, and the extent of each region it resolved by name, so a caller can tell *which* "District 1" it got. An unknown `theme` is refused rather than quietly replaced with the default.

Config via env: `MAPPOSTER_DIST` (default `dist`), `MAPPOSTER_APP_PORT`, `MAPPOSTER_APP_HOST` (default `127.0.0.1`), `MAPPOSTER_POOL` (pages, default 2), `MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS` (default 10 minutes — how long `pool.acquire()` queues for a free page before failing loudly instead of hanging), `MAPPOSTER_SINK` (output dir, default `_render-out`), `MAPPOSTER_HTTP_HOST` (default `127.0.0.1` — these tools drive a browser and write files, so hosted deployments must opt in with `0.0.0.0`), `MAPPOSTER_GEO_CACHE_MAX` (LRU entries per geocode cache, default 500), `MAPPOSTER_GEOCODE_LANG` (Nominatim `accept-language`, default `vi,en` — see [Vietnamese addresses](#vietnamese-addresses) for why a single pinned language matters), `MAPPOSTER_FFMPEG` (path to the `ffmpeg` binary clip encoding shells out to, default: `ffmpeg` on `PATH` — the server logs a startup warning, but still serves `render_map`/`/render`, if it can't be resolved). Design: `docs/superpowers/specs/2026-07-09-mcp-map-render-design.md`.

Clip-only env vars (both REST `/render-clip` and the MCP `render_clip` tool):

| Env var | Default | What it guards |
|---|---|---|
| `MAPPOSTER_CLIP_MAX_BYTES` | 12 MiB (`12 * 1024 * 1024`) | Encoded MP4 size cap. A clip over this is refused with **422** — before it is ever base64-encoded — so lower `fps`/`durationSec`/size instead of shipping a multi-ten-megabyte inline blob. |
| `MAPPOSTER_MAX_CLIP_FRAMES` | 288 | The `fps × durationSec` frame budget. A preset or raw script that would render more frames than this is refused at validation, before any browser page is touched. |
| `MAPPOSTER_CLIP_CONCURRENCY` | 1 | Max clip renders in flight at once, shared by REST `/render-clip` and MCP `render_clip`. Over the limit: REST **429**, `render_clip` its normal error result — same message either way. |
| `MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS` | 10 minutes | How long `pool.acquire()` (browser pages, `MAPPOSTER_POOL`) queues for a free slot before failing with a clear error instead of hanging — see the synchronous-endpoint note above. |

### REST endpoints

Alongside the MCP transport, the same HTTP server exposes two plain-REST
endpoints for callers that just want JSON in, image/video out, and don't speak
JSON-RPC — same `Host`/`Origin` guard and optional bearer token
(`MAPPOSTER_TOKEN`) as everything else on this server.

**`POST /render`** — the REST sibling of `render_map`: same input schema, PNG
returned inline as base64.

```jsonc
// POST /render  { "location": "Hoàn Kiếm Lake, Hanoi", "format": "tiktok" }
// → { ok: true, base64, width: 1080, height: 1920, place, resolved }
```

**`POST /render-clip`** — the REST sibling of `render_clip`: same `render_map`
schema plus `motion`, `chrome` forced to `'clean'` (AC-9), same text-free
guarantee.

```jsonc
// POST /render-clip
// { "location": "Hoàn Kiếm Lake, Hanoi", "highlight": { "points": [...] },
//   "format": "tiktok", "motion": { "preset": "pushIn" } }
// → { ok: true,
//     clip: { base64, format: 'mp4', width: 1080, height: 1920, durationSec, fps, bytes },
//     settle: { base64, format: 'png', width, height },
//     motion: { preset: 'pushIn', restAtSec },
//     resolved: {...} }
```

Unlike the MCP tool, REST returns the clip **inline as base64** rather than a
file path — a REST caller has no shared filesystem with the server to read a
path back from, so the whole point of a REST response is that it is
self-contained; the MCP tool writes to `MAPPOSTER_SINK` instead precisely to
avoid bloating the JSON-RPC stdio channel with that same blob. If the encoder
fails after frames were already captured, `/render-clip` degrades the same way
the MCP tool does: `200 { ok: true, settle, motion, resolved, clipError }`,
never discarding a settle still that already rendered successfully.

**HTTP status codes** (owner decision, 2026-08-04). Both endpoints answer with
a real status code now, but the response **body shape is unchanged** —
`{ ok: false, error }` on every failure, exactly as before. This is
deliberately backward compatible: a consumer that does
`if (!res.ok) return null;` before even looking at the body, then
`if (!body.ok) return null;`, gets the identical outcome either way, whether
it reads the status or not.

| Status | Meaning | Cause |
|---|---|---|
| 200 | success (`ok: true`), or the clip encode-failure degrade (`ok: true, settle, clipError` — a settle still genuinely exists) | |
| 400 | caller's fault — invalid or unresolvable input | malformed JSON body, a schema violation, geocoding found nothing, an unknown theme, an invalid colour/GeoJSON, an out-of-range zoom/format |
| 401 | auth | `MAPPOSTER_TOKEN` set and the bearer is missing/wrong |
| 405 | wrong method | anything but `POST` |
| 413 | payload too large | body over `MAPPOSTER_HTTP_MAX_BODY` |
| 422 | well-formed but semantically rejected | a MotionScript invariant violation, an unknown preset, missing `motion`, or the encoded clip over `MAPPOSTER_CLIP_MAX_BYTES` (unchanged from before this decision) |
| 429 | over the shared clip-concurrency limit | `MAPPOSTER_CLIP_CONCURRENCY` (see above) |
| 500 | our fault — infrastructure | a browser-pool failure, a page crash, or any other render/encode error that isn't the encode degrade above |

The practical boundary in the code: failures thrown while **resolving**
params (parsing the body, geocoding, compiling `motion`) are 4xx; failures
thrown while actually **rendering or encoding** are 5xx. Each handler makes
that boundary an explicit two-phase `try`/`catch` rather than inferring it
from an error's message text.

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

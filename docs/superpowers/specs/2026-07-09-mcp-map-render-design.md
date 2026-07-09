# MCP Map-Render Service — Design (Phase 1)

**Slug:** `mcp-map-render` · **Tier:** T3 · **Date:** 2026-07-09 · **Owner:** manh@mstar.vn

## Problem

AI agents in the artifact platform (e.g. the Video Plugin) need on-demand map
illustrations while composing content. When a script mentions a place or address
("chính sách ở TP.HCM", "dự án ở đường Võ Văn Tần"), the agent must fetch a map
image — vertical TikTok format, with a point or region highlighted — without a
human touching MapPoster's UI. Today MapPoster is a client-side app with no
programmatic entry point.

## Approach (decided: Hướng A)

Reuse MapPoster's rendering **in a headless browser**, wrapped by an MCP server.
Chosen over server-side native (Hướng B) for v1 because it reuses ~100% of the
existing renderer (proven: the Playwright E2E already exports a correctly-sized
PNG headlessly) and avoids rebuilding text/marker compositing. A stable internal
primitive `renderFrame(config) → PNG` keeps the door open to swap in native (B)
later without changing the MCP tool contract.

## Architecture

```
agent ──MCP(stdio│HTTP)──▶ mcp-server (Node)
                              │ 1. geocode + boundary lookup (Node, cached, rate-limited)
                              │ 2. build "resolved config" (concrete center/zoom/geojson/markers)
                              │ 3. acquire a page from the Playwright pool
                              ▼
                        headless Chromium ──▶ MapPoster "render mode"
                          (serves built web app)   window.__mapposter.{ready, renderFrame, setCamera}
                              │                     reuses buildMapStyle + exportPoster
                              ▼
                          PNG buffer ──▶ delivery (base64 + file sink) ──▶ agent
```

**Components**

| Component | Responsibility |
|---|---|
| `mcp-server/` (new Node pkg) | MCP tools (stdio + HTTP transports); geocode/boundary in Node with cache; Playwright browser pool; delivery/sink; serves built `web`. |
| `web` render mode (new, small) | Headless entry that reads a **resolved** config (URL/postMessage), skips onboarding/localStorage, exposes `window.__mapposter.{ready, renderFrame(config), setCamera(cam)}`. Reuses `buildMapStyle` + a refactored `exportPoster` (split "compose" from "download"). |
| geocode cache | In-Node cache (place → point/bbox, place → boundary geojson); respects Nominatim ≤1 req/s. |

**Key decisions**
- **Geocode in Node, not in the page** — one central cache, no per-render Nominatim calls (rate-limit safe). The page receives only a fully-resolved config (concrete coords + geojson) and loads *tiles* only.
- **`renderFrame(config)` is the single primitive.** All tools call it. `render_map` = 1 call; `render_variants` = N calls.
- `exportPoster` is refactored so the compose→PNG path is reusable headlessly (currently it triggers a browser download); the interactive app keeps its download wrapper.

## Tool contract (Phase 1)

- `render_map({ location, highlight?, format?, theme?, chrome?, camera?, delivery? })` → `{ image:{ url?, path?, base64?, width, height, format:"png" }, resolved:{ center, zoom, place, highlights } }`
- `render_variants({ base, variants[] })` → array of the above
- `geocode_place({ query })` → candidates
- `list_themes()` / `list_formats()` → discovery

`location` = address/place string (server geocodes) or `{lng,lat,zoom?}`.
`highlight` = `{ regions?: (name|{geojson})[], points?: (name|{lng,lat})[], color?, fill?, dim?, pointIcon? }`.
`format` = `tiktok`(1080×1920) | `story` | `square` | `landscape` | `4k` | `{width,height}`.
`chrome` = `clean` (default — map+highlight, no big title) | `label` | `poster`.
Auto-framing: point → street-level zoom (~14–17); region → fit bbox + padding. `camera` overrides.

## Resolved open questions

- **Delivery default:** still → `both` (base64 preview + file path); sequence/mp4 (future) → `url` only.
- **Output sink:** v1 = configured **shared-volume dir** (return path); pluggable S3/GCS adapter later.
- **Tiles at batch:** cache tiles; self-hosted tiles/geocoder is a scale follow-up, not v1.

## Phasing (this run = Phase 1 only)

- **P1 (this contract):** `renderFrame` primitive + render mode + `render_map` + `render_variants` + `geocode_place` + `list_themes/formats` + both transports + still-image delivery + sink.
- **P2 (future):** `render_sequence` (camera motion frames).
- **P3 (future):** `render_clip` (mp4 via ffmpeg).

## Reuse & tests

Reuses `buildMapStyle`, highlight (multi-region), markers, themes, layouts, geocoding client, `exportPoster`. Existing Vitest (54) + Playwright (7) stay green; new mcp-server integration tests run under `npm test`; render-mode headless test under `npm run test:e2e`.

## Risks (Hướng A)

1. RAM/CPU per browser page → pool + horizontal scale.
2. `exportPoster` refactor must not regress the app's own download/export (covered by existing export E2E).
3. OpenFreeMap tiles at batch → cache; self-host later.
4. `renderFrame` interface must stay engine-agnostic so B swap-in is non-breaking.

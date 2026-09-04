---
schema_version: 1
feature: MCP map-render service (Phase 1 — still images) for AI agents
slug: mcp-map-render
owner: manh@mstar.vn
risk_tier: T3
surfaces: [api, cli]
status: signed-off
approved_by: manh@mstar.vn
approved_at: 2026-07-09T10:39:07Z
time_human_minutes: {gate1: 3, gate2: 5}
---

# Acceptance Contract: mcp-map-render

## Context

AI agents in the artifact platform (e.g. the Video Plugin) need on-demand map
illustrations while composing content — vertical TikTok format, with a point or
region highlighted, resolved from a place name or address — without a human
touching MapPoster's UI. This feature adds an MCP server that drives MapPoster's
renderer in a headless browser (Hướng A) behind a stable `renderFrame(config)`
primitive. Scope of THIS contract is **Phase 1: still images**; camera sequences
and mp4 clips are explicitly deferred.

Source input: prompt (brainstorm in this session, Section 1–2 approved)

## Criteria

- AC-1: Given a place/address string and a `format`, When `render_map` is called, Then it returns a PNG whose pixel dimensions equal the format's target (e.g. `tiktok` → 1080×1920) and whose map is centered on the geocoded location.
- AC-2: Given `highlight.regions=["<place>"]`, When `render_map` runs, Then the resolved config carries that region's boundary GeoJSON and the emitted MapLibre style contains that region's highlight layers — `highlight-fill` and `highlight-soft-edge`, plus `highlight-dim` when the spotlight mask is on. There is deliberately **no** `highlight-outline`: the edge is fully feathered, and `src/lib/mapStyle.test.ts` pins its ABSENCE (`expect(layer(style, 'highlight-outline')).toBeUndefined()`) alongside `line-blur === line-width`. Earlier wordings of this criterion named `highlight-outline`, i.e. named a layer whose non-existence is the invariant.
- AC-3: Given `highlight.points=["<address>"]`, When `render_map` runs, Then a marker is placed at the geocoded point and auto-framing sets a street-level zoom (14 ≤ zoom ≤ 17) unless `camera` overrides it.
- AC-4: Given the same geocode query twice within the cache window, When resolved, Then at most ONE upstream Nominatim request is made; AND given a DIFFERENT query, Then an upstream request IS made (cache does not serve a stale/wrong hit).
- AC-5: Given `render_variants` with N variant configs, When called, Then it returns N PNGs, one per variant.
- AC-6: Given the server started over stdio AND over HTTP, When a client lists tools on each, Then both expose the same tool set including `render_map`, `render_variants`, `geocode_place`, `list_themes`, `list_formats`.
- AC-7: Given default `delivery`, When `render_map` returns a still, Then the result contains BOTH a base64 image and a file `path`, and the PNG file exists at the configured output sink directory.
- AC-8: Given `format` presets, When `list_formats` is called, Then it enumerates presets including `tiktok` (1080×1920); AND a custom `{width,height}` produces a PNG of exactly those dimensions.
- AC-9: Given `chrome:"clean"` (default), When rendered, Then the image has NO large city-title overlay; AND given `chrome:"poster"`, Then the city title overlay IS present.
- AC-10: Given a fully-resolved config delivered to the app's render mode, When the page loads headlessly, Then no onboarding modal appears, `window.__mapposter.ready` resolves, and `renderFrame()` yields a PNG of the exact target dimensions (no dependence on localStorage).
- AC-11: Given an ungeocodable or malformed `location`, When `render_map` is called, Then it returns a structured error result (no thrown crash, no blank/zero-byte PNG).
- AC-12: Given the real example — `location:"Võ Văn Tần, Quận 3, HCMC"`, `format:"tiktok"`, `theme:"midnight-blue"`, point highlight — When rendered, Then the image is usable as video B-roll: the location is correctly centered, the highlight is legible, and tiles/roads render without breakage. (judgment)

## Out of scope

- `render_sequence` (camera-motion frame sequences) — Phase 2.
- `render_clip` (mp4 via ffmpeg) — Phase 3.
- claude.ai connector / OAuth — this is an internal server-to-server service only.
- Self-hosted tiles or self-hosted geocoder — v1 uses OpenFreeMap + Nominatim with caching; self-hosting is a scale follow-up.
- Native (Hướng B) renderer — the `renderFrame` interface is reserved for it, but B is not implemented here.
- Object storage (S3/GCS) sink — v1 writes to a shared-volume directory; the storage adapter is later.
- Per-caller auth, quotas, multi-tenancy.
- **PNG decoding inside this contract's own lanes.** `executors.test.api` runs against a stub renderer whose fixture is a 30-byte buffer carrying only IHDR width/height — nothing here parses a PNG signature, IDAT chunks, or pixels, and E1/E7 no longer claim it. What the unit lanes DO prove: `format` reaches the renderer as `cfg.size`, the reported dimensions are read from the bytes that came back rather than from the request, and the delivered file is byte-identical to the delivered base64. Real pixels are proven twice, elsewhere: E10 (`test:e2e`, real headless Chromium, `renderFrame()` yields exactly 1080×1920) inside this contract, and `renderFrame.test.ts` under `MCP_INTEGRATION=1` (PNG signature `89504e470d0a1a0a` + IHDR 1080×1920) outside it. Wiring a decoder into the unit lane would mean shipping a real PNG fixture and a decoder dependency to re-prove what a real browser already proves — not worth it, but the gap is named rather than left implied.

> Out of scope = scope-truth (Gate 1 duyệt mục này).

## Notes

- Design lane = D0 (functional/headless): the render mode is a headless harness, not a user-facing interactive screen, so no design-of-record sub-track. Visual quality of the rendered map is covered by AC-12 (judgment) + reuse of the existing export/render tests — not by design-loop screen fidelity.
- `src/lib/export.ts` (a `t3_path`) will be refactored to split "compose frame → PNG" from "trigger download"; the app's own export path must stay green (existing export E2E guards this).
- Delivery default: still → `both`; sink = shared-volume dir (v1). Design doc: `docs/superpowers/specs/2026-07-09-mcp-map-render-design.md`.

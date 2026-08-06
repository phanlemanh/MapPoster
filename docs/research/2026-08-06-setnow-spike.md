# Spike: `maplibregl.setNow()` vs the idle/verify apparatus — NO-GO

**Branch of code (throwaway, not merged):** `spike/setnow`
**This report's branch:** `docs/setnow-spike-report`
**Date:** 2026-08-06
**Machine:** Apple M4 Max, macOS 26.3, Node v24.16.0, maplibre-gl 5.24.0

## Question

Can `maplibregl.setNow(ms)` replace some/all of the hand-rolled `idleOnce` /
`waitSourceLoaded` / `verifyAndReapplyGeoAt` / `restBase` apparatus in
`src/render/main.tsx`'s clip frame loop? If so, how much does ms/frame
improve, and does byte-determinism survive?

## Verdict: **NO-GO**

Replacing the per-frame `idleOnce` wait with `setNow()` + `triggerRepaint()` +
one `requestAnimationFrame` produces **byte-identical frames** (determinism
holds) but is **~3.5x slower on average** (1.8–7x depending on cold/warm
cache), not faster. The reason is architectural, not a tuning problem: this
codebase's clip frame loop never uses MapLibre's animated camera API
(`easeTo`/`flyTo`) that `setNow` is designed to frame-step. It computes the
camera position analytically per frame (`cameraAt()` in
`src/render/motionMath.ts`) and calls `map.jumpTo()` — an instant, unanimated
camera set. `setNow` freezes/steps MapLibre's *internal animation clock*;
there is no animation running here for it to freeze. The real per-frame cost
is genuine asynchronous work — GeoJSON source re-tiling on a worker thread
(`waitSourceLoaded`) and base vector-tile fetch/decode over the network
(`idleOnce`) — neither of which `setNow` can accelerate, because both are
driven by real browser I/O and worker round-trips, not by
`performance.now()`. Swapping the efficient, event-driven `idleOnce` (which
resolves the instant the map is actually idle) for a flat "wait one repaint"
does not skip that I/O — it just stops waiting for it *here*, and the cost
resurfaces elsewhere (next frame's `waitSourceLoaded`, browser-internal
backlog), net negative.

Keep the existing sizing (per Step 0.7 instructions): no follow-up to re-size
cluster-motion `L` items to `S`.

## Step 0.1 — API verification

Confirmed against the installed package (`node_modules/maplibre-gl` v5.24.0):

```ts
export declare function now(): number;
export declare function setNow(timestamp: number): void;
export declare function restoreNow(): void;
export declare function isTimeFrozen(): boolean;
```

JSDoc: *"Freezes time at a specific timestamp for deterministic rendering.
Useful for frame-by-frame video capture where each frame needs a consistent
time value."* — this is exactly MapLibre's own intended use case (frame-step
an *animation*), which is the detail that turned out to matter (see verdict).

**Import gotcha, worth recording:** these are exported as *named* exports in
the `.d.ts`, but at runtime they only exist on the package's **default**
export object, not as named ESM exports:

```js
import maplibregl from 'maplibre-gl';
maplibregl.setNow(16.67); // works
```
```js
import { setNow } from 'maplibre-gl'; // setNow is undefined at runtime
```
Verified with a one-off `node -e "import('maplibre-gl').then(...)"` probe.

## Step 0.2 — Current frame loop (`src/render/main.tsx`)

For a non-rest frame, `renderMotionFrame(tSec)` does, in order:
1. `map.jumpTo(cameraAt(motion.camera, tClamped))` — **instant** camera set, computed analytically from `t`. No MapLibre animation is ever started.
2. `applyGeoAt(map, tClamped)` — writes the reveal geometry to the `highlight` GeoJSON source (`setData`) and the fill-opacity paint property, then internally `await waitSourceLoaded(map, 'highlight', ...)` — waits for the **worker thread** to finish re-tiling that source (`sourcedata` + `isSourceLoaded`). Real async work, not clock-driven.
3. `await idleOnce(map)` — waits for MapLibre's `'idle'` event: no pending tile requests (base vector tiles included) and no in-flight paint-property transitions. Real network/worker I/O + real transition duration, not clock-driven, since no `transition: {duration: 0}` is set anywhere in `buildMapStyle()` (checked — style JSON never sets a top-level `transition` key, so MapLibre's implicit default paint-property transition duration is inherited, but jumpTo doesn't animate camera so the only thing idle is really waiting on here is tile load).
4. `verifyAndReapplyGeoAt(map, tClamped, applied)` — reads the source data back by **reference** and re-applies (+ a second `idleOnce`) only if a racing `setStyle({diff:true})` reverted it. In every run of this spike this was a no-op (frames matched baseline exactly), so it never took the reapply branch — meaning it is not the source of the observed slowdown.
5. `snapshotMap(...)` — reads the canvas back to a 2D snapshot for compositing.

For a **rest** frame (`t >= motion.restAtSec` and `restBase` already cached),
none of the above runs — `restBase` is reused and only the (cheap) 2D pulse
overlay is recomposed. This path is untouched by the experiment and already
fast; it needs no `setNow` help.

`mcp-server/src/renderFrame.ts`'s `renderClipFrames` (~lines 98–159) drives
this via one `page.goto` + a loop of `page.evaluate(() => api.renderMotionFrame(t))`
calls, one per frame, plus a best-effort `prefetchMotion()` before the loop.

## Step 0.3–0.4 — Baseline benchmark

Script: `mcp-server/scripts/spike-setnow.ts` (throwaway, on `spike/setnow`
only). Mirrors `tools.ts`'s `render_clip` flow at the primitive level
(`resolveConfig` → `prepareClipRender` → `renderClipFrames`), bypassing
`makeRenderDeps`'s memoization only so the script can `pool.close()` /
`app.close()` itself when done.

Config used (stable tiles, no geocoding network calls — both `location` and
`highlight.points` are plain `{lng,lat}` objects, so `resolveLocation` never
calls Nominatim):

```ts
location: { lng: 105.8524, lat: 21.0285, zoom: 14 }, // Hoan Kiem Lake, Hanoi
highlight: { points: [{ lng: 105.8524, lat: 21.0285 }] },
format: 'tiktok',
motion: { preset: 'pushIn', fps: 12, durationSec: 2 }, // 24 frames/run (FPS_MIN/DURATION_MIN)
```

`restAtSec` for this preset/duration ≈ 1.42s → frames 0–16 (17/24, ~71%) take
the full apply/wait/verify/snapshot path; frames 17–23 reuse `restBase`. Ran
`npx vite build && MAPPOSTER_SINK=<tmp> npx tsx mcp-server/scripts/spike-setnow.ts`
twice (two independent script invocations, each internally running 2
back-to-back clip renders for its own determinism check):

| Run | run-1 (cold, ms/frame) | run-2 (warm, ms/frame) | determinism (run-1 vs run-2) |
|---|---|---|---|
| baseline set 1 | 731.1 | 412.9 | true |
| baseline set 2 | 575.4 | 402.8 | true |

Average baseline: **530.6 ms/frame**. Both sets are in the same ballpark as
the prior session's reference numbers (~1108 cold / ~644 warm at 1080×1920 —
this run's location/frame-count differ, so absolute values aren't expected to
match exactly, only the cold≫warm shape, which they do).

## Step 0.5 — setNow experiment (variant A)

Edited `src/render/main.tsx` (throwaway):

```ts
import maplibregl from 'maplibre-gl';
// ...
function waitOneFrameAtTime(map: MlMap, tSec: number): Promise<void> {
  maplibregl.setNow(tSec * 1000);
  map.triggerRepaint();
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
```

In `renderMotionFrame`'s non-rest branch, replaced:
```ts
const applied = await applyGeoAt(map, tClamped);
await idleOnce(map);
await verifyAndReapplyGeoAt(map, tClamped, applied);
```
with:
```ts
const applied = await applyGeoAt(map, tClamped);
await waitOneFrameAtTime(map, tSec); // setNow + triggerRepaint + 1 rAF
await verifyAndReapplyGeoAt(map, tClamped, applied);
```
`verifyAndReapplyGeoAt` and `applyGeoAt`'s own `waitSourceLoaded` were left
untouched (kept, per the brief's "keep verifyAndReapplyGeoAt on the first
pass"). `npx vite build` after the edit.

Given the measured result (net *slower*, not faster — see below), further
incremental removal (`restBase`, `waitSourceLoaded`) was not pursued: the
core mechanism (freezing the clock) already shows no benefit here, and the
brief's time-box explicitly allows recording a clear negative result instead
of continuing to fight it.

## Step 0.6 — Experiment results vs baseline

| Run | run-1 (cold, ms/frame) | run-2 (warm, ms/frame) | determinism (run-1 vs run-2) |
|---|---|---|---|
| variant A set 1 | 2929.5 | 754.3 | true |
| variant A set 2 | 3002.2 | 757.1 | true |

Average variant A: **1860.8 ms/frame** — **~3.5x slower** than baseline
average (7.0x cold, 1.8x warm).

**Cross-implementation pixel check** (not just each variant's internal
determinism): frames 0, 12, and 23 were dumped to PNG for both baseline and
variant A builds and compared byte-for-byte with `shasum -a 256`:

```
frame0:  baseline=eea6da6c...  variantA=eea6da6c...  match=YES
frame12: baseline=92224004...  variantA=92224004...  match=YES
frame23: baseline=1a9d0bd7...  variantA=1a9d0bd7...  match=YES
```

**Byte-identical.** The `setNow` variant produces the exact same output as
the `idleOnce` apparatus — no white/blank/blurred tiles, no divergence.
(Visual sanity check of `run-1-frame0.png`: fully rendered Hoan Kiem
Lake-area map, all roads/water/labels present, no missing tiles.)

## Which pieces of the apparatus `setNow` can and cannot replace

| Piece | Can `setNow` replace it? | Why |
|---|---|---|
| `idleOnce` (post-`jumpTo` wait) | **No** | Waiting on real tile network fetch/decode, not on MapLibre's animation clock. Camera itself is never animated (`jumpTo`, not `easeTo`/`flyTo`) — nothing for `setNow` to freeze here. |
| `waitSourceLoaded` (`highlight` source re-tile) | **No** | Waits on a Web Worker round-trip after `setData()` — genuine async I/O, unaffected by the clock. |
| `verifyAndReapplyGeoAt` | **No** | Exists to catch a `setStyle({diff:true})` race reverting the reveal state; `setNow` changes nothing about *when* React's effect dispatches that restyle, so the race — and the need for this safety net — is untouched. |
| `restBase` snapshot caching | **N/A / already optimal** | This *is* the codebase's own frame-stepping optimization (skip all of the above once at rest); `setNow` offers nothing beyond what it already does. |
| The manual `cameraAt()` + `jumpTo()` step-through itself | **N/A** | This already **is** deterministic, instant frame-stepping, done by hand via analytic easing math instead of MapLibre's animated camera + clock. `setNow` would only be relevant if this were rewritten to use real `easeTo`/`flyTo` calls — which would be a strict regression from the current zero-wall-clock-cost camera step. |

No piece of today's apparatus is clock-bound; all of it is I/O-bound. That is
why `setNow` — a clock-freezing primitive — has nothing to offer this
specific frame loop.

## Self-review

- Numbers are real, not estimated: every ms/frame figure above came from an
  actual `npx tsx mcp-server/scripts/spike-setnow.ts` run against a real
  `vite build` output, driven through the real `renderClipFrames` /
  `prepareClipRender` / `resolveConfig` pipeline and a real headless
  Chromium page pool (no mocking).
- Determinism was checked two ways: (a) each script invocation's own
  run-1-vs-run-2 SHA-256 comparison (`deterministic: true` in every one of
  the 4 invocations run), and (b) an additional cross-build check — baseline
  build's frames vs variant-A build's frames, byte-for-byte identical. This
  is stronger evidence than the brief's minimum bar.
- The verdict is NO-GO on performance grounds (measured, not assumed) with
  the determinism hard-invariant intact (so this is not the "every variant
  breaks determinism" NO-GO case, but a "works, but does not help" NO-GO).
  The root-cause explanation (no animated camera to frame-step) is grounded
  in reading `cameraAt()` in `src/render/motionMath.ts` and confirming
  `jumpTo` (not `easeTo`/`flyTo`) is what the frame loop calls — not
  speculation.
- Did not exhaustively test every possible variant (e.g., disabling
  `restBase` to force every frame through the full path, or freezing time
  for `waitSourceLoaded` too) — the first, simplest, most-likely-to-win
  variant (freeze clock in place of the idle wait) already showed a clear
  and consistently-reproduced (2 independent runs, both cold and warm)
  slowdown with a solid architectural explanation, so further variants were
  very unlikely to flip the verdict and were skipped per the brief's
  time-boxing guidance.
- One thing NOT fully isolated: the exact mechanism by which the "missing"
  wait time resurfaces in variant A (next frame's `waitSourceLoaded`?
  Playwright IPC backlog? browser-internal tile-load backlog?) — the report
  states the most plausible explanation (deferred I/O) but this was not
  proven with fine-grained instrumentation, since doing so would not have
  changed the GO/NO-GO answer.

## Commands used (reproducibility)

```bash
git checkout main && git checkout -b spike/setnow
grep -n -A 20 "setNow" node_modules/maplibre-gl/dist/maplibre-gl.d.ts | head -40
npx vite build && MAPPOSTER_SINK=<tmp-dir> npx tsx mcp-server/scripts/spike-setnow.ts 2>&1 | tee /tmp/spike-baseline.txt
# edit src/render/main.tsx (variant A)
npx vite build && MAPPOSTER_SINK=<tmp-dir> npx tsx mcp-server/scripts/spike-setnow.ts 2>&1 | tee /tmp/spike-setnow.txt
SPIKE_DUMP_DIR=<tmp-dir> MAPPOSTER_SINK=<tmp-dir> npx tsx mcp-server/scripts/spike-setnow.ts  # frame PNG dump for quality/hash check
```

## Files touched

- `mcp-server/scripts/spike-setnow.ts` — new, throwaway, `spike/setnow` only.
- `src/render/main.tsx` — modified, throwaway, `spike/setnow` only (variant A: `setNow`+rAF replacing one `idleOnce` call).
- `docs/research/2026-08-06-setnow-spike.md` — this file, the only artifact merged to `main`.

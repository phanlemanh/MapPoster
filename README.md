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

**The MCP protocol lane** (`mcp-server/src/mcpProtocol.test.ts`, inside
`test:mcp`) spawns a **real** stdio MCP server and drives it over `tools/list`
and `tools/call`. It exists because every other test calls `makeTools()`
directly and therefore bypasses tool *registration* — and three real bugs walked
through that gap in a single session, the worst of which left `render_recipe`
completely unusable over MCP while 567 tests stayed green. The lane renders
nothing and touches no network (its deepest case reaches `resolveConfig` via an
unknown theme, which is rejected before the first geocode), so it adds real
protocol coverage for about a second.

`npm run build` runs the fast Vitest suite as a gate before bundling. The Playwright suite is kept separate (it starts a browser) — run it via `npm run test:e2e` or in CI. First-time E2E needs the browser: `npx playwright install chromium`.

## MCP map-render server

`mcp-server/` exposes MapPoster's renderer to AI agents via MCP, so an agent (e.g. a video pipeline) can fetch a still map illustration on demand — geocoded, point/region-highlighted, in TikTok/other formats. It drives the app's **headless render mode** (`render.html`) in a Playwright page pool behind a stable `renderFrame(config) → PNG` primitive; geocoding + boundary lookup run in Node with caching.

```bash
npm run mcp:stdio      # run over stdio (local) — builds dist/ on first run if missing
npm run mcp:http       # run over Streamable HTTP (hosted, port 4181)
npm run test:mcp       # gated integration: builds app, renders a real PNG, and drives a real MCP server over the protocol
```

The server serves the built app from `dist/` to its headless browser and rebuilds
it automatically if it is missing. If you **edit app source** (`src/`) and want the
server to pick it up, rebuild explicitly — a stale `dist/` is served silently:

```bash
npx vite build
```

Tools: `render_map`, `render_variants`, `render_animation`, `render_clip`, `render_recipe`, `compile_motion`, `geocode_place`, `list_themes`, `list_formats`, `list_fonts`, `list_recipes`. Example call:

```jsonc
render_map({
  "location": "Võ Văn Tần, Quận 3, HCMC",
  "highlight": { "points": [{ "query": "Võ Văn Tần, HCMC", "icon": "star", "color": "#e8b04b" }] },
  "format": "tiktok",        // 1080×1920
  "theme": "midnight-blue",
  "chrome": "clean",
  "layers": { "rail": false, "aeroway": false },
  "detail": 0.4,
  "font": "Oswald"
})
// → { image: { path, base64, width: 1080, height: 1920 },
//     resolved: { center, zoom, place, theme, highlights: { regions:[{bbox,center}], points:[{lng,lat}] } } }
```

`layers` toggles `{landcover, buildings, water, parks, roads, rail, aeroway, roadLabels}`
independently (all on by default except `roadLabels`, which defaults off —
poster first — any subset may be passed); `labels` is a
shorthand for `layers.roadLabels` and the two are mutually exclusive — passing
both is refused, since they set the same switch. `detail` is `0..1` and scales
road width (0.6×–1.5×); minor roads only appear strictly above `0.12`. `font`
is one of the six typefaces the **Style** panel offers (see [Features](#features)
below): `Space Grotesk`, `Montserrat`, `Playfair Display`, `Oswald`, `Bebas Neue`,
`Merriweather`.

`routes` draws polylines over the map. Each entry carries **exactly one** of
`coords` (an array of `[lng, lat]`, at least two — the form a model emits
naturally) or `geojson` (a FeatureCollection of `LineString`/`MultiLineString`,
for forwarding a router or GPX result without unpacking it), plus optional
`color` (hex) and `width` (`1..16`). Omitted style falls back to the theme's
`accent` and width `4` — note the accent sits close to the road ramp in most
themes, so pass an explicit `color` when the route must read as distinct from
the streets underneath. When a call has routes but no highlight region or
point, auto-framing follows the routes' extent.

`routes[].route` asks a router for the **actual road-following path** — the one
thing a language model cannot invent. `{ from, to, via?, mode? }` where `from` /
`to` / `via[]` each take `[lng, lat]` **or** a place name (names resolve through
the same country anchor highlights use, so "Bến Thành" cannot silently become a
same-named place abroad). `mode` is `car` | `moto` | `walk`.

```jsonc
"routes": [{ "route": { "from": "Bến Thành", "to": "Tân Sơn Nhất", "mode": "car" } }]
// → resolved.routes[0] = { bbox, lengthKm, pointCount,
//                          distanceKm: 12.4, durationMin: 28, provider: "osrm/driving" }
```

`distanceKm` / `durationMin` / `provider` appear **only** for a routed line —
they are facts the router reported, not something derivable from a polyline the
caller drew by hand, so a hand-drawn route omits them rather than reporting `0`.
Note `distanceKm` (router) and `lengthKm` (our own sum over the returned
polyline) are two different measurements and both are kept.

| `mode` | OSRM profile |
|---|---|
| `car` | `driving` |
| `moto` | `driving` — the public OSRM has no motorcycle profile; the mapping is reported in `provider` rather than pretended away |
| `walk` | `foot` |

**Operational note.** The default router is `https://routing.openstreetmap.de/routed-car`,
a public community instance with **no SLA and a fair-use policy** — fine for
trying this out, not for production. Point `MAPPOSTER_OSRM_URL` at an OSRM you
host. The host is read from the environment and can never be set by a caller:
this is the server's first outbound call whose content a caller influences, so a
caller-supplied host would be an SSRF into the process holding the browser pool.

Every routing request carries a hard timeout (`MAPPOSTER_ROUTE_TIMEOUT_MS`,
default 8000). That matters because config resolution runs *inside* the clip
concurrency slot — without it, one hung router would hold the global slot until
the pool deadline. Geometry longer than 700 points is decimated (endpoints
kept), so payload size does not scale with trip length. Routes are LRU-cached
(`MAPPOSTER_ROUTE_CACHE_MAX`) and requests are serialised
(`MAPPOSTER_ROUTE_MIN_SPACING_MS`), same shape as the geocoder.

`measure` answers geometry questions from the already-resolved config, with no
extra network call. `measure.pairs` takes index pairs into `highlight.points`
(e.g. `[[0, 1]]`); an index with no matching point is refused rather than
silently dropped. Results arrive under `resolved`:

```jsonc
"routes":   [{ "bbox": [w,s,e,n], "lengthKm": 6.79, "pointCount": 3 }],
"measures": {
  "pairs":   [{ "from": 0, "to": 1, "straightLineKm": 4.77, "bearingDeg": 311.6 }],
  "routes":  [{ "index": 0, "lengthKm": 6.79 }],
  "regions": [{ "index": 0, "areaKm2": 96.9, "spanKm": { "ew": 10.4, "ns": 11.1 }, "centroid": [lng, lat] }]
}
```

Both keys are omitted entirely when the call uses neither. **The field names
state which measurement they are, deliberately**: `straightLineKm` is the
great-circle distance between two points — *not* travel distance along a road —
while `lengthKm` sums a polyline's own segments. A bare `km` would be read
downstream as "the distance" and printed onto a video, which is how a correct
number becomes a false claim. Region area subtracts interior holes.

`highlight.regions[]` and `highlight.points[]` each accept either a bare
string (geocoded/queried with the defaults) or an object that pins a specific
colour/icon/size alongside the name — mixing plain strings and objects in the
same array is fine. A region is `string | {name, color?} | {geojson, color?}`;
a point is `string | {lng, lat, icon?, color?, size?} | {query, icon?, color?,
size?}`. Per-point `size` is bounded `18..140` (`drawMarker` does no clamping
of its own — 5000 would paint over the canvas, 0 would be invisible); an
unknown `icon` is refused rather than silently falling back to `pin`, same as
an unknown `theme` refuses rather than falling back to the default.

Each array is capped at **32 entries** (`MAX_HIGHLIGHTS`). This is not a
deployment knob, deliberately: every *named* entry costs one Nominatim lookup,
and those are serialised behind the ≥1 req/s limiter the geocoder holds to stay
inside Nominatim's usage policy — so the cost of a long array is not our CPU,
it is sustained traffic at a shared public service under someone else's name,
which no deployment gets to opt into by raising an env var. The refusal lands
**before the first lookup**, not partway through the loop. Likewise
`render_variants` caps `variants` at **24** (`MAX_VARIANTS`, comfortably clear
of a one-variant-per-theme sweep — there are 13 themes): the fan-out is serial
and each entry is a full headless render holding a page from `MAPPOSTER_POOL`,
so an unbounded array is a way to occupy the shared pool indefinitely from a
request body well under the 8 MiB cap.

`camera.pitch` is bounded `0..60` (MapLibre's default `maxPitch` — passing 85
used to be accepted and then silently clamped by the engine, which is
accept-then-discard). `camera.bearing` is **normalized, not bounded**: any
finite angle is wrapped into `[0,360)`, so `-45` renders as `315` rather than
being refused. Bounding it would have removed a capability MapLibre already
supports; only a non-finite value is rejected.

`resolved.highlights.regions[i]` echoes which named entity the server actually
matched: `{bbox, center, osmType, osmId, displayName, placeRank}` for a
region resolved by name (inline-geojson regions carry no such identity, so
these fields are omitted). `placeRank` is Nominatim's own granularity number
(city ≈ 16, road ≈ 26, POI ≈ 30) — the design note for this field originally
called it `adminLevel`, but Nominatim's *search* endpoint (used here) does not
return `admin_level`; `placeRank` is what the API actually gives back, and is
the useful equivalent for telling "which District 1 did I get."

`camera.focus` frames one specific object instead of the default union
auto-frame: `{ kind: 'point' | 'region' | 'route', index, paddingPct? }`, where
`index` points into `highlight.points`, `highlight.regions` or `routes`.
`paddingPct` (0–200, default 12) widens the framed span before the zoom is
derived, so a larger value zooms further out. It is **mutually exclusive** with
`camera.center` / `camera.zoom` — passing both is refused rather than silently
picking a winner, and an index with nothing at it is refused too.

`output.quality` (`draft` | `standard` | `high` → crf 28 / 20 / 16) trades file
size against visible quality **without** touching fps, size or duration — the
knobs that would change what the clip actually shows. It exists so an oversize
rejection is something a caller can retry against rather than a dead end.
`standard` is the crf this encoder always used, so omitting it changes nothing.
**MP4 only**: the GIF branch is palette-based and ignores crf entirely.

Every clip response carries `cost: { frames, renderMs, encodeMs, bytes }` —
including the encode-failure degrade path, where the frames were rendered and
paid for even though no file came out. The names carry their units on purpose;
a bare `time` or `size` is a number a consumer guesses the unit of.

### Recipes — one call, one finished scene

`render_recipe` renders a ready-made scene from business-level parameters, so an
agent director does not have to know which preset, which highlight flags and
which camera framing add up to the scene it wants. `list_recipes` is the
self-describing catalog: every entry carries its parameters, default duration,
and **a working example call** — a test compiles each advertised example, so an
example that stopped working fails the build rather than misleading a caller.

```jsonc
render_recipe({ "recipe": "region-spotlight", "region": "Hoàn Kiếm, Hà Nội",
                "theme": "midnight-blue", "format": "tiktok" })
// → { recipe: 'region-spotlight',
//     clip: { path, bytes, durationSec, fps, width: 1080, height: 1920 },
//     settle: {...}, motion: { preset: 'approach', restAtSec, script: {...} },
//     resolved: { ..., anchors } }
```

| Recipe | Scene it builds | Key parameters |
|---|---|---|
| `region-spotlight` | Flies into an administrative area, draws its boundary in, **dims** everything outside it, settles | `region` |
| `property-intro` | Flies into a project's boundary, draws it in, drops a pin on the project — surroundings stay **lit**, because they are what is being sold. Boundary takes an OSM name *or* inline GeoJSON, the only route for a plot that isn't in OSM | `location`, `boundary` |
| `amenities` | Pushes into the project and pulses around it, with nearby amenities pinned in the same frame; returns straight-line distance from the project to each one | `location`, `pois[]` |
| `compare-locations` | Frames several projects together with one reference point, drifts around them, and returns straight-line distance from the reference to each project | `subjects[]`, `reference` |
| `route-journey` | Draws a road-following route from A to B while the camera tracks the drawing head, settling once the route completes; returns the router's own distance and duration | `from`, `to`, `mode` |
| `location-tour` | Visits each stop in turn — flies in, holds, pulls back, moves on. Dwell is split evenly across stops, not set per stop | `stops[]` |
| `connectivity` | Opens on every connecting route then draws in on the project; each route reports the router's own km and minutes | `location`, `from[]` |
| `area-overview` | Zones each in their own colour with everything outside them dimmed, drifting slowly. Defaults to the satellite basemap | `location`, `zones[]` |

**Two limits of the recipe layer, stated rather than hidden.** `compile()` is
synchronous and runs *before* geocoding, so it never knows real coordinates —
which means a recipe cannot author absolute camera keyframes. Anything needing
them (a multi-stop tour that pauses at each stop, "zoom back to the project at
the end") is out of reach *at the recipe layer* — every recipe above therefore
uses a **preset** and lets `resolveConfig` auto-frame the union of its
highlights. When absolute keyframes are genuinely needed, the way through is to
push the authoring down into the **preset** compiler, which runs *after*
resolution and so does have real geometry: `route-journey` needs the camera to
track the drawing head, so it calls the `follow` preset, and that preset samples
the route and emits the keyframes itself. Second, `motionScript.ts` forbids more than one one-shot track of the
same kind per script, so **staggered beats are impossible** — amenity pins and
compared projects appear *together*, not in sequence. The catalog descriptions
say what the recipe does, not what the spec wished for.

A recipe is a **parameterised formula, not a new engine concept**: `compile`
returns exactly the parameter set `render_clip` already accepts, and
`render_recipe` then delegates to it. That is why every `render_clip` guarantee
— AC-9's forced `chrome: 'clean'`, the `MAPPOSTER_MAX_CLIP_FRAMES` budget, the
`MAPPOSTER_CLIP_CONCURRENCY` slot, the encode-failure degrade, the size cap,
`resolved.anchors` — is *inherited* rather than re-derived. A recipe that called
the renderer itself would silently drift out of all of them.

Two boundaries worth knowing. Each recipe's parameter schema is **strict**: a
mistyped key is refused rather than ignored, because the caller is an agent that
cannot see the image, so a silently-dropped parameter returns a "successful"
clip with the wrong content and nothing downstream can catch it.

**Over MCP that guard only covers half the cases, and the gap is not ours to
close.** The SDK builds `z.object(inputSchema)` from the tool's *declared*
shape and Zod strips anything outside it **before** the handler runs. So a
mistyped key that happens to be another recipe's parameter (`pois` sent to
`region-spotlight`) does reach the handler and *is* refused — while a key
matching no recipe at all (`them`, `foo`) is swallowed by the SDK and the call
succeeds. Measured directly against a freshly started MCP server. We cannot
refuse what we never receive; this paragraph is the only honest mitigation, so
treat `list_recipes` as the source of truth for parameter names rather than
relying on a typo being caught. And
`region-spotlight` does **not** expose `dim` as a parameter — switching the dim
off leaves the plain `approach` preset, which a caller can reach through
`render_clip` directly; a recipe that can turn off its own defining trait has no
boundary. Unknown recipe names are refused with the list of known ones, the same
policy `theme`/`icon`/`format` already follow.

`compile_motion` takes the same inputs as `render_clip` and returns the
MotionScript that call *would* use — `{ preset?, script, fps, durationSec,
restAtSec, frames, resolved }` — **without rendering a single frame or taking a
clip-concurrency slot**. Use it to inspect and tweak motion before paying for a
clip; a full clip costs minutes, this costs milliseconds. It forces
`chrome: 'clean'` exactly as the clip path does, so the preview cannot disagree
with what you get.

`list_fonts` returns `{ fonts: [{key, stack, titleWeight, titleTracking,
uppercaseTitle}] }` — every name is one `render_map`'s `font` accepts.

`list_themes` returns `{ themes: [{id, name, dark, colors}] }` — `colors` is
the theme's full 15-key palette (`background, water, waterway, green, landuse,
park, building, roadHighway, roadMajor, roadMinor, rail, aeroway, boundary,
text, accent`), so an agent compositing a DOM overlay on top of the rendered
map can colour-match it exactly rather than guessing. `list_formats` returns
`{ formats: [{name, width, height, aspect, category, print?}] }` — `aspect` is
the reduced ratio (e.g. `9:16`), `category` is one of `Video | Print | Social |
Wallpaper | Web`, and `print` (mm/in physical page size) is present only for
print layouts. A name that exists in both the built-in video presets and the
poster layouts (`4k`) is listed once.

`render_animation` renders the same place/highlight contract as `render_map`,
plus an `animation` param, as a looping radar-pulse GIF and/or MP4 around
`highlight.points` (it requires at least one point — there is nothing to
animate otherwise): `{ frames?, fps?, format?: 'gif'|'mp4'|'both', gifWidth?,
rings?, radiusScale?, color? }`. It returns `{ image, animation: { outputs:
[{format, path, bytes}], frames, fps, width, height, loop: true }, resolved
}`; `image` is the middle frame as a preview still, and — like every other
still on this server — honours the `delivery` param (`both`/`url`/`inline`). Each
encoded output is checked against `MAPPOSTER_CLIP_MAX_BYTES`; going over it
deletes every output already written for that call (not just the offending
one) and returns an error rather than leaving partial files in `MAPPOSTER_SINK`
— this is the same cap `render_clip` enforces, on the one output path that
previously had none.

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
//     motion: { preset: 'pushIn', restAtSec, script: { /* the fully-compiled MotionScript */ } },
//     resolved: { center, zoom, place, theme, highlights: {...},
//                 // EITHER these two, when anchors could be measured:
//                 camera:  { center, zoom, bearing, pitch },      // the REST-state camera
//                 anchors: { points:  [{ index, lng, lat, xPct, yPct, onScreen }],
//                            regions: [{ index, bboxCenterPct, bboxPct }] },
//                 // OR this one, when they could not — never both, never neither:
//                 anchorsUnavailable: "camera.pitch is 30 — anchors require pitch 0. …" } }
```

Every clip response carries **exactly one of** `camera` + `anchors`, or
`anchorsUnavailable` saying why they are missing. Never both, never neither: a
field that is simply absent is indistinguishable, to an agent that cannot see
the image, from "there were no points".

`anchors` says where each highlight point and region sits **on the frame**, at
the rest state (`motion.restAtSec`) — the frame a DOM layer draws its labels
over. Measured once, right after the settle still is captured; there is
deliberately no way to ask for anchors at an arbitrary `t` (that would have to
move the camera, and the tail frames reuse a snapshot taken at `restAtSec`).

**`resolved.camera` is not `resolved.center`/`resolved.zoom`.** The top-level
`center` and `zoom` echo what you *asked for*; `resolved.camera` is what the
camera *measured* at `restAtSec`, and on a clip these are routinely different —
they are the two ends of a motion. `pushIn` starts off-centre by 15% of the
viewport's longitude span and wide of your zoom; `drift` rests at
`zoom + zoomDelta`, so your requested `zoom` matches *neither* end. Position
anything you overlay from `resolved.camera` and `anchors`, which are measured
together in one read of the same frame. Reading `resolved.zoom` to reason about
scale, or `resolved.center` to place a label, puts your text on the wrong frame
— and since the pixels are text-free by design, nothing downstream will catch
it for you.

Positions are **percentages of the frame, not pixels**, for three reasons and
the third is the real one: a DOM layer positions with CSS `%` anyway; the same
anchors work for a 1080 and a 4k render; and the poster frame's two axes are
rounded independently, so `cssW/cssH ≠ width/height` and **no single scale
factor exists** — a percentage with its own denominator per axis is exact,
where a pixel coordinate scaled by one ratio is not. `onScreen: false` marks a
point outside the frame; its `xPct`/`yPct` are still returned (possibly
negative or >100) so the caller can draw a direction arrow or skip it.
A **tilted camera still renders a clip** — `camera.pitch` is applied at page
load and the per-frame `jumpTo` never resets it, so pitched clips work exactly
as before. What a tilt costs you is the anchors, not the clip: a tilted
projection turns a region into a trapezoid, so `bboxPct` would be a
plausible-looking lie that an agent, which never sees the image, cannot catch.
Such a clip comes back complete, with `anchorsUnavailable` naming pitch as the
cause; `camera.pitch` in `resolved.camera` is therefore always `0`, because
that block only exists when anchors were measurable.

Every clip response — MCP `render_clip`, REST `POST /render-clip`, and the
async `/jobs` clip path alike — echoes `motion.script`: the fully-compiled,
validated MotionScript the preset (or raw script input) actually resolved to,
not just the `preset` name and `restAtSec`. That closes the loop an agent
needs to inspect what a preset compiled into and hand back a tweaked
`{script}` next call. `camera.bearing` is honoured on clips (it used to be
silently dropped by the preset compiler — a bug, not a design choice).

Unlike every other tool here, the clip itself is **written to a file** under
`MAPPOSTER_SINK` and returned as `clip.path` rather than inlined as base64 —
a multi-megabyte MP4 would bloat the JSON-RPC stdio channel MCP runs over.
`delivery` (`both`/`url`/`inline`) still applies to the `settle` still, same as the
other image tools. If the MP4 encoder fails (missing ffmpeg, a corrupt frame),
the tool never throws the whole call away: the frames were already captured,
so it degrades to `{ settle, motion, resolved, clipError }` — the settle still
always exists.

**`render_clip` / `POST /render-clip` are synchronous and can take minutes at
production sizes** (measured: ~1.1s/frame cold at 1080×1920 — spec §3 — so a
6s/18fps clip is roughly two minutes; the frame budget defaults to
`MAPPOSTER_MAX_CLIP_FRAMES=288`, i.e. worst case ~5 minutes). Callers that
don't want to hold a connection open that long should submit the work to
[`POST /jobs`](#rest-endpoints) instead and poll for it. The two synchronous
endpoints are unchanged and remain **trusted internal callers only**, so size
timeouts accordingly:

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

Async job-queue env vars (`POST /jobs`, `POST /jobs/status` — these do **not**
affect the synchronous endpoints):

| Env var | Default | What it guards |
|---|---|---|
| `MAPPOSTER_JOB_WORKERS` | `MAPPOSTER_POOL` (browser-pool size, itself default 2) | How many jobs the runner pulls off the queue at once. Defaulting to the pool size is deliberate: more workers than pages just means the extra workers race each other into `MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS`. |
| `MAPPOSTER_MAX_QUEUED_JOBS` | 50 | Queue depth cap. Over it, `POST /jobs` is refused with **429** and no record is created — an unbounded queue is a scheduled OOM, because every waiting job holds its caller's `params` (which may carry inline GeoJSON). |
| `MAPPOSTER_JOB_TTL_MS` | 30 minutes | How long a **finished** job is retained. Past it, the sweep drops the record (later polls get **404**) and deletes the files that record listed — records are cheap, `MAPPOSTER_SINK` files are not. |
| `MAPPOSTER_JOB_SLOT_WAIT_MS` | 10 minutes | How long a worker waits for a free clip slot (`MAPPOSTER_CLIP_CONCURRENCY`) before failing that job as a **server**-side error. Matches `MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS`: an unbounded wait isn't patience, it's a permanent hang wearing a `queued` badge. |

These four are read through the same `envNumber` validator as every other knob,
so a garbage value refuses startup and names the variable rather than silently
falling back to the default. The numbers are **defaults that run**, not
measured optima — there is no production load to tune against yet. Design:
`docs/superpowers/specs/2026-08-05-async-job-queue-design.md`.

### REST endpoints

Alongside the MCP transport, the same HTTP server exposes four plain-REST
endpoints for callers that just want JSON in, image/video out, and don't speak
JSON-RPC — same `Host`/`Origin` guard and same bearer token
(`MAPPOSTER_TOKEN`) as every other route, **including the `/mcp` transport
itself**. That was not always true: the bearer check was copied into each REST
route while the MCP fall-through — the branch that catches everything else —
had none, so this sentence described a guard the code did not apply. There is
now one shared check, so a new route cannot be added without one.

`MAPPOSTER_TOKEN` stays optional for loopback use, but the server **refuses to
start** when `MAPPOSTER_HTTP_HOST` binds outside loopback and no token is set.
These tools drive a headless browser and write files; a deployment that forgot
the token should fail loudly at boot rather than serve unauthenticated. Two are synchronous
(`/render`, `/render-clip`); two submit and poll a job (`/jobs`,
`/jobs/status`). All four are `POST` — the server answers **405** to every
other method, and `render.yaml` deliberately declares no health-check path, so
neither of those decisions had to be reopened to add the job endpoints.

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
//     motion: { preset: 'pushIn', restAtSec, script: { /* the fully-compiled MotionScript */ } },
//     resolved: {...} }
```

`resolved` carries `camera` + `anchors` (or `anchorsUnavailable`) here too — all
three clip surfaces (MCP `render_clip`, this endpoint, and the async `/jobs`
clip path) go through one shared builder whose argument is a discriminated
union, so none of them can quietly drift into omitting them, emitting both, or
emitting neither.

Unlike the MCP tool, REST returns the clip **inline as base64** rather than a
file path — a REST caller has no shared filesystem with the server to read a
path back from, so the whole point of a REST response is that it is
self-contained; the MCP tool writes to `MAPPOSTER_SINK` instead precisely to
avoid bloating the JSON-RPC stdio channel with that same blob. If the encoder
fails after frames were already captured, `/render-clip` degrades the same way
the MCP tool does: `200 { ok: true, settle, motion, resolved, clipError }`,
never discarding a settle still that already rendered successfully.

**`POST /jobs`** — submit a render or clip job and get an id back immediately,
instead of holding a connection open for the minutes a clip takes. `params` is
the same `render_map` schema `/render` takes; `motion` is required when
`kind` is `"clip"` and is the same shape `/render-clip` takes.

```jsonc
// POST /jobs
// { "kind": "clip",
//   "params": { "location": "Hoàn Kiếm Lake, Hanoi", "format": "tiktok" },
//   "motion": { "preset": "pushIn" } }
// → 202 { ok: true, id: "…", kind: 'clip', status: 'queued' }
```

Only the **shape** is checked before the 202 — a bad `kind`, a missing
`location`, an out-of-range `zoom` are all refused with **400**, and no record
is created. Geocoding is not, because it is a network call: validating it up
front would rebuild the very stall this endpoint exists to remove. An
unresolvable place therefore fails *the job*, not the submission, and surfaces
on the next poll as `errorKind: 'input'`.

**`POST /jobs/status`** — poll one job by id. The id is usable the instant
`/jobs` returns it; there is no window where a just-accepted job reads as
unknown.

```jsonc
// POST /jobs/status  { "id": "…" }
// → 200 { ok: true, id, kind, status: 'queued' | 'running' | 'done' | 'failed',
//         // when done, the artifacts, read off disk and inlined as base64:
//         image?:  { base64, format: 'png', width, height, bytes },
//         settle?: { base64, format: 'png', width, height, bytes },
//         clip?:   { base64, format: 'mp4', width, height, bytes, durationSec, fps },
//         motion?, resolved?,          // same shapes /render and /render-clip return
//         // when failed:
//         error?, errorKind?: 'input' | 'server',
//         // clip encode failed or exceeded MAPPOSTER_CLIP_MAX_BYTES, settle survives:
//         clipError? }
```

A job that ran and failed still answers **200** — the *question* succeeded, and
the body carries the failure. `errorKind` says whose fault it was: `'input'` is
the caller's to fix (the 400-shaped failures the sync path would have thrown),
`'server'` is ours (a dead browser, a clip gate that stayed saturated past
`MAPPOSTER_JOB_SLOT_WAIT_MS`). Only an id the book has never heard of — or has
already swept — is **404**. The clip degrade contract carries over unchanged
from `/render-clip`: if the encode fails or the MP4 is over
`MAPPOSTER_CLIP_MAX_BYTES`, the settle still that already rendered is still in
the response, with `clipError` explaining the rest.

**The job book is in memory, and that is the whole durability story.** A
restart — a deploy, a crash, an OOM — empties it: every id issued before the
restart becomes unknown, and every poll for one answers **404**, including for
jobs that had already finished successfully. Any files those jobs wrote are
orphaned in `MAPPOSTER_SINK` rather than swept, because the records naming them
are gone. So a caller must be able to resubmit on a `404` and must never treat
an id as a durable receipt. Durability is a deliberately separate future
package: it forces an infrastructure choice (Render's persistent disk pins the
service to a single instance; Redis or Postgres costs money) that this package
declined to make on the side. See `Out of scope` in
`_acceptance/async-job-queue/contract.md`.

**HTTP status codes** (owner decision, 2026-08-04; the job endpoints follow the
same rules and add 202/404). Both synchronous endpoints answer with
a real status code now, but the response **body shape is unchanged** —
`{ ok: false, error }` on every failure, exactly as before. This is
deliberately backward compatible: a consumer that does
`if (!res.ok) return null;` before even looking at the body, then
`if (!body.ok) return null;`, gets the identical outcome either way, whether
it reads the status or not.

| Status | Meaning | Cause |
|---|---|---|
| 200 | success (`ok: true`), or the clip encode-failure degrade (`ok: true, settle, clipError` — a settle still genuinely exists) | on `/jobs/status`, also every answered poll — including one reporting a *failed* job, because the question itself succeeded |
| 202 | job accepted, not yet done | `/jobs` only — the record exists and the id is immediately pollable |
| 400 | caller's fault — invalid or unresolvable input | malformed JSON body, a schema violation, geocoding found nothing, an unknown theme, an invalid colour/GeoJSON, an out-of-range zoom/format. On `/jobs`, the shape violations only — geocoding is deferred to the worker and fails the job instead |
| 401 | auth | `MAPPOSTER_TOKEN` set and the bearer is missing/wrong |
| 404 | no such job | `/jobs/status` only — an id that was never issued, or whose record has been swept (`MAPPOSTER_JOB_TTL_MS`, or a restart). The one place the status code describes the question rather than the work |
| 405 | wrong method | anything but `POST` |
| 413 | payload too large | body over `MAPPOSTER_HTTP_MAX_BODY` |
| 422 | well-formed but semantically rejected | a MotionScript invariant violation, an unknown preset, missing `motion`, or the encoded clip over `MAPPOSTER_CLIP_MAX_BYTES` (unchanged from before this decision) |
| 429 | over a capacity limit | synchronously, the shared `MAPPOSTER_CLIP_CONCURRENCY` gate (see above); on `/jobs`, a queue already at `MAPPOSTER_MAX_QUEUED_JOBS`. Jobs *inside* the queue never see 429 — they wait for a clip slot, which is the point of submitting them |
| 500 | our fault — infrastructure | a browser-pool failure, a page crash, or any other render/encode error that isn't the encode degrade above |

The practical boundary in the code: failures thrown while **resolving**
params (parsing the body, geocoding, compiling `motion`) are 4xx; failures
thrown while actually **rendering or encoding** are 5xx. Each handler makes
that boundary an explicit two-phase `try`/`catch` rather than inferring it
from an error's message text. On the job path the same boundary survives, one
layer down: the work no longer has a status code of its own, so 4xx-vs-5xx
becomes `errorKind: 'input' | 'server'` in the polled body.

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

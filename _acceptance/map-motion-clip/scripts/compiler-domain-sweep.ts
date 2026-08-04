/**
 * AC-4 evidence — exhaustive sweep of the compiler over its whole legal domain.
 *
 * Unit tests pin named cases; this proves the PROPERTY across every zoom the
 * schema permits, for all three presets. Two things must hold for each combo:
 *
 *   1. compileMotion either returns a script its OWN validator accepts, or
 *      throws a material error with a readable message — never a script that
 *      validateMotionScript would reject (that is the task's charter, AC-4).
 *   2. No accepted script may have identical first/last camera keyframes — a
 *      "fly-in" that never moves is a motionless clip, and no invariant catches
 *      it because none of R/O/L/B/I care about zoom direction.
 *
 * Exits 0 only when both hold for every combination; prints a run_id line the
 * acceptance verifier reuses.
 */
import { compileMotion, motionContextOf, type MotionPreset } from '../../../mcp-server/src/motionCompiler';
import { validateMotionScript } from '../../../src/render/motionScript';
import type { RenderConfig } from '../../../src/render/renderConfig';

const SQUARE = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]],
      },
    },
  ],
};

function cfgAt(zoom: number, lng: number): RenderConfig {
  return {
    camera: { center: [lng, 10.78], zoom },
    size: { width: 1080, height: 1920 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'sweep', country: 'Việt Nam', lat: 10.78, lng },
    highlight: { regions: [{ geojson: SQUARE, color: null }], color: null, fill: true, dim: false },
    markers: [{ lng, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 42 }],
  } as RenderConfig;
}

const PRESETS: MotionPreset[] = ['approach', 'pushIn', 'drift'];
/** Includes both antimeridian edges — the wrap guard's reason for existing. */
const LNGS = [106.7, -179.5, 179.5, 0];

let accepted = 0;
let materialErrors = 0;
const failures: string[] = [];

for (const preset of PRESETS) {
  for (const lng of LNGS) {
    for (let z = 0; z <= 22.0001; z += 0.1) {
      const zoom = Math.round(z * 10) / 10;
      const cfg = cfgAt(zoom, lng);
      let script;
      try {
        script = compileMotion(preset, cfg);
      } catch (e) {
        const msg = (e as Error).message ?? '';
        // A material error is fine — but it must be OUR readable message, not a
        // raw schema rejection leaking out of the compiler.
        if (/^[ROLBI]:/.test(msg) || msg.includes('too_small') || msg.includes('invalid_type')) {
          failures.push(`${preset} zoom=${zoom} lng=${lng}: compiler leaked a schema rejection: ${msg}`);
        } else {
          materialErrors++;
        }
        continue;
      }

      // Property 1: the compiler's own validator must accept what it produced.
      try {
        validateMotionScript(script, motionContextOf(cfg));
      } catch (e) {
        failures.push(`${preset} zoom=${zoom} lng=${lng}: own validator rejected it: ${(e as Error).message}`);
        continue;
      }

      // Property 2: an accepted script must actually move.
      const first = script.camera[0];
      const last = script.camera[script.camera.length - 1];
      if (first.zoom === last.zoom && first.center[0] === last.center[0] && first.center[1] === last.center[1]) {
        failures.push(`${preset} zoom=${zoom} lng=${lng}: degenerate — first and last keyframe identical`);
        continue;
      }
      accepted++;
    }
  }
}

const total = accepted + materialErrors + failures.length;
const runId = `map-motion-clip-sweep-${process.env.SWEEP_STAMP ?? 'local'}`;
console.log(`run_id: ${runId}`);
console.log(`combinations: ${total} (presets=${PRESETS.length} × lngs=${LNGS.length} × zoom 0→22 step 0.1)`);
console.log(`accepted: ${accepted}`);
console.log(`material errors (clear message, expected): ${materialErrors}`);
console.log(`violations: ${failures.length}`);
for (const f of failures.slice(0, 10)) console.log(`  VIOLATION ${f}`);

if (failures.length > 0) process.exit(1);
console.log('OK — no combination produced a self-rejected script or a motionless clip');

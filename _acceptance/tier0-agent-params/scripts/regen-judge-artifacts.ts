/**
 * Regenerate the judgment-eval artifacts from the CURRENT working tree.
 *
 * Why a script and not the running MCP server: `.mcp.json` starts
 * `tsx mcp-server/src/stdio.ts` once and that process keeps the TypeScript it
 * loaded at startup in memory. A long-lived session's server therefore renders
 * with PRE-BRANCH code — silently, since the output looks perfectly valid. This
 * script runs in a fresh node process, so it loads the source as it is now.
 *
 * Writes:
 *   _acceptance/mcp-map-render/evidence/E12-example.png   (AC-12 judge)
 *   _acceptance/map-motion-clip/evidence/E16-clip.mp4     (AC-13 judge)
 *   _acceptance/map-motion-clip/evidence/E16-step{1,2,3}.png
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { makeRenderDeps } from '../../../mcp-server/src/deps';
import { resolveConfig } from '../../../mcp-server/src/resolveConfig';
import { prepareClipRender } from '../../../mcp-server/src/motionCompiler';

const root = process.cwd();
const out = (slug: string, file: string) => path.join(root, '_acceptance', slug, 'evidence', file);

async function main(): Promise<void> {
  const deps = makeRenderDeps();

  // --- E12: still poster, the exact params the judge question names ---------
  const stillCfg = await resolveConfig({
    location: 'Võ Văn Tần, Quận 3, HCMC',
    highlight: { points: ['Võ Văn Tần, HCMC'] },
    format: 'tiktok',
    theme: 'midnight-blue',
  });
  const png = await deps.render(stillCfg);
  await fs.writeFile(out('mcp-map-render', 'E12-example.png'), png);
  console.log(`E12-example.png  ${png.length} bytes  center=${stillCfg.camera.center} zoom=${stillCfg.camera.zoom}`);

  // --- E16: approach clip over a Vietnamese district ------------------------
  const prep = await prepareClipRender(
    {
      location: 'Quận 3, Hồ Chí Minh',
      highlight: { regions: ['Quận 3, Hồ Chí Minh'] },
      format: 'tiktok',
      theme: 'midnight-blue',
    },
    { preset: 'approach' },
  );
  try {
    if (!deps.renderClip || !deps.encodeAnimation) throw new Error('clip deps not wired');
    const { frames, settle } = await deps.renderClip(prep.cfg);
    const mp4 = out('map-motion-clip', 'E16-clip.mp4');
    await deps.encodeAnimation(frames, { fps: prep.motion.fps, format: 'mp4', outPath: mp4 });

    // Three beats the judge is asked to read: wide opening, mid-reveal, settled tail.
    const mid = Math.floor(frames.length / 2);
    await fs.writeFile(out('map-motion-clip', 'E16-step1.png'), frames[0]);
    await fs.writeFile(out('map-motion-clip', 'E16-step2.png'), frames[mid]);
    await fs.writeFile(out('map-motion-clip', 'E16-step3.png'), settle);

    const { size } = await fs.stat(mp4);
    console.log(
      `E16-clip.mp4     ${size} bytes  ${frames.length} frames @${prep.motion.fps}fps  restAtSec=${prep.motion.restAtSec}`,
    );
    console.log(`E16-step1/2/3.png written (frame 0, frame ${mid}, settle)`);
  } finally {
    prep.releaseClipSlot();
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);

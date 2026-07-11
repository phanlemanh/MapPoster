import type { Map as MlMap } from 'maplibre-gl';
import { jsPDF } from 'jspdf';
import type { LayoutPreset, MarkerItem, Theme } from '../types';
import type { FontDef } from '../data/fonts';
import { getMarkerIcon } from '../data/markers';
import { drawPosterText, type PosterTextConfig } from './posterText';
import { slugify } from './format';

export interface ExportOptions {
  map: MlMap;
  layout: LayoutPreset;
  theme: Theme;
  markers: MarkerItem[];
  text: {
    city: string;
    country: string;
    coords: string;
    show: boolean;
    showCity: boolean;
    showCountry: boolean;
    showCoords: boolean;
    font: FontDef;
    color: string;
  };
  format: 'png' | 'pdf';
  onProgress?: (msg: string) => void;
}

/** Resolve once the map is idle, or after a safety timeout. */
function waitForIdle(map: MlMap, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      map.off('idle', finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    map.once('idle', finish);
  });
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: MarkerItem,
  cssX: number,
  cssY: number,
  ratio: number,
) {
  const def = getMarkerIcon(marker.icon);
  const sizeDev = marker.size * ratio; // device px width of the 24x24 icon box
  const scale = sizeDev / 24;
  ctx.save();
  // position so the icon's anchor sits on the projected coordinate
  ctx.translate(cssX * ratio - def.anchor.x * scale, cssY * ratio - def.anchor.y * scale);
  ctx.scale(scale, scale);
  const path = new Path2D(def.path);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1.5;
  if (def.outline) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'white';
    ctx.stroke(path);
  }
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = marker.color;
  ctx.fill(path);
  ctx.restore();
}

export interface PulseOpts {
  /** animation phase, 0..1 — frame i of N is t = i/N; the effect loops at t=1 */
  t: number;
  /** ripple color; defaults to each marker's own color */
  color?: string;
  /** number of concurrent ripples */
  rings?: number;
  /** max ripple radius as a multiple of the marker size (css px) */
  radiusScale?: number;
}

export interface ComposeOpts {
  /** target export pixel dimensions */
  width: number;
  height: number;
  markers: MarkerItem[];
  text: ExportOptions['text'];
  /** radar-pulse ripples drawn under the markers (animation frames) */
  pulse?: PulseOpts;
  onProgress?: (msg: string) => void;
}

/** Expanding radar rings around a marker: radius grows with an ease-out, the
 * ring fades as it travels. Phases are offset per ring so t is periodic — a
 * frame sequence over t ∈ [0,1) loops seamlessly. */
function drawPulse(ctx: CanvasRenderingContext2D, marker: MarkerItem, cssX: number, cssY: number, ratio: number, pulse: PulseOpts) {
  const rings = Math.max(1, pulse.rings ?? 3);
  const maxR = marker.size * (pulse.radiusScale ?? 2.2) * ratio;
  const color = pulse.color ?? marker.color;
  const cx = cssX * ratio;
  const cy = cssY * ratio;
  ctx.save();
  for (let k = 0; k < rings; k++) {
    const phase = (((pulse.t + k / rings) % 1) + 1) % 1;
    const eased = phase * (2 - phase); // ease-out: fast launch, gentle landing
    const r = Math.max(1, maxR * eased);
    const fade = 1 - phase;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.globalAlpha = fade * 0.12;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = fade * 0.65;
    ctx.lineWidth = Math.max(1, 3 * fade) * ratio;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Render the poster at full resolution and composite the map, markers, text and
 * attribution onto a single canvas — WITHOUT any download side-effect. Reused by
 * both `exportPoster` (interactive download) and the headless render mode.
 *
 * Strategy: the map already frames the poster exactly. We temporarily raise its
 * `pixelRatio` so its WebGL backing store becomes the target pixel size
 * (identical camera framing, more pixels), snapshot it, composite overlays, then
 * restore the original ratio.
 */
export async function composePoster(map: MlMap, opts: ComposeOpts): Promise<HTMLCanvasElement> {
  const base = await snapshotMap(map, opts.width, opts.height, opts.onProgress);
  return composeOverlays(map, base, opts);
}

/**
 * Snapshot ONLY the map at full resolution (the expensive step: raise the
 * pixelRatio, wait for a re-render, copy the WebGL canvas, restore). Animation
 * takes this once and stamps N cheap overlay frames on top of it.
 */
export async function snapshotMap(map: MlMap, width: number, height: number, onProgress?: (msg: string) => void): Promise<HTMLCanvasElement> {
  const canvasEl = map.getCanvas();
  const cssW = canvasEl.clientWidth || canvasEl.width;

  // device px per css px needed so the backing store width == target width
  const ratio = width / cssW;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyMap = map as any;
  const originalRatio: number =
    typeof anyMap.getPixelRatio === 'function' ? anyMap.getPixelRatio() : window.devicePixelRatio || 1;

  onProgress?.('Rendering at full resolution…');
  if (typeof anyMap.setPixelRatio === 'function') {
    anyMap.setPixelRatio(ratio);
    map.triggerRepaint();
    await waitForIdle(map);
  }

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  try {
    if (!ctx) throw new Error('Could not create export canvas');
    // scale backing store to exact target dims, guards rounding
    ctx.drawImage(canvasEl, 0, 0, out.width, out.height);
  } finally {
    // restore the map regardless of outcome
    if (typeof anyMap.setPixelRatio === 'function') {
      anyMap.setPixelRatio(originalRatio);
      map.triggerRepaint();
    }
  }
  return out;
}

/** Stamp pulse + markers + text + attribution over a map snapshot. Pure 2D
 * canvas work — cheap enough to run once per animation frame. */
export async function composeOverlays(map: MlMap, base: HTMLCanvasElement, opts: ComposeOpts): Promise<HTMLCanvasElement> {
  const canvasEl = map.getCanvas();
  const cssW = canvasEl.clientWidth || canvasEl.width;
  const ratio = opts.width / cssW;

  const out = document.createElement('canvas');
  out.width = opts.width;
  out.height = opts.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Could not create export canvas');

  opts.onProgress?.('Compositing overlays…');
  // 1) the map snapshot
  ctx.drawImage(base, 0, 0, out.width, out.height);

  // 2) radar ripples sit under their markers
  if (opts.pulse) {
    for (const m of opts.markers) {
      const p = map.project([m.lng, m.lat]);
      drawPulse(ctx, m, p.x, p.y, ratio, opts.pulse);
    }
  }

  // 3) markers (DOM overlays are not on the WebGL canvas — draw them here)
  for (const m of opts.markers) {
    const p = map.project([m.lng, m.lat]);
    drawMarker(ctx, m, p.x, p.y, ratio);
  }

  // 4) poster text overlay
  if (opts.text.show) {
    const cfg: PosterTextConfig = {
      city: opts.text.city,
      country: opts.text.country,
      coords: opts.text.coords,
      showCity: opts.text.showCity,
      showCountry: opts.text.showCountry,
      showCoords: opts.text.showCoords,
      font: opts.text.font,
      color: opts.text.color,
    };
    await drawPosterText(ctx, out.width, out.height, cfg);
  }

  // 5) license attribution baked into the image
  drawAttribution(ctx, out.width, out.height, opts.text.color);

  return out;
}

/** Compose the poster and download it as PNG or PDF (interactive app path). */
export async function exportPoster(opts: ExportOptions): Promise<void> {
  const { map, layout, format, onProgress } = opts;
  const out = await composePoster(map, {
    width: layout.width,
    height: layout.height,
    markers: opts.markers,
    text: opts.text,
    onProgress,
  });

  const baseName = `mapposter-${slugify(opts.text.city || 'poster')}-${layout.id}`;
  if (format === 'png') {
    onProgress?.('Encoding PNG…');
    await downloadPng(out, `${baseName}.png`);
  } else {
    onProgress?.('Building PDF…');
    downloadPdf(out, layout, `${baseName}.pdf`);
  }
}

function drawAttribution(ctx: CanvasRenderingContext2D, W: number, H: number, color: string) {
  const size = Math.max(9, Math.min(W, H) * 0.011);
  ctx.save();
  ctx.font = `500 ${size}px 'Inter', sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = size * 0.4;
  ctx.fillText('© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre', W - size * 1.2, H - size * 1.2);
  ctx.restore();
}

function downloadPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG encoding failed'));
        return;
      }
      const url = URL.createObjectURL(blob);
      triggerDownload(url, filename);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve();
    }, 'image/png');
  });
}

function downloadPdf(canvas: HTMLCanvasElement, layout: LayoutPreset, filename: string) {
  const imgData = canvas.toDataURL('image/png');
  const orientation = layout.width >= layout.height ? 'landscape' : 'portrait';

  let pdf: jsPDF;
  let pw: number;
  let ph: number;
  if (layout.print) {
    const unit = layout.print.unit; // 'mm' | 'in'
    pw = orientation === 'landscape' ? Math.max(layout.print.w, layout.print.h) : Math.min(layout.print.w, layout.print.h);
    ph = orientation === 'landscape' ? Math.min(layout.print.w, layout.print.h) : Math.max(layout.print.w, layout.print.h);
    pdf = new jsPDF({ orientation, unit, format: [pw, ph] });
  } else {
    pw = layout.width;
    ph = layout.height;
    pdf = new jsPDF({ orientation, unit: 'px', format: [pw, ph] });
  }
  pdf.addImage(imgData, 'PNG', 0, 0, pw, ph, undefined, 'FAST');
  pdf.save(filename);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

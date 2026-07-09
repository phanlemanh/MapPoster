import type { FontDef } from '../data/fonts';

// Fractions used for the poster text overlay. City / sub sizes are fractions of
// the poster's SHORTER edge (so they read consistently across aspect ratios);
// vertical anchor and rule width are fractions of height / width respectively.
// The DOM preview overlay uses the exact same fractions against its rendered
// size, so preview and export stay visually identical (WYSIWYG).
export const TEXT_FRAC = {
  city: 0.060,
  sub: 0.019,
  cityBaselineFromBottom: 0.19, // fraction of poster height
  ruleWidth: 0.14, // fraction of poster width
};

export interface PosterTextConfig {
  city: string;
  country: string;
  coords: string;
  showCity: boolean;
  showCountry: boolean;
  showCoords: boolean;
  font: FontDef;
  color: string;
}

async function ensureFontLoaded(family: string) {
  if (!('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`700 64px '${family}'`),
      document.fonts.load(`400 32px '${family}'`),
    ]);
    await document.fonts.ready;
  } catch {
    /* non-fatal */
  }
}

/**
 * Draw the poster text overlay (city / country / coordinates) onto a 2D canvas
 * context sized W x H device pixels.
 */
export async function drawPosterText(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cfg: PosterTextConfig,
) {
  const { font } = cfg;
  await ensureFontLoaded(font.key);

  const min = Math.min(W, H);
  const cityPx = min * TEXT_FRAC.city;
  const subPx = min * TEXT_FRAC.sub;
  const cx = W / 2;
  const family = `'${font.key}'`;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = cfg.color;
  // slight shadow for legibility over busy maps
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = min * 0.01;

  let y = H - H * TEXT_FRAC.cityBaselineFromBottom;

  const cityText = cfg.showCity && cfg.city ? (font.uppercaseTitle ? cfg.city.toUpperCase() : cfg.city) : '';
  const showSub = (cfg.showCountry && cfg.country) || cfg.showCoords;

  if (cityText) {
    setLetterSpacing(ctx, cityPx * font.titleTracking);
    ctx.font = `${font.titleWeight} ${cityPx}px ${family}`;
    ctx.fillText(cityText, cx, y);
    y += cityPx * 0.34 + min * 0.02;
  }

  if (cityText && showSub) {
    // divider rule
    ctx.shadowBlur = 0;
    const rw = W * TEXT_FRAC.ruleWidth;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = Math.max(1, min * 0.0016);
    ctx.beginPath();
    ctx.moveTo(cx - rw / 2, y);
    ctx.lineTo(cx + rw / 2, y);
    ctx.stroke();
    ctx.restore();
    y += min * 0.028 + subPx;
    ctx.shadowBlur = min * 0.008;
  }

  if (cfg.showCountry && cfg.country) {
    setLetterSpacing(ctx, subPx * 0.22);
    ctx.font = `600 ${subPx}px ${family}`;
    ctx.fillText(cfg.country.toUpperCase(), cx, y);
    y += subPx * 1.75;
  }

  if (cfg.showCoords && cfg.coords) {
    setLetterSpacing(ctx, subPx * 0.12);
    ctx.font = `400 ${subPx * 0.92}px ${family}`;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillText(cfg.coords, cx, y);
    ctx.restore();
  }

  ctx.restore();
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing is supported in modern Chromium/Safari/Firefox; ignore if not.
  try {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
  } catch {
    /* noop */
  }
}

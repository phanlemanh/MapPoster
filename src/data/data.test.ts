import { describe, it, expect } from 'vitest';
import { THEMES, getTheme, DEFAULT_THEME_ID } from './themes';
import { LAYOUTS, getLayout, DEFAULT_LAYOUT_ID, LAYOUT_CATEGORIES } from './layouts';
import { FONTS, getFont, DEFAULT_FONT } from './fonts';
import { MARKER_ICONS, markerSvg } from './markers';

const HEX = /^#[0-9a-fA-F]{6}$/;

describe('themes', () => {
  it('provides the 12 documented presets with unique ids', () => {
    expect(THEMES).toHaveLength(12);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(12);
    expect(THEMES.map((t) => t.id)).toContain(DEFAULT_THEME_ID);
  });

  it('every theme color is a valid 6-digit hex', () => {
    for (const t of THEMES) {
      for (const [key, value] of Object.entries(t.colors)) {
        expect(value, `${t.id}.${key}`).toMatch(HEX);
      }
    }
  });

  it('getTheme falls back to the first theme for unknown ids', () => {
    expect(getTheme('does-not-exist')).toBe(THEMES[0]);
  });
});

describe('layouts', () => {
  it('has 16 presets across the 4 categories with unique ids', () => {
    expect(LAYOUTS).toHaveLength(16);
    expect(new Set(LAYOUTS.map((l) => l.id)).size).toBe(16);
    for (const cat of LAYOUT_CATEGORIES) {
      expect(LAYOUTS.some((l) => l.category === cat)).toBe(true);
    }
    expect(LAYOUTS.map((l) => l.id)).toContain(DEFAULT_LAYOUT_ID);
  });

  it('keeps every export dimension within the 4096px WebGL canvas budget', () => {
    for (const l of LAYOUTS) {
      expect(l.width, l.id).toBeLessThanOrEqual(4096);
      expect(l.height, l.id).toBeLessThanOrEqual(4096);
      expect(l.width).toBeGreaterThan(0);
      expect(l.height).toBeGreaterThan(0);
    }
  });

  it('print layouts carry a physical page size', () => {
    for (const l of LAYOUTS.filter((x) => x.category === 'Print')) {
      expect(l.print, l.id).toBeTruthy();
      expect(['mm', 'in']).toContain(l.print!.unit);
    }
  });

  it('getLayout falls back for unknown ids', () => {
    expect(getLayout('nope')).toBe(LAYOUTS[0]);
  });
});

describe('fonts', () => {
  it('exposes the 6 typefaces including the default', () => {
    expect(FONTS).toHaveLength(6);
    expect(FONTS.map((f) => f.key)).toContain(DEFAULT_FONT);
    expect(getFont(DEFAULT_FONT).key).toBe(DEFAULT_FONT);
  });
});

describe('markers', () => {
  it('has 6 icons and renders self-contained SVG', () => {
    expect(MARKER_ICONS).toHaveLength(6);
    const svg = markerSvg('pin', '#ff0000', 40);
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="40"');
    expect(svg).toContain('#ff0000');
  });
});

import type { LayoutPreset } from '../types';

// Export pixel dimensions kept <= 4096 on any edge so the WebGL canvas stays
// within the default MapLibre maxCanvasSize on most GPUs. Print sizes carry a
// physical `print` field used to size the PDF page.
export const LAYOUTS: LayoutPreset[] = [
  // --- Print (portrait) ---
  { id: 'a3', name: 'A3 Portrait', category: 'Print', width: 1748, height: 2480, print: { w: 297, h: 420, unit: 'mm' } },
  { id: 'a4', name: 'A4 Portrait', category: 'Print', width: 1240, height: 1754, print: { w: 210, h: 297, unit: 'mm' } },
  { id: 'a5', name: 'A5 Portrait', category: 'Print', width: 874, height: 1240, print: { w: 148, h: 210, unit: 'mm' } },
  { id: 'letter', name: 'US Letter', category: 'Print', width: 1275, height: 1650, print: { w: 8.5, h: 11, unit: 'in' } },

  // --- Social ---
  { id: 'ig-square', name: 'Instagram Square', category: 'Social', width: 1080, height: 1080 },
  { id: 'ig-story', name: 'Instagram Story', category: 'Social', width: 1080, height: 1920 },
  { id: 'linkedin', name: 'LinkedIn Post', category: 'Social', width: 1200, height: 1500 },
  { id: 'pinterest', name: 'Pinterest Pin', category: 'Social', width: 1000, height: 1500 },

  // --- Wallpaper ---
  { id: 'fhd', name: 'Desktop FHD', category: 'Wallpaper', width: 1920, height: 1080 },
  { id: '4k', name: 'Desktop 4K', category: 'Wallpaper', width: 3840, height: 2160 },
  { id: 'ultrawide', name: 'Ultrawide', category: 'Wallpaper', width: 3440, height: 1440 },
  { id: 'iphone', name: 'iPhone', category: 'Wallpaper', width: 1179, height: 2556 },
  { id: 'ipad', name: 'iPad', category: 'Wallpaper', width: 1668, height: 2388 },

  // --- Web ---
  { id: 'web-wide', name: 'Web Landscape', category: 'Web', width: 1600, height: 900 },
  { id: 'web-banner', name: 'Web Banner / OG', category: 'Web', width: 1200, height: 630 },
  { id: 'web-portrait', name: 'Web Portrait', category: 'Web', width: 1080, height: 1350 },
];

export const DEFAULT_LAYOUT_ID = 'ig-square';

export function getLayout(id: string): LayoutPreset {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export const LAYOUT_CATEGORIES: LayoutPreset['category'][] = ['Print', 'Social', 'Wallpaper', 'Web'];

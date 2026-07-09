import type { FontKey } from '../types';

export interface FontDef {
  key: FontKey;
  /** CSS font-family stack */
  stack: string;
  /** weight to use for the large city title */
  titleWeight: number;
  /** letter-spacing tweak for the title (em) */
  titleTracking: number;
  uppercaseTitle: boolean;
}

export const FONTS: FontDef[] = [
  { key: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", titleWeight: 600, titleTracking: 0, uppercaseTitle: false },
  { key: 'Montserrat', stack: "'Montserrat', sans-serif", titleWeight: 700, titleTracking: 0.04, uppercaseTitle: true },
  { key: 'Playfair Display', stack: "'Playfair Display', serif", titleWeight: 700, titleTracking: 0, uppercaseTitle: false },
  { key: 'Oswald', stack: "'Oswald', sans-serif", titleWeight: 600, titleTracking: 0.05, uppercaseTitle: true },
  { key: 'Bebas Neue', stack: "'Bebas Neue', sans-serif", titleWeight: 400, titleTracking: 0.06, uppercaseTitle: true },
  { key: 'Merriweather', stack: "'Merriweather', serif", titleWeight: 700, titleTracking: 0, uppercaseTitle: false },
];

export const DEFAULT_FONT: FontKey = 'Space Grotesk';

export function getFont(key: FontKey): FontDef {
  return FONTS.find((f) => f.key === key) ?? FONTS[0];
}

import { describe, it, expect } from 'vitest';
import { formatCoords, slugify } from './format';

describe('formatCoords', () => {
  it('formats N/E for positive coordinates', () => {
    expect(formatCoords(48.8566, 2.3522)).toBe('48.8566° N   ·   2.3522° E');
  });

  it('formats S/W for negative coordinates', () => {
    expect(formatCoords(-33.8688, -70.1234)).toBe('33.8688° S   ·   70.1234° W');
  });

  it('respects the decimals argument', () => {
    expect(formatCoords(10.7737, 106.7166, 2)).toBe('10.77° N   ·   106.72° E');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Ho Chi Minh City')).toBe('ho-chi-minh-city');
  });

  it('strips common Vietnamese diacritics', () => {
    expect(slugify('Hà Nội')).toBe('ha-noi');
  });

  it('always produces a filesystem-safe slug', () => {
    for (const name of ['Thủ Đức', 'Đà Nẵng', 'Ho Chi Minh City', 'München']) {
      const slug = slugify(name);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toMatch(/^-|-$/);
    }
  });

  it('trims leading/trailing separators', () => {
    expect(slugify('  --Paris!!  ')).toBe('paris');
  });

  it('falls back to "poster" for empty input', () => {
    expect(slugify('!!!')).toBe('poster');
    expect(slugify('')).toBe('poster');
  });
});

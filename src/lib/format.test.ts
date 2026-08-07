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

  // Đ/đ là chữ CÓ GẠCH NGANG dựng sẵn, không phải chữ + dấu rời: NFKD không tách
  // nó ra, \p{Diacritic} không khớp nó, nên bước lọc [^a-zA-Z0-9] ĂN MẤT cả chữ.
  // Mọi địa danh Việt bắt đầu bằng Đ đều rụng chữ đầu — tên tệp sai và dễ đụng nhau.
  it('transliterates Đ/đ to d instead of dropping it', () => {
    expect(slugify('Đà Nẵng')).toBe('da-nang');
    expect(slugify('Đắk Lắk')).toBe('dak-lak');
    expect(slugify('Thủ Đức')).toBe('thu-duc');
    expect(slugify('đồng nai')).toBe('dong-nai');
  });

  // Ð/ð (U+00D0/U+00F0, eth) trông y hệt Đ khi gõ nhầm bảng mã và cũng bị rụng.
  it('transliterates the look-alike Ð/ð (U+00D0/U+00F0) to d', () => {
    expect(slugify('Ðà Lạt')).toBe('da-lat');
    expect(slugify('ða')).toBe('da');
  });

  it('keeps Đ-names distinct from names that only differ by the Đ', () => {
    expect(slugify('Đà Nẵng')).not.toBe(slugify('A Nang'));
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

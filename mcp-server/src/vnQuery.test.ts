import { describe, it, expect } from 'vitest';
import { normalizeVnQuery, stripHouseNumber, dropDistrictAndWard, queryCandidates, relaxedCandidates, requiredCity } from './vnQuery';

describe('normalizeVnQuery', () => {
  it('canonicalises the city however it is abbreviated', () => {
    for (const q of ['TP.HCM', 'TPHCM', 'TP. Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'Sài Gòn', 'Ho Chi Minh City']) {
      expect(normalizeVnQuery(q)).toBe('Ho Chi Minh City');
    }
    expect(normalizeVnQuery('TP. Hà Nội')).toBe('Hanoi');
    expect(normalizeVnQuery('Hà Nội')).toBe('Hanoi');
    expect(normalizeVnQuery('Thành phố Đà Nẵng')).toBe('Da Nang');
  });

  it('does not double-suffix an already-canonical city', () => {
    expect(normalizeVnQuery('Ho Chi Minh City')).not.toMatch(/City City/);
  });

  it('canonicalises districts, wards and drops the street prefix', () => {
    expect(normalizeVnQuery('Quận 3')).toBe('District 3');
    expect(normalizeVnQuery('Q.7')).toBe('District 7');
    expect(normalizeVnQuery('Phường 5')).toBe('Ward 5');
    expect(normalizeVnQuery('Đường Lê Lợi')).toBe('Lê Lợi');
  });

  it('matches names starting with a non-ASCII letter (ASCII \\b would not)', () => {
    expect(normalizeVnQuery('Đà Nẵng')).toBe('Da Nang');
  });

  it('keeps street-name diacritics intact', () => {
    expect(normalizeVnQuery('Võ Văn Tần, Quận 3, TP.HCM')).toBe('Võ Văn Tần, District 3, Ho Chi Minh City');
  });
});

describe('stripHouseNumber / dropDistrictAndWard', () => {
  it('strips a leading house number', () => {
    expect(stripHouseNumber('123 Nguyễn Huệ, District 1')).toBe('Nguyễn Huệ, District 1');
    expect(stripHouseNumber('12A/3 Lê Lợi')).toBe('3 Lê Lợi'); // only the leading token
    expect(stripHouseNumber('Nguyễn Huệ')).toBe('Nguyễn Huệ');
  });

  it('drops District/Ward segments', () => {
    expect(dropDistrictAndWard('Nguyễn Huệ, District 1, Ho Chi Minh City')).toBe('Nguyễn Huệ, Ho Chi Minh City');
    expect(dropDistrictAndWard('Bến Nghé, Ward 5, District 1, Hanoi')).toBe('Bến Nghé, Hanoi');
  });
});

describe('queryCandidates', () => {
  it('stops at stripping the house number — it never drops the district', () => {
    // measured live: forms 1-2 return 0 hits, form 3 returns the correct boulevard.
    // Dropping "District 1" would match a same-named street 60km away in Cần Giờ.
    expect(queryCandidates('123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh')).toEqual([
      '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      '123 Nguyễn Huệ, District 1, Ho Chi Minh City',
      'Nguyễn Huệ, District 1, Ho Chi Minh City',
    ]);
    expect(queryCandidates('x, Quận 1, TP.HCM')).not.toContain('x, Ho Chi Minh City');
  });

  it('relaxedCandidates (explicit disambiguation) may drop the district', () => {
    expect(relaxedCandidates('123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh')).toContain('Nguyễn Huệ, Ho Chi Minh City');
  });

  it('de-duplicates when the query is already canonical', () => {
    expect(queryCandidates('Hanoi')).toEqual(['Hanoi']);
  });
});

describe('requiredCity', () => {
  it('detects the pinned city through any abbreviation', () => {
    expect(requiredCity('Võ Văn Tần, Quận 3, TP.HCM')).toBe('Ho Chi Minh City');
    expect(requiredCity('Hồ Hoàn Kiếm, Hà Nội')).toBe('Hanoi');
    expect(requiredCity('Thành phố Đà Nẵng')).toBe('Da Nang');
    expect(requiredCity('Nguyễn Huệ')).toBeNull();
  });

  it("normalising a hit's display_name lets an untranslated 'Hà Nội' match 'Hanoi'", () => {
    // accept-language=en does NOT translate Hà Nội / Đà Nẵng in display_name
    expect(normalizeVnQuery('Hoàn Kiếm Lake, Hoan Kiem Ward, Hà Nội, 11024, Vietnam')).toContain('Hanoi');
    expect(normalizeVnQuery('Đà Nẵng, Vietnam')).toContain('Da Nang');
  });
});

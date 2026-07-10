/**
 * Nominatim's free-form parser does not understand how Vietnamese addresses are
 * actually written. Measured against the live API:
 *
 *   "Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"  → 0 hits
 *   "Nguyễn Huệ, Quận 1, TP.HCM"           → 0 hits
 *   "Nguyễn Huệ, Ho Chi Minh City"         → 2 hits ✓
 *
 * So we canonicalise the administrative tokens and, if the full query misses,
 * relax it step by step (drop the house number, then the district/ward).
 */

// `\b` is ASCII-only, so it never fires before `Đ`/`ư`. Use Unicode-aware
// boundaries instead, or "Đường" and a bare "Đà Nẵng" silently never match.
const B = '(?<![\\p{L}\\p{N}])';
const E = '(?![\\p{L}\\p{N}])';
const TP = '(?:tp\\.?\\s*|th[àa]nh\\s*ph[ốo]\\s*)?';

// `hcmc` must precede `hcm`: alternation is ordered, so `hcm` matches the first
// three letters of "HCMC" and then fails the end-boundary against the trailing C.
const HCMC = new RegExp(`${B}${TP}(?:h[ồo]\\s*ch[íi]\\s*minh(?:\\s*city)?|hcmc|hcm|s[àa]i\\s*g[òo]n)${E}`, 'giu');
const HANOI = new RegExp(`${B}${TP}h[àa]\\s*n[ộo]i${E}`, 'giu');
const DANANG = new RegExp(`${B}${TP}[đd][àa]\\s*n[ẵaă]ng${E}`, 'giu');

const DISTRICT = new RegExp(`${B}(?:qu[ậa]n|q)\\.?\\s*(\\d+)${E}`, 'giu');
const WARD = new RegExp(`${B}(?:ph[ưu][ờo]ng|p)\\.?\\s*(\\d+)${E}`, 'giu');
const STREET_PREFIX = new RegExp(`${B}[đd][ưu][ờo]ng\\s+`, 'giu');

const HOUSE_NUMBER = /^\s*\d+[a-zA-Z]?[\s,/-]+/;
const DISTRICT_OR_WARD_SEGMENT = /,\s*(?:District|Ward)\s*\d+\s*(?=,|$)/gi;

/** Canonicalise VN administrative abbreviations into names Nominatim indexes. */
export function normalizeVnQuery(input: string): string {
  return input
    .replace(HCMC, 'Ho Chi Minh City')
    .replace(HANOI, 'Hanoi')
    .replace(DANANG, 'Da Nang')
    .replace(DISTRICT, 'District $1')
    .replace(WARD, 'Ward $1')
    .replace(STREET_PREFIX, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

export function stripHouseNumber(q: string): string {
  return q.replace(HOUSE_NUMBER, '').trim();
}

export function dropDistrictAndWard(q: string): string {
  return q.replace(DISTRICT_OR_WARD_SEGMENT, '').replace(/\s*,\s*/g, ', ').trim();
}

const CANONICAL_CITIES = ['Ho Chi Minh City', 'Hanoi', 'Da Nang'];

/**
 * The city the query pins us to, if any. Relaxing a query (dropping the house
 * number / district) widens the search, and Nominatim will happily return a
 * same-named street in another province. Callers use this to reject hits that
 * fall outside the requested city instead of rendering the wrong place.
 */
export function requiredCity(query: string): string | null {
  const normalized = normalizeVnQuery(query).toLowerCase();
  return CANONICAL_CITIES.find((c) => normalized.includes(c.toLowerCase())) ?? null;
}

function dedupe(list: string[]): string[] {
  const out: string[] = [];
  for (const c of list) if (c && !out.includes(c)) out.push(c);
  return out;
}

/**
 * Attempts for an AUTOMATIC resolve. Deliberately stops at stripping the house
 * number: it preserves the district/ward, which is the only thing keeping the
 * match inside the intended area. Dropping the district would let "Nguyễn Huệ,
 * District 1" match a same-named street 60 km away in Cần Giờ — same city, wrong
 * place, silently rendered. That widening is only offered via `geocode_place`,
 * where a human/agent sees the candidates and chooses.
 */
export function queryCandidates(input: string): string[] {
  const raw = input.trim();
  const normalized = normalizeVnQuery(raw);
  return dedupe([raw, normalized, stripHouseNumber(normalized)]);
}

/** Wider ladder for explicit disambiguation — may leave the requested district. */
export function relaxedCandidates(input: string): string[] {
  const base = queryCandidates(input);
  return dedupe([...base, dropDistrictAndWard(base[base.length - 1])]);
}

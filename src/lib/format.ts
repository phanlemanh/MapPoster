/** Format a coordinate pair like "48.8566° N  ·  2.3522° E". */
export function formatCoords(lat: number, lng: number, decimals = 4): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  const la = Math.abs(lat).toFixed(decimals);
  const lo = Math.abs(lng).toFixed(decimals);
  return `${la}° ${ns}   ·   ${lo}° ${ew}`;
}

/** Turn a place name into a filesystem-safe slug. */
export function slugify(s: string): string {
  return (
    s
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '') // strip combining diacritics
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'poster'
  );
}

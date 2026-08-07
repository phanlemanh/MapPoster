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
      // Đ/đ (U+0110/U+0111) và cặp nhìn giống hệt Ð/ð (U+00D0/U+00F0) là chữ CÓ
      // GẠCH NGANG dựng sẵn, không phải chữ + dấu rời: NFKD không tách chúng ra
      // và \p{Diacritic} không khớp, nên chúng sống sót tới bước lọc ký tự rồi bị
      // XOÁ HẲN ('Đà Nẵng' → 'a-nang'). Phải chuyển tự tay, TRƯỚC khi lọc.
      .replace(/[ĐÐ]/g, 'D')
      .replace(/[đð]/g, 'd')
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '') // strip combining diacritics
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'poster'
  );
}

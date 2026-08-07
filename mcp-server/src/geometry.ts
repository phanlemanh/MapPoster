/**
 * Số đo hình học trên mặt cầu. Thuần toán — không phụ thuộc gì trong repo.
 *
 * KHÔNG tái dùng `bboxOfGeojsons` của resolveConfig cho diện tích: hàm đó
 * flatten đệ quy MÙ, cố ý không phân biệt outer ring với hole. Đúng cho bbox
 * (mọi toạ độ đều nằm trong khung), sai cho diện tích (lỗ phải bị trừ đi).
 */
export type LngLat = [number, number];

/** Bán kính Trái Đất trung bình theo IUGG, mét. */
const EARTH_RADIUS_M = 6_371_008.8;

const rad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineMeters(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Phương vị ban đầu của cung a→b, chuẩn hoá về 0..360 với 0 = hướng bắc. */
export function initialBearingDeg(a: LngLat, b: LngLat): number {
  const lat1 = rad(a[1]);
  const lat2 = rad(b[1]);
  const dLng = rad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Tổng chiều dài các đoạn liên tiếp — KHÁC đường chim bay đầu-cuối. */
export function polylineLengthMeters(coords: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineMeters(coords[i - 1], coords[i]);
  return total;
}

/** Diện tích một ring theo thặng dư cầu. Dấu phụ thuộc chiều quay của ring. */
function ringAreaM2(ring: LngLat[]): number {
  if (ring.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    total += rad(lng2 - lng1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return (total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

/**
 * Diện tích hình học, ĐÃ TRỪ LỖ.
 *
 * Ring đầu là outer, các ring sau là hole — theo đúng quy ước GeoJSON, KHÔNG
 * suy ra từ chiều quay: dữ liệu OSM thực tế có cả hai chiều, nên dựa vào dấu
 * là dựa vào thứ không được đảm bảo. Vì vậy lấy `Math.abs` từng ring rồi mới
 * quyết định cộng hay trừ theo vị trí của nó.
 */
export function geometryAreaM2(geom: { type: string; coordinates: unknown } | null | undefined): number {
  if (!geom) return 0;
  const polygonArea = (rings: LngLat[][]): number =>
    rings.reduce((acc, ring, i) => acc + (i === 0 ? Math.abs(ringAreaM2(ring)) : -Math.abs(ringAreaM2(ring))), 0);

  if (geom.type === 'Polygon') return Math.max(0, polygonArea(geom.coordinates as LngLat[][]));
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as LngLat[][][]).reduce((acc, rings) => acc + Math.max(0, polygonArea(rings)), 0);
  }
  return 0;
}

/**
 * Bề ngang / bề dọc của một bbox, km.
 *
 * Bề ngang đo dọc vĩ tuyến GIỮA chứ không phải xích đạo: 1° kinh độ ở vĩ độ 21
 * ngắn hơn ở xích đạo khoảng 7%, và một con số bỏ qua điều đó là con số sai ở
 * đúng thị trường sản phẩm này nhắm tới.
 */
export function spanKmOf(bbox: [number, number, number, number]): { ew: number; ns: number } {
  const [w, s, e, n] = bbox;
  const midLat = (s + n) / 2;
  const midLng = (w + e) / 2;
  return {
    ew: haversineMeters([w, midLat], [e, midLat]) / 1000,
    ns: haversineMeters([midLng, s], [midLng, n]) / 1000,
  };
}

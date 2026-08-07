/**
 * Anchor math — toán THUẦN cho `resolved.anchors` / `resolved.camera`.
 *
 * Tách khỏi `main.tsx` có chủ đích: `map.project()` cần một trình duyệt thật,
 * còn ba thứ dễ sai nhất ở đây thì không —
 *   1. công thức phần trăm (mẫu số RIÊNG từng trục),
 *   2. chốt từ chối pitch,
 *   3. chốt khẳng định camera đang ở `restAtSec`,
 * — nên cả ba sống ở đây và được unit test trong Node, thay vì chỉ được nhìn
 * gián tiếp qua một khung PNG mà agent không thấy được.
 *
 * Node (mcp-server) import các KIỂU ở đây; trang render import cả hàm.
 */
import type { GeoJSONFeatureCollection } from '../types';

/** Camera thật sự dùng để chiếu — echo ra `resolved.camera`. */
export interface ResolvedCamera {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface AnchorPoint {
  /** chỉ số trong `cfg.markers` (cùng thứ tự với `resolved.highlights.points`) */
  index: number;
  lng: number;
  lat: number;
  xPct: number;
  yPct: number;
  /** false = điểm nằm ngoài khung; xPct/yPct VẪN có nghĩa (âm hoặc >100) */
  onScreen: boolean;
}

export interface AnchorRegion {
  /** chỉ số trong `cfg.highlight.regions` */
  index: number;
  /** tâm HỘP BAO trên màn hình — không phải trọng tâm diện tích: bất biến với
   * mật độ đỉnh (một biên thành phố dày đỉnh ở một phía sẽ kéo lệch trung bình
   * cộng các đỉnh, còn tâm hộp thì không), và đúng thứ tầng DOM cần để đặt nhãn. */
  centroidPct: [number, number];
  /** [x0, y0, x1, y1] theo phần trăm khung */
  bboxPct: [number, number, number, number];
}

export interface ClipAnchors {
  camera: ResolvedCamera;
  points: AnchorPoint[];
  regions: AnchorRegion[];
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/** Khung CSS thật của canvas bản đồ. HAI trường, không phải một tỉ lệ. */
export interface FrameSize {
  cssW: number;
  cssH: number;
}

/** Sai số cho phép khi so camera đọc-lại với camera mong đợi (độ / mức zoom). */
export const ANCHOR_CAMERA_EPS = 1e-6;

/** 1e-4 % của khung ≈ 2 phần nghìn pixel ở khung 1920 — đủ mịn cho mọi tầng
 * DOM, và cắt được cái đuôi 17 chữ số của float trong JSON trả về. */
const PCT_DECIMALS = 4;
const roundPct = (v: number): number => Math.round(v * 10 ** PCT_DECIMALS) / 10 ** PCT_DECIMALS;

function assertFrame({ cssW, cssH }: FrameSize): void {
  if (!Number.isFinite(cssW) || !Number.isFinite(cssH) || cssW <= 0 || cssH <= 0) {
    throw new Error(`anchors: invalid frame size ${cssW}×${cssH} — cannot project without a real CSS frame`);
  }
}

/**
 * Pixel màn hình → phần trăm khung.
 *
 * MẪU SỐ RIÊNG TỪNG TRỤC, không có hệ số chung. `RenderApp.tsx:31` làm tròn
 * `Math.round(size.w)` và `Math.round(size.h)` ĐỘC LẬP, nên `cssW/cssH` lệch
 * khỏi `out.width/out.height` tới ~1px mỗi trục: một tỉ lệ chung sẽ nhân toạ
 * độ y bằng tỉ lệ của trục x và sai đúng ở chỗ không ai nhìn thấy được.
 * `ctx.drawImage(base, 0, 0, out.width, out.height)` kéo ảnh phủ kín CẢ HAI
 * trục, nên phần trăm là chính xác tuyệt đối chứ không phải xấp xỉ.
 */
export function pctOf(p: ScreenPoint, frame: FrameSize): { xPct: number; yPct: number; onScreen: boolean } {
  assertFrame(frame);
  const xPct = (p.x / frame.cssW) * 100;
  const yPct = (p.y / frame.cssH) * 100;
  return {
    xPct: roundPct(xPct),
    yPct: roundPct(yPct),
    onScreen: p.x >= 0 && p.x <= frame.cssW && p.y >= 0 && p.y <= frame.cssH,
  };
}

/**
 * Hộp bao + tâm của một vùng, tính trong KHÔNG GIAN MÀN HÌNH (sau khi đã chiếu)
 * chứ không phải trong lng/lat: với bearing ≠ 0, hộp lng/lat chiếu ra một hình
 * xoay, và bốn góc của nó không còn là bốn cực của hình vẽ trên khung.
 *
 * Trả `null` khi vùng không có toạ độ nào — thà thiếu một phần tử còn hơn bịa
 * ra một cái hộp mà tầng DOM sẽ đặt nhãn lên.
 */
export function regionAnchorOf(index: number, projected: ScreenPoint[], frame: FrameSize): AnchorRegion | null {
  assertFrame(frame);
  if (!projected.length) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of projected) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  if (!Number.isFinite(x0) || !Number.isFinite(y0)) return null;
  const min = pctOf({ x: x0, y: y0 }, frame);
  const max = pctOf({ x: x1, y: y1 }, frame);
  const mid = pctOf({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, frame);
  return {
    index,
    centroidPct: [mid.xPct, mid.yPct],
    bboxPct: [min.xPct, min.yPct, max.xPct, max.yPct],
  };
}

/** Mọi cặp [lng, lat] trong một FeatureCollection, bất kể kiểu hình học. */
export function collectCoords(fc: GeoJSONFeatureCollection | undefined): [number, number][] {
  const out: [number, number][] = [];
  const walk = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      if (Number.isFinite(node[0]) && Number.isFinite(node[1])) out.push([node[0], node[1]]);
      return;
    }
    for (const child of node) walk(child);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const f of (fc?.features ?? []) as any[]) walk(f?.geometry?.coordinates);
  return out;
}

/**
 * Bẫy nghiêng: với pitch ≠ 0, `map.project()` VẪN trả về một điểm, nhưng
 * `bboxPct` của một vùng mất nghĩa (hình chiếu là hình thang, không phải chữ
 * nhật) và điểm sau đường chân trời chiếu ra toạ độ vô nghĩa. Trả một con số
 * trông hợp lệ ở đây là đúng lớp lỗi repo này từ chối: agent không nhìn thấy
 * ảnh nên không thể phát hiện.
 */
export function assertNoPitch(pitch: number): void {
  if (pitch !== 0) {
    throw new Error(
      `anchors: camera pitch is ${pitch} — anchors require pitch 0. A tilted camera projects a region to a trapezoid, ` +
        `so bboxPct would be meaningless and points beyond the horizon project to nonsense. Remove camera.pitch to get anchors.`,
    );
  }
}

/** Cung ngắn nhất giữa hai góc, tính bằng độ — MapLibre trả bearing trong
 * (-180, 180] còn `cameraAt` trả [0, 360), nên so trực tiếp là sai. */
const angleDelta = (a: number, b: number): number => Math.abs(((b - a + 540) % 360) - 180);

/**
 * KHẲNG ĐỊNH camera đang ở đúng `restAtSec` thay vì TIN vào thứ tự gọi.
 *
 * `anchors()` chỉ đúng khi được gọi ngay sau lần chụp settle. Nếu ai đó chèn
 * một lời gọi vào giữa (một `renderMotionFrame(t)` khác, một `setCamera`), toạ
 * độ trả về sẽ được tính từ một camera khác — và không ai nhìn thấy được điều
 * đó trong JSON. Phải hỏng TO TIẾNG, không được trả toạ độ sai lặng lẽ.
 */
export function assertCameraAtRest(
  actual: ResolvedCamera,
  expected: { center: [number, number]; zoom: number; bearing: number },
  restAtSec: number,
): void {
  const problems: string[] = [];
  if (angleDelta(actual.center[0], expected.center[0]) > ANCHOR_CAMERA_EPS || Math.abs(actual.center[1] - expected.center[1]) > ANCHOR_CAMERA_EPS) {
    problems.push(`center [${actual.center[0]}, ${actual.center[1]}] ≠ [${expected.center[0]}, ${expected.center[1]}]`);
  }
  if (Math.abs(actual.zoom - expected.zoom) > ANCHOR_CAMERA_EPS) problems.push(`zoom ${actual.zoom} ≠ ${expected.zoom}`);
  if (angleDelta(actual.bearing, expected.bearing) > ANCHOR_CAMERA_EPS) problems.push(`bearing ${actual.bearing} ≠ ${expected.bearing}`);
  if (!problems.length) return;
  throw new Error(
    `anchors: map camera is not at restAtSec=${restAtSec} (${problems.join('; ')}). ` +
      `anchors() is read-only and must be called immediately after the settle capture — refusing to return coordinates projected from an unexpected camera.`,
  );
}

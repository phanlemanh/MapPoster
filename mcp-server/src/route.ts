import { envNumber } from '../config';
import type { GeoJSONFeatureCollection } from '../../src/types';

/**
 * Client OSRM: hỏi đường đi THỰC TẾ bám đường, thứ một mô hình ngôn ngữ không
 * thể tự sinh ra.
 *
 * Vì sao OSRM chứ không Valhalla: OSRM trả thẳng GeoJSON qua
 * `geometries=geojson`, nên không cần polyline decoder — bớt được một lớp có
 * thể sai lặng lẽ mà không test nào ở đây phát hiện được.
 *
 * Ba ràng buộc vận hành, mỗi cái có test khoá:
 *  1. Host CHỈ đến từ env, KHÔNG BAO GIỜ từ tham số caller. Đây là lời gọi mạng
 *     ra ngoài đầu tiên mà nội dung do caller ảnh hưởng; để caller chọn host là
 *     SSRF vào chính tiến trình đang giữ browser pool và cổng loopback.
 *  2. Mọi request có timeout cứng. `resolveConfig` chạy BÊN TRONG clip slot
 *     (concurrency mặc định 1), nên một router treo sẽ giữ slot toàn cục cho
 *     tới tận deadline pool 10 phút.
 *  3. Rate-limit nối tiếp + LRU có chặn, theo đúng mẫu `geocode.ts` — mặc định
 *     trỏ vào instance FOSSGIS công cộng để chạy được ngay, mà instance đó
 *     không có SLA và có chính sách dùng hợp lý.
 */

export type RouteMode = 'car' | 'moto' | 'walk';

export interface RouteRequest {
  from: [number, number];
  to: [number, number];
  via?: [number, number][];
  mode?: RouteMode;
}

export interface ResolvedRouteGeometry {
  geojson: GeoJSONFeatureCollection;
  /** Quãng đường ĐI THEO ĐƯỜNG do router báo — khác hẳn đường chim bay. */
  distanceKm: number;
  durationMin: number;
  /** Ghi rõ profile thật sự được dùng, kể cả khi mode bị ánh xạ. */
  provider: string;
  pointCount: number;
}

/**
 * OSRM demo chỉ phục vụ `driving` / `foot` / `bike`. `moto` ánh xạ sang
 * `driving` và điều đó ĐƯỢC GHI RA trong `provider` — giả vờ có profile riêng
 * cho xe máy là nói dối về thứ router thật sự tính.
 */
export const OSRM_PROFILE: Record<RouteMode, string> = {
  car: 'driving',
  moto: 'driving',
  walk: 'foot',
};

const DEFAULT_OSRM_URL = 'https://routing.openstreetmap.de/routed-car';
/** Cùng trần với `render_clip` để một tuyến không thể một mình làm phình payload. */
const MAX_ROUTE_POINTS = 700;

// --- cache + rate limiter, theo đúng mẫu geocode.ts ------------------------

let cacheMax = 200;
const routeCache = new Map<string, ResolvedRouteGeometry>();

let minSpacingMs = 250;
let lastUpstreamAt = 0;
let queue: Promise<void> = Promise.resolve();

/** Test seam — cùng quy ước với `geocode.__setRateLimitMs`. */
export function __setRouteSpacingMs(ms: number): void {
  minSpacingMs = ms;
}
export function __resetRouteCache(): void {
  routeCache.clear();
  lastUpstreamAt = 0;
  queue = Promise.resolve();
}

function lruGet(k: string): ResolvedRouteGeometry | undefined {
  if (!routeCache.has(k)) return undefined;
  const v = routeCache.get(k) as ResolvedRouteGeometry;
  routeCache.delete(k);
  routeCache.set(k, v);
  return v;
}
function lruSet(k: string, v: ResolvedRouteGeometry): void {
  routeCache.delete(k);
  routeCache.set(k, v);
  while (routeCache.size > cacheMax) routeCache.delete(routeCache.keys().next().value as string);
}

/** Nối tiếp các lời gọi upstream và giãn cách tối thiểu. */
function throttle(): Promise<void> {
  const turn = queue.then(async () => {
    const wait = Math.max(0, lastUpstreamAt + minSpacingMs - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastUpstreamAt = Date.now();
  });
  queue = turn.catch(() => {}); // một lượt hỏng không được đầu độc cả chuỗi
  return turn;
}

// --- geometry helpers ------------------------------------------------------

/**
 * Hạ số điểm xuống trần, GIỮ NGUYÊN hai đầu. Lấy mẫu đều ở giữa: tuyến vẫn
 * đúng hình dạng ở tỉ lệ hiển thị, mà payload không phụ thuộc độ dài chuyến đi.
 */
export function decimate(coords: [number, number][], max: number): [number, number][] {
  if (coords.length <= max || max < 2) return coords;
  const step = (coords.length - 1) / (max - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < max - 1; i++) out.push(coords[Math.round(i * step)]);
  out.push(coords[coords.length - 1]);
  return out;
}

function assertLngLat(c: [number, number], label: string): [number, number] {
  const [lng, lat] = c ?? [];
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error(`Invalid ${label} longitude: ${lng} (must be between -180 and 180)`);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error(`Invalid ${label} latitude: ${lat} (must be between -90 and 90)`);
  return [lng, lat];
}

/** Ghép toạ độ ĐÃ validate thành chuỗi OSRM — không nội suy chuỗi thô của caller. */
const coordPair = (c: [number, number]): string => `${Number(c[0])},${Number(c[1])}`;

// --- the client ------------------------------------------------------------

export async function resolveRoute(
  req: RouteRequest,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ResolvedRouteGeometry> {
  const from = assertLngLat(req.from, 'routes[].route.from');
  const to = assertLngLat(req.to, 'routes[].route.to');
  const via = (req.via ?? []).map((c, i) => assertLngLat(c, `routes[].route.via[${i}]`));
  const mode: RouteMode = req.mode ?? 'car';
  const profile = OSRM_PROFILE[mode];
  if (!profile) throw new Error(`Invalid routes[].route.mode: ${mode} (expected car, moto or walk)`);

  cacheMax = envNumber(env, 'MAPPOSTER_ROUTE_CACHE_MAX', 200, { min: 1 });
  const timeoutMs = envNumber(env, 'MAPPOSTER_ROUTE_TIMEOUT_MS', 8000, { min: 100 });
  // Host CHỈ từ env. Không có đường nào cho caller đặt giá trị này.
  const base = (env.MAPPOSTER_OSRM_URL || DEFAULT_OSRM_URL).replace(/\/+$/, '');

  const path = [from, ...via, to].map(coordPair).join(';');
  // mode nằm trong khoá cache: cùng hai đầu nhưng đi bộ và ô tô là hai tuyến khác nhau.
  const key = `${base}|${profile}|${path}`;
  const hit = lruGet(key);
  if (hit) return hit;

  const url = `${base}/route/v1/${profile}/${path}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  await throttle();

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const name = (e as Error).name;
    if (name === 'TimeoutError' || name === 'AbortError' || /abort/i.test((e as Error).message ?? '')) {
      throw new Error(
        `Routing request timed out after ${timeoutMs} ms. The default router is a public community instance with no SLA — ` +
          `set MAPPOSTER_OSRM_URL to a self-hosted OSRM for production, or raise MAPPOSTER_ROUTE_TIMEOUT_MS.`,
      );
    }
    throw new Error(`Routing request failed: ${(e as Error).message}. Set MAPPOSTER_OSRM_URL to a router you control.`);
  }

  if (!res.ok) {
    throw new Error(
      `Routing upstream answered ${res.status}. The default router is a public community instance with no SLA — ` +
        `set MAPPOSTER_OSRM_URL to a self-hosted OSRM for production.`,
    );
  }

  const body = (await res.json()) as {
    code?: string;
    routes?: { distance?: number; duration?: number; geometry?: { type?: string; coordinates?: [number, number][] } }[];
  };

  const route = body.routes?.[0];
  if (body.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
    // Trả một đường rỗng ở đây là để agent vẽ ra một bản đồ trống mà không biết
    // vì sao — nó không nhìn thấy ảnh.
    throw new Error(`No route found between the given points (router answered ${body.code ?? 'an unusable response'}).`);
  }

  const coords = decimate(route.geometry.coordinates, MAX_ROUTE_POINTS);
  const resolved: ResolvedRouteGeometry = {
    geojson: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }],
    },
    distanceKm: (route.distance ?? 0) / 1000,
    durationMin: (route.duration ?? 0) / 60,
    provider: `osrm/${profile}`,
    pointCount: coords.length,
  };
  lruSet(key, resolved);
  return resolved;
}

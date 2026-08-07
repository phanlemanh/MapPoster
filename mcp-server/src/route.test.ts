import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveRoute, decimate, OSRM_PROFILE, __resetRouteCache, __setRouteSpacingMs } from './route';

const okBody = (coords: [number, number][], distance = 12400, duration = 1680) => ({
  code: 'Ok',
  routes: [{ distance, duration, geometry: { type: 'LineString', coordinates: coords } }],
});
const jsonRes = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  __resetRouteCache();
  __setRouteSpacingMs(0);
  vi.restoreAllMocks();
});

describe('resolveRoute', () => {
  it('asks OSRM for full GeoJSON geometry and returns km/min', async () => {
    const f = vi.fn(async (_url: string, _init?: RequestInit) => jsonRes(okBody([[105.8, 21.0], [105.9, 21.1]])));
    vi.stubGlobal('fetch', f);

    const r = await resolveRoute({ from: [105.8, 21.0], to: [105.9, 21.1], mode: 'car' });

    const url = String(f.mock.calls[0][0]);
    // `geometries=geojson` là lý do chọn OSRM thay Valhalla: khỏi phải viết
    // polyline decoder, và khỏi một lớp có thể sai lặng lẽ.
    expect(url).toContain('overview=full');
    expect(url).toContain('geometries=geojson');
    expect(url).toContain('105.8,21');
    expect(r.distanceKm).toBeCloseTo(12.4, 3);
    expect(r.durationMin).toBeCloseTo(28, 3);
    expect(r.geojson.features[0].geometry.type).toBe('LineString');
    expect(r.pointCount).toBe(2);
  });

  it('maps moto to the driving profile and says so, rather than pretending a moto profile exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonRes(okBody([[1, 1], [2, 2]]))));
    const r = await resolveRoute({ from: [1, 1], to: [2, 2], mode: 'moto' });
    expect(OSRM_PROFILE.moto).toBe('driving');
    expect(r.provider).toMatch(/driving/);
  });

  it('sends via points in order between from and to', async () => {
    const f = vi.fn(async (_url: string, _init?: RequestInit) => jsonRes(okBody([[1, 1], [2, 2]])));
    vi.stubGlobal('fetch', f);
    await resolveRoute({ from: [1, 1], via: [[1.5, 1.5]], to: [2, 2] });
    expect(String(f.mock.calls[0][0])).toContain('1,1;1.5,1.5;2,2');
  });

  it('caches an identical request instead of paying the network twice', async () => {
    const f = vi.fn(async () => jsonRes(okBody([[1, 1], [2, 2]])));
    vi.stubGlobal('fetch', f);
    await resolveRoute({ from: [1, 1], to: [2, 2] });
    await resolveRoute({ from: [1, 1], to: [2, 2] });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('treats a different mode as a different request — the cache key must carry it', async () => {
    const f = vi.fn(async () => jsonRes(okBody([[1, 1], [2, 2]])));
    vi.stubGlobal('fetch', f);
    await resolveRoute({ from: [1, 1], to: [2, 2], mode: 'car' });
    await resolveRoute({ from: [1, 1], to: [2, 2], mode: 'walk' });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('reports a no-route answer as a caller-actionable error, not an empty line', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonRes({ code: 'NoRoute', routes: [] })));
    await expect(resolveRoute({ from: [1, 1], to: [2, 2] })).rejects.toThrow(/no route/i);
  });

  it('names the self-hosting remedy when the upstream fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })));
    // Thông điệp phải nói được người vận hành làm gì tiếp, không chỉ "503" —
    // instance công cộng không có SLA, và đó là thông tin caller cần.
    await expect(resolveRoute({ from: [1, 1], to: [2, 2] })).rejects.toThrow(/MAPPOSTER_OSRM_URL/);
  });

  it('gives up on a hung upstream rather than holding the clip slot', async () => {
    // resolveConfig chạy TRONG clip slot (concurrency mặc định 1). Không có
    // timeout thì một router treo giữ slot toàn cục tới tận deadline pool.
    vi.stubGlobal(
      'fetch',
      vi.fn((_u: string, init?: { signal?: AbortSignal }) =>
        new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('aborted')))),
      ),
    );
    await expect(
      // 120 chứ không phải 30: envNumber áp sàn 100 ms, vì một timeout dưới
      // ngưỡng đó không bao giờ hữu ích cho lời gọi mạng.
      resolveRoute({ from: [1, 1], to: [2, 2] }, { ...process.env, MAPPOSTER_ROUTE_TIMEOUT_MS: '120' }),
    ).rejects.toThrow(/timed out/i);
  });

  it('passes an AbortSignal on every request — a fetch without one cannot be timed out', async () => {
    const f = vi.fn(async (_url: string, init?: RequestInit) => { seen = init; return jsonRes(okBody([[1, 1], [2, 2]])); });
    let seen: RequestInit | undefined;
    vi.stubGlobal('fetch', f);
    await resolveRoute({ from: [1, 1], to: [2, 2] });
    expect(seen?.signal).toBeInstanceOf(AbortSignal);
  });

  it('refuses coordinates outside the valid range before spending a request', async () => {
    const f = vi.fn(async () => jsonRes(okBody([[1, 1], [2, 2]])));
    vi.stubGlobal('fetch', f);
    await expect(resolveRoute({ from: [999, 1], to: [2, 2] })).rejects.toThrow(/longitude/i);
    expect(f).not.toHaveBeenCalled();
  });

  it('decimates a very long geometry so one route cannot blow the payload budget', async () => {
    const many = Array.from({ length: 5000 }, (_, i) => [i / 1000, 0] as [number, number]);
    vi.stubGlobal('fetch', vi.fn(async () => jsonRes(okBody(many))));
    const r = await resolveRoute({ from: [0, 0], to: [5, 0] });
    expect(r.pointCount).toBeLessThanOrEqual(700);
    expect(r.geojson.features[0].geometry.coordinates.length).toBe(r.pointCount);
  });
});

describe('decimate', () => {
  it('caps the point count while keeping both endpoints', () => {
    const many = Array.from({ length: 5000 }, (_, i) => [i / 1000, 0] as [number, number]);
    const out = decimate(many, 700);
    expect(out.length).toBeLessThanOrEqual(700);
    expect(out[0]).toEqual(many[0]);
    expect(out[out.length - 1]).toEqual(many[many.length - 1]);
  });

  it('leaves a short line untouched', () => {
    const few: [number, number][] = [[0, 0], [1, 1], [2, 2]];
    expect(decimate(few, 700)).toEqual(few);
  });
});

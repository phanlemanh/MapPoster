import { describe, it, expect } from 'vitest';
import { parseGpx } from './gpx';

const TRACK_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>City Ride</name><trkseg>
    <trkpt lat="10.7550" lon="106.6650"/>
    <trkpt lat="10.7850" lon="106.7180"/>
    <trkpt lat="10.8100" lon="106.7550"/>
  </trkseg></trk>
</gpx>`;

describe('parseGpx', () => {
  it('parses a track into a FeatureCollection with line geometry', () => {
    const { geojson, name, bounds } = parseGpx(TRACK_GPX, 'fallback');
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBeGreaterThan(0);
    const geom = geojson.features[0].geometry;
    expect(['LineString', 'MultiLineString']).toContain(geom.type);
    expect(name).toBe('City Ride');
    expect(bounds).not.toBeNull();
  });

  it('computes correct [west, south, east, north] bounds', () => {
    const { bounds } = parseGpx(TRACK_GPX, 'fallback');
    expect(bounds).toEqual([106.665, 10.755, 106.755, 10.81]);
  });

  it('uses the fallback name when the track has none', () => {
    const noName = TRACK_GPX.replace('<name>City Ride</name>', '');
    const { name } = parseGpx(noName, 'my-file');
    expect(name).toBe('my-file');
  });

  it('throws on GPX with no tracks or routes', () => {
    const empty = `<?xml version="1.0"?><gpx version="1.1"></gpx>`;
    expect(() => parseGpx(empty, 'x')).toThrow(/no tracks or routes/i);
  });

  it('throws on malformed XML', () => {
    expect(() => parseGpx('not xml at all <<<', 'x')).toThrow();
  });
});

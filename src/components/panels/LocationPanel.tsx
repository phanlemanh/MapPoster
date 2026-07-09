import { useEffect, useRef, useState } from 'react';
import { usePosterStore } from '../../store/usePosterStore';
import { searchPlaces, reverseGeocode, type GeoResult } from '../../lib/geocoding';
import { Icon } from '../icons';
import { Section } from '../ui';
import { formatCoords } from '../../lib/format';
import HighlightControls from './HighlightControls';

export default function LocationPanel() {
  const location = usePosterStore((s) => s.location);
  const setLocation = usePosterStore((s) => s.setLocation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced Nominatim search (respects the ~1 req/s policy)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await searchPlaces(q, ac.signal);
        setResults(res);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Search failed. Try again.');
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const choose = (r: GeoResult) => {
    setLocation({
      name: r.name,
      country: r.country,
      lng: r.lng,
      lat: r.lat,
      zoom: r.zoom,
      displayName: r.displayName,
      osmType: r.osmType,
      osmId: r.osmId,
    });
    setQuery('');
    setResults([]);
  };

  const getMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        try {
          const r = await reverseGeocode(longitude, latitude);
          setLocation(
            r
              ? {
                  name: r.name,
                  country: r.country,
                  lng: longitude,
                  lat: latitude,
                  zoom: 13,
                  displayName: r.displayName,
                  osmType: r.osmType,
                  osmId: r.osmId,
                }
              : { name: 'My location', country: '', lng: longitude, lat: latitude, zoom: 13 },
          );
        } catch {
          setLocation({ name: 'My location', country: '', lng: longitude, lat: latitude, zoom: 13 });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? 'Location permission denied.' : 'Could not get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="panel-body">
      <Section title="Search a place">
        <div className="search-box">
          <Icon name="search" width={17} height={17} />
          <input
            autoFocus
            type="text"
            placeholder="City, address, landmark…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="icon-btn" onClick={() => setQuery('')} aria-label="Clear">
              <Icon name="close" width={15} height={15} />
            </button>
          )}
        </div>

        {loading && <div className="search-status">Searching…</div>}
        {error && <div className="search-status error">{error}</div>}

        {results.length > 0 && (
          <ul className="search-results">
            {results.map((r) => (
              <li key={r.id}>
                <button onClick={() => choose(r)}>
                  <Icon name="location" width={16} height={16} />
                  <span className="sr-main">
                    <strong>{r.name}</strong>
                    <small>{r.displayName}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <button className="btn-secondary full" onClick={getMyLocation} disabled={locating}>
          <Icon name="target" width={17} height={17} />
          {locating ? 'Locating…' : 'Get my location'}
        </button>
      </Section>

      <Section title="Current">
        <div className="current-loc">
          <div className="current-loc-name">{location.name || '—'}</div>
          {location.country && <div className="current-loc-country">{location.country}</div>}
          <div className="current-loc-coords">{formatCoords(location.lat, location.lng)}</div>
        </div>
      </Section>

      <Section title="Highlight regions" hint="Outline one or more areas using their OpenStreetMap boundaries.">
        <HighlightControls />
      </Section>
    </div>
  );
}

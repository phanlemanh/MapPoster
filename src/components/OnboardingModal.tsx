import { useEffect, useRef, useState } from 'react';
import { usePosterStore } from '../store/usePosterStore';
import { searchPlaces, type GeoResult } from '../lib/geocoding';
import { Icon } from './icons';

const QUICK_CITIES: GeoResult[] = [
  { id: 'q-paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, zoom: 12.5 },
  { id: 'q-nyc', name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, zoom: 12 },
  { id: 'q-tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, zoom: 11.5 },
  { id: 'q-hanoi', name: 'Hanoi', country: 'Vietnam', lat: 21.0278, lng: 105.8342, zoom: 12.5 },
  { id: 'q-london', name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, zoom: 12 },
  { id: 'q-sf', name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194, zoom: 12.5 },
];

export default function OnboardingModal() {
  const setLocation = usePosterStore((s) => s.setLocation);
  const completeOnboarding = usePosterStore((s) => s.completeOnboarding);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setResults(await searchPlaces(q, ac.signal));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const pick = (r: GeoResult) => {
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
    completeOnboarding();
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-card">
        <div className="onboard-brand">
          <Icon name="location" width={26} height={26} />
          <span>MapPoster</span>
        </div>
        <h1>Where to?</h1>
        <p>Pick a place to turn into a beautiful map poster. You can change it anytime.</p>

        <div className="search-box big">
          <Icon name="search" width={18} height={18} />
          <input autoFocus placeholder="Search any city or place…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {loading && <div className="search-status">Searching…</div>}
        {results.length > 0 && (
          <ul className="search-results">
            {results.map((r) => (
              <li key={r.id}>
                <button onClick={() => pick(r)}>
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

        {results.length === 0 && !loading && (
          <>
            <div className="onboard-sub">Popular choices</div>
            <div className="quick-cities">
              {QUICK_CITIES.map((c) => (
                <button key={c.id} onClick={() => pick(c)}>
                  {c.name}
                  <small>{c.country}</small>
                </button>
              ))}
            </div>
          </>
        )}

        <button className="btn-text onboard-skip" onClick={completeOnboarding}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

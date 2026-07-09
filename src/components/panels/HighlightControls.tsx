import { useEffect, useRef, useState } from 'react';
import { usePosterStore } from '../../store/usePosterStore';
import { searchPlaces, fetchRegionBoundary, type GeoResult } from '../../lib/geocoding';
import { getTheme } from '../../data/themes';
import { Toggle } from '../ui';
import { Icon } from '../icons';

interface AddTarget {
  name: string;
  country?: string;
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
}

const regionId = (t: AddTarget) => (t.osmType && t.osmId ? `hl-${t.osmType}-${t.osmId}` : `hl-${t.name.toLowerCase()}`);

export default function HighlightControls() {
  const enabled = usePosterStore((s) => s.highlightEnabled);
  const regions = usePosterStore((s) => s.highlightRegions);
  const fill = usePosterStore((s) => s.highlightFill);
  const dim = usePosterStore((s) => s.highlightDim);
  const color = usePosterStore((s) => s.highlightColor);
  const loading = usePosterStore((s) => s.highlightLoading);
  const location = usePosterStore((s) => s.location);
  const themeId = usePosterStore((s) => s.themeId);

  const setEnabled = usePosterStore((s) => s.setHighlightEnabled);
  const addRegionToStore = usePosterStore((s) => s.addHighlightRegion);
  const removeRegion = usePosterStore((s) => s.removeHighlightRegion);
  const updateRegion = usePosterStore((s) => s.updateHighlightRegion);
  const clearRegions = usePosterStore((s) => s.clearHighlightRegions);
  const setFill = usePosterStore((s) => s.setHighlightFill);
  const setDim = usePosterStore((s) => s.setHighlightDim);
  const setColor = usePosterStore((s) => s.setHighlightColor);
  const setLoading = usePosterStore((s) => s.setHighlightLoading);

  const accent = getTheme(themeId).colors.accent;
  const defaultColor = color ?? accent;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Add a region by fetching its administrative boundary.
  const addRegion = async (t: AddTarget) => {
    const id = regionId(t);
    if (usePosterStore.getState().highlightRegions.some((r) => r.id === id)) {
      setError(`"${t.name}" is already highlighted.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const b = await fetchRegionBoundary(
        { name: t.name, country: t.country ?? '', lng: 0, lat: 0, zoom: 12, osmType: t.osmType, osmId: t.osmId },
      );
      if (b) {
        addRegionToStore({ id, name: b.name || t.name, geojson: b.geojson, osmType: t.osmType, osmId: t.osmId, color: null });
      } else {
        setError(`No boundary found for "${t.name}".`);
        setLoading(false);
      }
    } catch {
      setError('Could not load that boundary.');
      setLoading(false);
    }
  };

  const onToggle = (v: boolean) => {
    setEnabled(v);
    if (v && regions.length === 0 && location.name) {
      addRegion({ name: location.name, country: location.country, osmType: location.osmType, osmId: location.osmId });
    }
  };

  // debounced search for districts / wards / any area
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setResults(await searchPlaces(q, ac.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Search failed.');
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const pickResult = (r: GeoResult) => {
    addRegion({ name: r.name, country: r.country, osmType: r.osmType, osmId: r.osmId });
    setQuery('');
    setResults([]);
  };

  const currentAlreadyAdded = regions.some((r) => r.id === regionId({ name: location.name, osmType: location.osmType, osmId: location.osmId }));

  return (
    <>
      <Toggle checked={enabled} onChange={onToggle} label="Highlight regions" />

      {enabled && (
        <>
          <p className="panel-hint">Add cities, districts (Quận) or wards (Phường/Xã) — each is outlined using its OpenStreetMap boundary.</p>

          <div className="search-box hl-search">
            <Icon name="search" width={16} height={16} />
            <input
              type="text"
              placeholder="Add a district, ward, area…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="icon-btn" onClick={() => setQuery('')} aria-label="Clear">
                <Icon name="close" width={14} height={14} />
              </button>
            )}
          </div>

          {searching && <div className="search-status">Searching…</div>}
          {loading && <div className="search-status">Loading boundary…</div>}
          {error && <div className="search-status error">{error}</div>}

          {results.length > 0 && (
            <ul className="search-results">
              {results.map((r) => (
                <li key={r.id}>
                  <button onClick={() => pickResult(r)}>
                    <Icon name="plus" width={16} height={16} />
                    <span className="sr-main">
                      <strong>{r.name}</strong>
                      <small>{r.displayName}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!currentAlreadyAdded && location.name && results.length === 0 && (
            <button className="btn-text hl-add-current" onClick={() => addRegion({ name: location.name, country: location.country, osmType: location.osmType, osmId: location.osmId })}>
              + Add current area ({location.name})
            </button>
          )}

          {regions.length > 0 && (
            <ul className="hl-region-list">
              {regions.map((r) => (
                <li key={r.id}>
                  <input
                    type="color"
                    value={r.color ?? defaultColor}
                    onChange={(e) => updateRegion(r.id, { color: e.target.value })}
                    title="Region color"
                  />
                  <span className="hl-region-name" title={r.name}>{r.name}</span>
                  <button className="icon-btn" onClick={() => removeRegion(r.id)} aria-label={`Remove ${r.name}`}>
                    <Icon name="trash" width={15} height={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="hl-style-controls">
            <Toggle checked={fill} onChange={setFill} label="Tint the areas" />
            <Toggle checked={dim} onChange={setDim} label="Dim the surroundings" />
            <div className="color-row">
              <span>Default color</span>
              <input type="color" value={defaultColor} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>

          {regions.length > 0 && (
            <button className="btn-text danger" onClick={clearRegions}>
              Clear all regions
            </button>
          )}
        </>
      )}
    </>
  );
}

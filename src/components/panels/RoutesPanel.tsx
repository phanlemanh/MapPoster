import { useRef, useState } from 'react';
import { usePosterStore, nextRouteId } from '../../store/usePosterStore';
import { parseGpx } from '../../lib/gpx';
import { getTheme } from '../../data/themes';
import { getMapInstance } from '../../lib/mapRef';
import { Section, Slider } from '../ui';
import { Icon } from '../icons';

export default function RoutesPanel() {
  const routes = usePosterStore((s) => s.routes);
  const addRoute = usePosterStore((s) => s.addRoute);
  const removeRoute = usePosterStore((s) => s.removeRoute);
  const clearRoutes = usePosterStore((s) => s.clearRoutes);
  const themeId = usePosterStore((s) => s.themeId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const parsed = parseGpx(text, file.name.replace(/\.gpx$/i, ''));
        const accent = getTheme(themeId).colors.accent;
        addRoute({ id: nextRouteId(), name: parsed.name, geojson: parsed.geojson, color: accent, width: 4 });
        if (parsed.bounds) {
          getMapInstance()?.fitBounds(
            [
              [parsed.bounds[0], parsed.bounds[1]],
              [parsed.bounds[2], parsed.bounds[3]],
            ],
            { padding: 60, duration: 900 },
          );
        }
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="panel-body">
      <Section title="Routes" hint="Upload a .gpx track to draw it on the map.">
        <button className="btn-secondary full" onClick={() => inputRef.current?.click()}>
          <Icon name="upload" width={17} height={17} />
          Upload GPX file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".gpx,application/gpx+xml,text/xml"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {error && <div className="search-status error">{error}</div>}
      </Section>

      {routes.length > 0 && (
        <Section title={`Loaded (${routes.length})`}>
          <ul className="route-list">
            {routes.map((r) => (
              <RouteRow key={r.id} id={r.id} name={r.name} color={r.color} width={r.width} onRemove={() => removeRoute(r.id)} />
            ))}
          </ul>
          <button className="btn-text danger" onClick={clearRoutes}>
            Remove all routes
          </button>
        </Section>
      )}
    </div>
  );
}

function RouteRow({
  id,
  name,
  color,
  width,
  onRemove,
}: {
  id: string;
  name: string;
  color: string;
  width: number;
  onRemove: () => void;
}) {
  const updateRoute = (patch: { color?: string; width?: number }) =>
    usePosterStore.getState().updateRoute(id, patch);
  return (
    <li className="route-row">
      <div className="route-row-head">
        <input type="color" value={color} onChange={(e) => updateRoute({ color: e.target.value })} />
        <span className="route-name" title={name}>
          {name}
        </span>
        <button className="icon-btn" onClick={onRemove} aria-label="Remove route">
          <Icon name="trash" width={16} height={16} />
        </button>
      </div>
      <Slider label="Width" min={1} max={16} step={1} value={width} display={`${width}px`} onChange={(v) => updateRoute({ width: v })} />
    </li>
  );
}

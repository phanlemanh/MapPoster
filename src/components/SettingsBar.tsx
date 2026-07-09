import { useState } from 'react';
import { usePosterStore } from '../store/usePosterStore';
import { getTheme } from '../data/themes';
import { getLayout } from '../data/layouts';
import { getFont } from '../data/fonts';
import { getMapInstance } from '../lib/mapRef';
import { exportPoster } from '../lib/export';
import { formatCoords } from '../lib/format';
import { Icon } from './icons';

export default function SettingsBar() {
  const location = usePosterStore((s) => s.location);
  const themeId = usePosterStore((s) => s.themeId);
  const layoutId = usePosterStore((s) => s.layoutId);
  const s = usePosterStore();

  const theme = getTheme(themeId);
  const layout = getLayout(layoutId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const doExport = async (format: 'png' | 'pdf') => {
    setMenuOpen(false);
    const map = getMapInstance();
    if (!map) {
      setError('Map is not ready yet.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await exportPoster({
        map,
        layout,
        theme,
        markers: s.markers,
        text: {
          city: location.name,
          country: location.country,
          coords: formatCoords(location.lat, location.lng),
          show: s.showText,
          showCity: s.showCity,
          showCountry: s.showCountry,
          showCoords: s.showCoords,
          font: getFont(s.font),
          color: theme.colors.text,
        },
        format,
        onProgress: setProgress,
      });
    } catch (e) {
      setError((e as Error).message || 'Export failed');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <div className="settings-bar">
      <div className="settings-summary">
        <span className="ss-title">Current settings</span>
        <div className="ss-rows">
          <div className="ss-row">
            <Icon name="location" width={15} height={15} />
            <span>{location.name}{location.country ? `, ${location.country}` : ''}</span>
          </div>
          <div className="ss-row">
            <Icon name="theme" width={15} height={15} />
            <span>{theme.name}</span>
            <span className="ss-swatch" style={{ background: theme.colors.background }} />
            <span className="ss-swatch" style={{ background: theme.colors.roadHighway }} />
          </div>
          <div className="ss-row">
            <Icon name="layout" width={15} height={15} />
            <span>{layout.name} · {layout.width}×{layout.height}</span>
          </div>
        </div>
      </div>

      <div className="download-wrap">
        <button className="btn-download" onClick={() => setMenuOpen((o) => !o)} disabled={busy}>
          <Icon name="download" width={18} height={18} />
          {busy ? progress || 'Rendering…' : 'Download'}
          {!busy && <Icon name="chevron" width={14} height={14} className="dl-chevron" />}
        </button>
        {menuOpen && !busy && (
          <div className="download-menu">
            <button onClick={() => doExport('png')}>
              <strong>PNG</strong>
              <small>High-resolution image · {layout.width}×{layout.height}</small>
            </button>
            <button onClick={() => doExport('pdf')}>
              <strong>PDF</strong>
              <small>{layout.print ? `Print-ready · ${layout.print.w}×${layout.print.h}${layout.print.unit}` : 'Vector page'}</small>
            </button>
          </div>
        )}
      </div>
      {error && <div className="download-error">{error}</div>}
    </div>
  );
}

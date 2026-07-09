import { usePosterStore } from '../../store/usePosterStore';
import { MARKER_ICONS, markerSvg } from '../../data/markers';
import { Section, Slider } from '../ui';
import { Icon } from '../icons';

export default function MarkersPanel() {
  const markers = usePosterStore((s) => s.markers);
  const selectedId = usePosterStore((s) => s.selectedMarkerId);
  const placingIcon = usePosterStore((s) => s.placingIcon);
  const setPlacingIcon = usePosterStore((s) => s.setPlacingIcon);
  const selectMarker = usePosterStore((s) => s.selectMarker);
  const updateMarker = usePosterStore((s) => s.updateMarker);
  const removeMarker = usePosterStore((s) => s.removeMarker);
  const clearMarkers = usePosterStore((s) => s.clearMarkers);

  const selected = markers.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="panel-body">
      <Section title="Add marker" hint={placingIcon ? 'Click the map to drop the marker.' : 'Pick an icon, then click the map.'}>
        <div className="marker-picker">
          {MARKER_ICONS.map((m) => (
            <button
              key={m.key}
              className={`marker-pick${placingIcon === m.key ? ' active' : ''}`}
              onClick={() => setPlacingIcon(placingIcon === m.key ? null : m.key)}
              title={m.label}
              dangerouslySetInnerHTML={{ __html: markerSvg(m.key, 'currentColor', 26) }}
            />
          ))}
        </div>
      </Section>

      {markers.length > 0 && (
        <Section title={`Placed (${markers.length})`}>
          <ul className="marker-list">
            {markers.map((m) => (
              <li key={m.id} className={m.id === selectedId ? 'active' : ''}>
                <button className="marker-list-main" onClick={() => selectMarker(m.id)}>
                  <span
                    className="marker-list-icon"
                    dangerouslySetInnerHTML={{ __html: markerSvg(m.icon, m.color, 20) }}
                  />
                  <span>
                    {m.icon} · {m.lat.toFixed(3)}, {m.lng.toFixed(3)}
                  </span>
                </button>
                <button className="icon-btn" onClick={() => removeMarker(m.id)} aria-label="Delete marker">
                  <Icon name="trash" width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
          <button className="btn-text danger" onClick={clearMarkers}>
            Clear all markers
          </button>
        </Section>
      )}

      {selected && (
        <Section title="Selected marker">
          <div className="color-row">
            <span>Color</span>
            <input
              type="color"
              value={selected.color}
              onChange={(e) => updateMarker(selected.id, { color: e.target.value })}
            />
          </div>
          <Slider
            label="Size"
            min={18}
            max={140}
            step={1}
            value={selected.size}
            display={`${selected.size}px`}
            onChange={(v) => updateMarker(selected.id, { size: v })}
          />
          <p className="panel-hint">Drag the marker on the map to move it, or drag its corner handle to resize.</p>
        </Section>
      )}
    </div>
  );
}

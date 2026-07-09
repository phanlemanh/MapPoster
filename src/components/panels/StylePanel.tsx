import { usePosterStore } from '../../store/usePosterStore';
import { FONTS } from '../../data/fonts';
import { Section, Toggle } from '../ui';
import type { FontKey } from '../../types';

export default function StylePanel() {
  const showText = usePosterStore((s) => s.showText);
  const showCity = usePosterStore((s) => s.showCity);
  const showCountry = usePosterStore((s) => s.showCountry);
  const showCoords = usePosterStore((s) => s.showCoords);
  const font = usePosterStore((s) => s.font);
  const setStyleFlags = usePosterStore((s) => s.setStyleFlags);
  const setFont = usePosterStore((s) => s.setFont);

  return (
    <div className="panel-body">
      <Section title="Poster text">
        <Toggle checked={showText} onChange={(v) => setStyleFlags({ showText: v })} label="Show text overlay" />
        <div className={showText ? '' : 'disabled-group'}>
          <Toggle checked={showCity} onChange={(v) => setStyleFlags({ showCity: v })} label="City name" />
          <Toggle checked={showCountry} onChange={(v) => setStyleFlags({ showCountry: v })} label="Country" />
          <Toggle checked={showCoords} onChange={(v) => setStyleFlags({ showCoords: v })} label="Coordinates" />
        </div>
      </Section>

      <Section title="Typeface">
        <div className="font-list">
          {FONTS.map((f) => (
            <button
              key={f.key}
              className={`font-item${f.key === font ? ' active' : ''}`}
              style={{ fontFamily: f.stack }}
              onClick={() => setFont(f.key as FontKey)}
            >
              <span className="font-sample" style={{ textTransform: f.uppercaseTitle ? 'uppercase' : 'none' }}>
                Reykjavik
              </span>
              <span className="font-name">{f.key}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

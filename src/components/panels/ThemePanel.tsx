import { usePosterStore } from '../../store/usePosterStore';
import { THEMES } from '../../data/themes';
import { Section } from '../ui';
import { Icon } from '../icons';

export default function ThemePanel() {
  const themeId = usePosterStore((s) => s.themeId);
  const setTheme = usePosterStore((s) => s.setTheme);

  return (
    <div className="panel-body">
      <Section title="Color theme" hint="Each preset re-tints every map layer.">
        <div className="theme-grid">
          {THEMES.map((t) => {
            const c = t.colors;
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                className={`theme-swatch${active ? ' active' : ''}`}
                onClick={() => setTheme(t.id)}
                title={t.name}
              >
                <span className="theme-preview" style={{ background: c.background }}>
                  <span className="tp-water" style={{ background: c.water }} />
                  <span className="tp-road tp-road-1" style={{ background: c.roadHighway }} />
                  <span className="tp-road tp-road-2" style={{ background: c.roadMajor }} />
                  <span className="tp-road tp-road-3" style={{ background: c.roadMinor }} />
                  {active && (
                    <span className="theme-check" style={{ color: c.text }}>
                      <Icon name="check" width={16} height={16} />
                    </span>
                  )}
                </span>
                <span className="theme-name">{t.name}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

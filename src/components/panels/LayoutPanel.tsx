import { usePosterStore } from '../../store/usePosterStore';
import { LAYOUTS, LAYOUT_CATEGORIES } from '../../data/layouts';
import { Section } from '../ui';

export default function LayoutPanel() {
  const layoutId = usePosterStore((s) => s.layoutId);
  const setLayout = usePosterStore((s) => s.setLayout);

  return (
    <div className="panel-body">
      {LAYOUT_CATEGORIES.map((cat) => (
        <Section key={cat} title={cat}>
          <div className="layout-grid">
            {LAYOUTS.filter((l) => l.category === cat).map((l) => {
              const active = l.id === layoutId;
              const ar = l.width / l.height;
              // scale a thumbnail to fit a 46x46 box
              const boxW = ar >= 1 ? 46 : 46 * ar;
              const boxH = ar >= 1 ? 46 / ar : 46;
              return (
                <button
                  key={l.id}
                  className={`layout-item${active ? ' active' : ''}`}
                  onClick={() => setLayout(l.id)}
                >
                  <span className="layout-thumb-box">
                    <span className="layout-thumb" style={{ width: boxW, height: boxH }} />
                  </span>
                  <span className="layout-meta">
                    <strong>{l.name}</strong>
                    <small>
                      {l.width}×{l.height}
                      {l.print ? ` · ${l.print.w}×${l.print.h}${l.print.unit}` : ''}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );
}

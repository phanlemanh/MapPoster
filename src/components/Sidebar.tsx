import { usePosterStore } from '../store/usePosterStore';
import { Icon, type IconName } from './icons';
import type { PanelKey } from '../types';

const ITEMS: { key: PanelKey; icon: IconName; label: string }[] = [
  { key: 'location', icon: 'location', label: 'Location' },
  { key: 'theme', icon: 'theme', label: 'Theme' },
  { key: 'layout', icon: 'layout', label: 'Layout' },
  { key: 'style', icon: 'style', label: 'Style' },
  { key: 'layers', icon: 'layers', label: 'Layers' },
  { key: 'markers', icon: 'markers', label: 'Markers' },
  { key: 'routes', icon: 'routes', label: 'Routes' },
  { key: 'settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar() {
  const activePanel = usePosterStore((s) => s.activePanel);
  const togglePanel = usePosterStore((s) => s.togglePanel);

  return (
    <nav className="sidebar" aria-label="Tools">
      <div className="sidebar-logo" title="MapPoster">
        <Icon name="location" width={22} height={22} />
      </div>
      <div className="sidebar-items">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-btn${activePanel === item.key ? ' active' : ''}`}
            onClick={() => togglePanel(item.key)}
            title={item.label}
            aria-label={item.label}
            aria-pressed={activePanel === item.key}
          >
            <Icon name={item.icon} />
            <span className="sidebar-tip">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

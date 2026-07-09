import { usePosterStore } from '../../store/usePosterStore';
import type { PanelKey } from '../../types';
import { Icon } from '../icons';
import LocationPanel from './LocationPanel';
import ThemePanel from './ThemePanel';
import LayoutPanel from './LayoutPanel';
import StylePanel from './StylePanel';
import LayersPanel from './LayersPanel';
import MarkersPanel from './MarkersPanel';
import RoutesPanel from './RoutesPanel';
import SettingsPanel from './SettingsPanel';

const TITLES: Record<PanelKey, string> = {
  location: 'Location',
  theme: 'Theme',
  layout: 'Layout',
  style: 'Style',
  layers: 'Layers',
  markers: 'Markers',
  routes: 'Routes',
  settings: 'Settings',
};

function renderPanel(key: PanelKey) {
  switch (key) {
    case 'location':
      return <LocationPanel />;
    case 'theme':
      return <ThemePanel />;
    case 'layout':
      return <LayoutPanel />;
    case 'style':
      return <StylePanel />;
    case 'layers':
      return <LayersPanel />;
    case 'markers':
      return <MarkersPanel />;
    case 'routes':
      return <RoutesPanel />;
    case 'settings':
      return <SettingsPanel />;
  }
}

export default function PanelHost() {
  const activePanel = usePosterStore((s) => s.activePanel);
  const closePanel = usePosterStore((s) => s.closePanel);

  return (
    <div className={`panel-host${activePanel ? ' open' : ''}`}>
      {activePanel && (
        <div className="panel" role="dialog" aria-label={TITLES[activePanel]}>
          <header className="panel-header">
            <h2>{TITLES[activePanel]}</h2>
            <button className="icon-btn" onClick={closePanel} aria-label="Close panel">
              <Icon name="close" width={18} height={18} />
            </button>
          </header>
          {renderPanel(activePanel)}
        </div>
      )}
    </div>
  );
}

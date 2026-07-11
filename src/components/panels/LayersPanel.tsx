import { usePosterStore } from '../../store/usePosterStore';
import { Section, Slider, Toggle } from '../ui';
import type { LayerKey } from '../../types';

const LAYER_LABELS: { key: LayerKey; label: string }[] = [
  { key: 'water', label: 'Water' },
  { key: 'landcover', label: 'Landcover' },
  { key: 'parks', label: 'Parks' },
  { key: 'buildings', label: 'Buildings' },
  { key: 'roads', label: 'Roads' },
  { key: 'rail', label: 'Railways' },
  { key: 'aeroway', label: 'Aeroways' },
  { key: 'roadLabels', label: 'Street names' },
];

export default function LayersPanel() {
  const layers = usePosterStore((s) => s.layers);
  const toggleLayer = usePosterStore((s) => s.toggleLayer);
  const detail = usePosterStore((s) => s.detail);
  const setDetail = usePosterStore((s) => s.setDetail);

  return (
    <div className="panel-body">
      <Section title="Map layers" hint="Show or hide features drawn on the map.">
        {LAYER_LABELS.map(({ key, label }) => (
          <Toggle key={key} checked={layers[key]} onChange={() => toggleLayer(key)} label={label} />
        ))}
      </Section>

      <Section title="Detail">
        <Slider
          label="Level of detail"
          min={0}
          max={1}
          step={0.05}
          value={detail}
          display={`${Math.round(detail * 100)}%`}
          onChange={setDetail}
        />
        <p className="panel-hint">Controls road thickness and how many minor roads appear.</p>
      </Section>
    </div>
  );
}

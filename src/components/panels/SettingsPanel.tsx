import { usePosterStore } from '../../store/usePosterStore';
import { Section, Toggle } from '../ui';

export default function SettingsPanel() {
  const lockMap = usePosterStore((s) => s.lockMap);
  const enableRotation = usePosterStore((s) => s.enableRotation);
  const setLock = usePosterStore((s) => s.setLock);
  const setRotation = usePosterStore((s) => s.setRotation);

  return (
    <div className="panel-body">
      <Section title="Map controls">
        <Toggle checked={lockMap} onChange={setLock} label="Lock map (disable pan & zoom)" />
        <Toggle
          checked={enableRotation}
          onChange={setRotation}
          label="Enable rotation"
        />
        <p className="panel-hint">
          {lockMap
            ? 'The map is locked — position is frozen for a stable poster.'
            : enableRotation
              ? 'Right-drag (or two-finger twist) to rotate the map.'
              : 'Rotation is off; the map stays north-up.'}
        </p>
      </Section>

      <Section title="Reset">
        <button
          className="btn-text danger"
          onClick={() => {
            if (confirm('Reset all MapPoster settings? This clears your saved poster.')) {
              localStorage.removeItem('mapposter-store');
              location.reload();
            }
          }}
        >
          Reset everything
        </button>
      </Section>
    </div>
  );
}

import type { ReactNode } from 'react';

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle${checked ? ' on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </label>
  );
}

export function Section({ title, children, hint }: { title?: string; children: ReactNode; hint?: string }) {
  return (
    <section className="panel-section">
      {title && <h3 className="panel-section-title">{title}</h3>}
      {hint && <p className="panel-hint">{hint}</p>}
      {children}
    </section>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  display?: string;
}) {
  return (
    <div className="slider-field">
      <div className="slider-head">
        <span>{label}</span>
        <span className="slider-value">{display ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

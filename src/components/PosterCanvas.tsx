import { useEffect, useRef, useState } from 'react';
import MapView from './MapView';
import PosterOverlay from './PosterOverlay';
import Attribution from './Attribution';
import { usePosterStore } from '../store/usePosterStore';
import { getLayout } from '../data/layouts';

const STAGE_PADDING = 48;

export default function PosterCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const layoutId = usePosterStore((s) => s.layoutId);
  const placing = usePosterStore((s) => s.placingIcon);
  const layout = getLayout(layoutId);

  useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setStage({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Fit the poster frame (layout aspect ratio) inside the available stage.
  const ar = layout.width / layout.height;
  const availW = Math.max(0, stage.w - STAGE_PADDING * 2);
  const availH = Math.max(0, stage.h - STAGE_PADDING * 2);
  let fw = availW;
  let fh = fw / ar;
  if (fh > availH) {
    fh = availH;
    fw = fh * ar;
  }

  return (
    <div className="stage" ref={stageRef}>
      <div
        className={`poster-frame${placing ? ' placing' : ''}`}
        style={{ width: Math.round(fw), height: Math.round(fh) }}
      >
        <MapView />
        <PosterOverlay />
        <Attribution />
      </div>
      <div className="stage-caption">
        {layout.name} · {layout.width}×{layout.height}px
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import MapView from '../components/MapView';
import PosterOverlay from '../components/PosterOverlay';
import Attribution from '../components/Attribution';

/**
 * Minimal headless poster surface: just the poster frame (map + overlay +
 * attribution) sized to the config aspect. No sidebar / panels / onboarding.
 */
export default function RenderApp({ width, height }: { width: number; height: number }) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const ar = width / height;
    const fit = () => {
      let w = window.innerWidth;
      let h = w / ar;
      if (h > window.innerHeight) {
        h = window.innerHeight;
        w = h * ar;
      }
      setSize({ w, h });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [width, height]);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#000' }}>
      <div className="poster-frame" style={{ width: Math.round(size.w), height: Math.round(size.h) }}>
        <MapView />
        <PosterOverlay />
        <Attribution />
      </div>
    </div>
  );
}

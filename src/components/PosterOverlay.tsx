import { useEffect, useRef, useState } from 'react';
import { usePosterStore } from '../store/usePosterStore';
import { getFont } from '../data/fonts';
import { getTheme } from '../data/themes';
import { TEXT_FRAC } from '../lib/posterText';
import { formatCoords } from '../lib/format';

export default function PosterOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const location = usePosterStore((s) => s.location);
  const showText = usePosterStore((s) => s.showText);
  const showCity = usePosterStore((s) => s.showCity);
  const showCountry = usePosterStore((s) => s.showCountry);
  const showCoords = usePosterStore((s) => s.showCoords);
  const fontKey = usePosterStore((s) => s.font);
  const themeId = usePosterStore((s) => s.themeId);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const font = getFont(fontKey);
  const theme = getTheme(themeId);
  const min = Math.min(size.w, size.h) || 1;
  const cityPx = min * TEXT_FRAC.city;
  const subPx = min * TEXT_FRAC.sub;
  const showSub = (showCountry && location.country) || showCoords;

  return (
    <div
      ref={ref}
      className="poster-overlay"
      style={{ fontFamily: font.stack, color: theme.colors.text }}
    >
      {showText && (
        <div className="poster-overlay-inner" style={{ paddingBottom: size.h * 0.085 }}>
          {showCity && location.name && (
            <div
              className="po-city"
              style={{
                fontSize: cityPx,
                fontWeight: font.titleWeight,
                letterSpacing: `${font.titleTracking}em`,
                textTransform: font.uppercaseTitle ? 'uppercase' : 'none',
              }}
            >
              {location.name}
            </div>
          )}

          {showCity && showSub && (
            <div className="po-rule" style={{ width: size.w * TEXT_FRAC.ruleWidth, marginTop: min * 0.02, marginBottom: min * 0.026 }} />
          )}

          {showCountry && location.country && (
            <div className="po-country" style={{ fontSize: subPx, letterSpacing: '0.22em' }}>
              {location.country.toUpperCase()}
            </div>
          )}

          {showCoords && (
            <div className="po-coords" style={{ fontSize: subPx * 0.92, letterSpacing: '0.12em', marginTop: min * 0.012 }}>
              {formatCoords(location.lat, location.lng)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

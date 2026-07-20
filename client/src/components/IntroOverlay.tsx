import { useEffect, useState } from 'react';
import { coatFromName } from '../lore/intro';

interface IntroOverlayProps {
  rulerName: string;
  kingdomName: string;
  dynastyName: string;
  startProvince: string;
  story: string;
  onContinue: () => void;
}

export default function IntroOverlay({
  rulerName,
  kingdomName,
  dynastyName,
  startProvince,
  story,
  onContinue,
}: IntroOverlayProps) {
  const [visible, setVisible] = useState(false);
  const coat = coatFromName(dynastyName || rulerName);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(40,32,20,0.95) 0%, rgba(8,6,4,0.98) 70%)',
      }}
    >
      <div className="panel parchment-frame max-w-lg w-full p-6 sm:p-8 space-y-5 intro-rise">
        <div className="flex items-center gap-4">
          <div
            className="coat-of-arms"
            style={{ background: `linear-gradient(145deg, ${coat.primary}, ${coat.secondary})` }}
            aria-hidden
          >
            <span>{coat.emblem}</span>
          </div>
          <div>
            <div className="font-display text-gold text-lg">{dynastyName}</div>
            <div className="text-xs text-parchment/60">{kingdomName} · {startProvince}</div>
          </div>
        </div>

        <h2 className="font-display text-gold text-xl">Chronik beginnt</h2>
        <p className="text-parchment/90 text-sm leading-relaxed whitespace-pre-line">{story}</p>
        <p className="text-xs text-parchment/50 italic">Herrscher: {rulerName}</p>
        <p className="text-[11px] text-amber-200/70">
          Danach folgt ein kurzes Tutorial mit den wichtigsten Schritten.
        </p>

        <button type="button" className="btn-primary w-full" onClick={onContinue}>
          Weiter zum Tutorial
        </button>
      </div>
    </div>
  );
}

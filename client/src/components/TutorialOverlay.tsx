import { useEffect, useState } from 'react';
import { START_TUTORIAL, type TutorialStep } from '../lore/helpContent';

interface Props {
  onFinish: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({ onFinish, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const current: TutorialStep = START_TUTORIAL[step];
  const isLast = step >= START_TUTORIAL.length - 1;
  const progress = ((step + 1) / START_TUTORIAL.length) * 100;

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const next = () => {
    if (isLast) onFinish();
    else setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(30,24,16,0.92) 0%, rgba(6,5,3,0.96) 75%)',
      }}
      role="dialog"
      aria-labelledby="tutorial-title"
    >
      <div className="panel parchment-frame max-w-lg w-full p-5 sm:p-7 space-y-4 intro-rise">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wide text-parchment/45 font-display">
            Tutorial · Schritt {step + 1} / {START_TUTORIAL.length}
          </div>
          <button
            type="button"
            className="text-[11px] text-parchment/50 hover:text-gold transition-colors"
            onClick={onSkip}
          >
            Überspringen
          </button>
        </div>

        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-700 to-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 id="tutorial-title" className="font-display text-gold text-xl">
          {current.title}
        </h2>
        <p className="text-parchment/90 text-sm leading-relaxed">{current.body}</p>

        <div className="rounded border border-gold/25 bg-black/30 px-3 py-2 text-xs text-amber-100/90">
          <span className="text-gold font-display">Aufgabe: </span>
          {current.doNext}
        </div>

        {current.highlight && (
          <p className="text-[11px] text-parchment/45">
            Hinweis: Achte auf{' '}
            {current.highlight === 'map'
              ? 'die Weltkarte'
              : current.highlight === 'resources'
                ? 'die Ressourcenleiste oben'
                : current.highlight === 'speed'
                  ? 'die Geschwindigkeits-Tasten (⏸ ▶)'
                  : 'die Navigation (Hof, Reich, Welt, Codex)'}
            .
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {step > 0 && (
            <button type="button" className="btn-secondary flex-1" onClick={back}>
              Zurück
            </button>
          )}
          <button type="button" className="btn-primary flex-1" onClick={next}>
            {isLast ? 'Tutorial beenden' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  );
}

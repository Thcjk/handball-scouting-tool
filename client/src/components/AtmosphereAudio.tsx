/**
 * Leichte prozedurale Atmosphäre (Web Audio) – keine Assets nötig.
 * Stimmung wechselt fließend mit Jahreszeit/Wetter/Krieg.
 */
import { useEffect, useRef } from 'react';

const MOOD_FREQ: Record<string, { base: number; wobble: number; volume: number }> = {
  peace: { base: 196, wobble: 4, volume: 0.03 },
  war: { base: 110, wobble: 18, volume: 0.045 },
  siege: { base: 82, wobble: 22, volume: 0.05 },
  winter: { base: 147, wobble: 3, volume: 0.028 },
  capital: { base: 220, wobble: 6, volume: 0.035 },
  church: { base: 262, wobble: 2, volume: 0.04 },
  tournament: { base: 294, wobble: 12, volume: 0.04 },
  harbor: { base: 165, wobble: 8, volume: 0.032 },
  rain: { base: 130, wobble: 15, volume: 0.03 },
  market: { base: 185, wobble: 10, volume: 0.034 },
};

export default function AtmosphereAudio({ mood, enabled }: { mood?: string; enabled?: boolean }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!enabled || !mood) return;
    const cfg = MOOD_FREQ[mood] ?? MOOD_FREQ.peace;

    const start = async () => {
      try {
        if (!ctxRef.current) {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctxRef.current = new Ctx();
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        if (!oscRef.current) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          osc.type = 'sine';
          lfo.frequency.value = 0.15;
          lfoGain.gain.value = cfg.wobble;
          gain.gain.value = 0;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          lfo.start();
          oscRef.current = osc;
          gainRef.current = gain;
        }

        const osc = oscRef.current;
        const gain = gainRef.current!;
        const now = ctx.currentTime;
        osc.frequency.setTargetAtTime(cfg.base, now, 1.2);
        gain.gain.setTargetAtTime(cfg.volume, now, 1.5);
      } catch {
        /* Audio optional */
      }
    };

    void start();
  }, [mood, enabled]);

  useEffect(() => {
    return () => {
      try {
        gainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.3);
        oscRef.current?.stop();
      } catch {
        /* ignore */
      }
      oscRef.current = null;
      gainRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return null;
}

import { useCallback, useEffect, useState } from 'react';

function getFsElement(): Element | null {
  return (
    document.fullscreenElement ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).webkitFullscreenElement ??
    null
  );
}

async function requestFs(el: HTMLElement) {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  if (el.requestFullscreen) await el.requestFullscreen();
  else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
}

async function exitFs() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
  else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
}

/**
 * Browser-Vollbild. ESC beendet Vollbild (Browser-Standard + Fallback).
 */
export function useFullscreen(targetRef?: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(Boolean(getFsElement()));
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync as EventListener);
    sync();
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync as EventListener);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = targetRef?.current ?? document.documentElement;
    try {
      await requestFs(el);
      setActive(true);
    } catch {
      // Browser blockiert ohne User-Gesture – UI bleibt nutzbar
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    try {
      await exitFs();
    } catch {
      /* ignore */
    }
    setActive(false);
  }, []);

  const toggle = useCallback(async () => {
    if (getFsElement()) await exit();
    else await enter();
  }, [enter, exit]);

  // ESC: Browser beendet Fullscreen selbst; wir syncen nur State.
  // Zusätzlich: wenn nur immersives CSS-Flag gesetzt ist, ESC zurücksetzen (via Callback).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && getFsElement()) {
        // native exit folgt; State via fullscreenchange
        setActive(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { active, enter, exit, toggle };
}

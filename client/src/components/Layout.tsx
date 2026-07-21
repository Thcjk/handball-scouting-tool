import { useEffect, useRef, useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isOfflineMode } from '../api/client';
import { useFullscreen } from '../hooks/useFullscreen';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isGame = location.pathname === '/game' || location.pathname.endsWith('/game');
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { active: browserFs, enter, exit } = useFullscreen(shellRef);
  const [immersive, setImmersive] = useState(false);

  // Spielseite: immer ohne Seitenscroll (Viewport füllen)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isGame) {
      root.classList.add('app-no-scroll');
      body.classList.add('app-no-scroll');
    } else {
      root.classList.remove('app-no-scroll');
      body.classList.remove('app-no-scroll');
      setImmersive(false);
      if (browserFs) void exit();
    }
    return () => {
      root.classList.remove('app-no-scroll');
      body.classList.remove('app-no-scroll');
    };
  }, [isGame, browserFs, exit]);

  const leaveFullscreen = useCallback(() => {
    setImmersive(false);
    void exit();
  }, [exit]);

  // ESC beendet Vollbild
  useEffect(() => {
    if (!isGame) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.fullscreenElement || immersive) {
        e.preventDefault();
        leaveFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isGame, immersive, leaveFullscreen]);

  // Browser-Fullscreen-Ende → immersiv aus
  useEffect(() => {
    if (!browserFs) setImmersive(false);
  }, [browserFs]);

  const goFullscreen = async () => {
    setImmersive(true);
    await enter();
  };

  const hideChrome = isGame && (immersive || browserFs);

  return (
    <div
      ref={shellRef}
      className={`app-shell flex flex-col ${isGame ? 'app-shell-game' : 'app-shell-pages'} ${
        hideChrome ? 'is-fullscreen' : ''
      } ${browserFs ? 'is-browser-fs' : ''}`}
    >
      <header className={`hud-bar px-3 py-2 z-40 shrink-0 ${hideChrome ? 'app-chrome-hidden' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={`${import.meta.env.BASE_URL}shield.svg`} alt="" className="w-7 h-7 shrink-0" />
            <h1 className="font-display text-base sm:text-lg text-gold truncate">Kronenchronik</h1>
            {isOfflineMode && (
              <span className="hidden md:inline text-[10px] text-green-400/90 border border-green-500/30 px-1.5 py-0.5 rounded">
                Gespeichert
              </span>
            )}
          </div>
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0 overflow-x-auto max-w-[70vw] sm:max-w-none pb-0.5">
            <NavLink
              to="/game"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Karte
            </NavLink>
            <NavLink
              to="/diplomacy"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Diplomatie
            </NavLink>
            <NavLink
              to="/chronicle"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Chronik
            </NavLink>
            <NavLink
              to="/court"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Hof
            </NavLink>
            <NavLink
              to="/realm"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Reich
            </NavLink>
            <NavLink
              to="/society"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Welt
            </NavLink>
            <NavLink
              to="/codex"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Codex
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Profil
            </NavLink>
            {isGame && (
              <button
                type="button"
                className="btn-secondary text-[11px] py-1 px-2"
                title={browserFs ? 'Vollbild beenden (Esc)' : 'Vollbild'}
                onClick={() => void (browserFs ? leaveFullscreen() : goFullscreen())}
              >
                {browserFs ? '🡽 Esc' : '⛶ Vollbild'}
              </button>
            )}
            <span className="hidden sm:inline text-xs text-parchment/50 mx-1">{user?.username}</span>
            <button onClick={logout} className="btn-secondary text-[11px] py-1 px-2">
              Abmelden
            </button>
          </nav>
        </div>
      </header>

      {isGame && hideChrome && (
        <button
          type="button"
          className="fs-exit-hint"
          title="Vollbild beenden"
          onClick={leaveFullscreen}
        >
          Esc · Verlassen
        </button>
      )}

      {isGame && !hideChrome && (
        <div className="shrink-0 px-3 py-1 bg-black/50 border-b border-gold/20 flex items-center justify-between gap-2 text-[11px] text-parchment/70">
          <span>Die Karte füllt den Bildschirm – ohne Scrollen.</span>
          <button type="button" className="btn-secondary text-[10px] py-0.5 px-2" onClick={() => void goFullscreen()}>
            ⛶ Vollbild · Esc zum Verlassen
          </button>
        </div>
      )}

      <main
        className={`flex-1 min-h-0 ${
          isGame ? 'overflow-hidden' : 'overflow-y-auto max-w-5xl w-full mx-auto p-4'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}

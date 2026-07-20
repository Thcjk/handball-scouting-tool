import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isOfflineMode } from '../api/client';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isGame = location.pathname === '/game' || location.pathname.endsWith('/game');

  return (
    <div className={`min-h-dvh flex flex-col ${isGame ? 'h-dvh overflow-hidden' : ''}`}>
      <header className="hud-bar px-3 py-2 z-40 shrink-0">
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
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
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
              to="/profile"
              className={({ isActive }) =>
                `px-2 py-1 text-xs sm:text-sm font-display transition-colors ${isActive ? 'text-gold' : 'text-parchment/70 hover:text-gold'}`
              }
            >
              Profil
            </NavLink>
            <span className="hidden sm:inline text-xs text-parchment/50 mx-1">{user?.username}</span>
            <button onClick={logout} className="btn-secondary text-[11px] py-1 px-2">
              Abmelden
            </button>
          </nav>
        </div>
      </header>
      <main className={`flex-1 min-h-0 ${isGame ? '' : 'max-w-5xl w-full mx-auto p-4'}`}>
        <Outlet />
      </main>
    </div>
  );
}

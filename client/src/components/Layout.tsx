import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-medieval-gray border-b border-medieval-brown/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/shield.svg" alt="Wappen" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-medieval-gold">Kronenchronik</h1>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <NavLink
              to="/game"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition-colors text-sm ${isActive ? 'text-medieval-gold bg-medieval-brown/30' : 'text-gray-300 hover:text-medieval-gold'}`
              }
            >
              Weltkarte
            </NavLink>
            <NavLink
              to="/diplomacy"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition-colors text-sm ${isActive ? 'text-medieval-gold bg-medieval-brown/30' : 'text-gray-300 hover:text-medieval-gold'}`
              }
            >
              Diplomatie
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-1 rounded transition-colors text-sm ${isActive ? 'text-medieval-gold bg-medieval-brown/30' : 'text-gray-300 hover:text-medieval-gold'}`
              }
            >
              Profil
            </NavLink>
            <span className="text-medieval-light text-sm hidden sm:inline">{user?.username}</span>
            <button onClick={logout} className="btn-secondary text-sm">
              Abmelden
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

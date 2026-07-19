import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User, isOfflineMode } from '../api/client';
import { localLogout } from '../local/localApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    kingdomName: string;
    rulerName: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (isOfflineMode) {
      const session = localStorage.getItem('kronenchronik_session');
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        setUser(me);
      } catch {
        localLogout();
      } finally {
        setLoading(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('token', res.accessToken);
    setUser(res.user);
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    kingdomName: string;
    rulerName: string;
  }) => {
    const res = await api.register(data);
    localStorage.setItem('token', res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    if (isOfflineMode) {
      localLogout();
    } else {
      localStorage.removeItem('token');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

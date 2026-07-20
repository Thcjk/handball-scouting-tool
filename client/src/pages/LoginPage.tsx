import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isOfflineMode } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, #2a2218 0%, #0e0c0a 55%), linear-gradient(180deg, #1a2a1f 0%, #0e0c0a 100%)',
      }}
    >
      <div className="panel w-full max-w-md p-6 space-y-5">
        <div className="text-center">
          <img src={`${import.meta.env.BASE_URL}shield.svg`} alt="" className="w-14 h-14 mx-auto mb-3" />
          <h1 className="font-display text-2xl text-gold">Kronenchronik</h1>
          <p className="text-parchment/60 text-sm mt-1">Herrsche. Erobere. Überlebe.</p>
          {isOfflineMode && (
            <p className="text-green-400/80 text-xs mt-2">Spielstand wird in diesem Browser gespeichert</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-parchment/70 mb-1 font-display">E-Mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs text-parchment/70 mb-1 font-display">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-sm text-parchment/50">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-gold hover:underline">
            Dynastie gründen
          </Link>
        </p>
      </div>
    </div>
  );
}

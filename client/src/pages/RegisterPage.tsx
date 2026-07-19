import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    kingdomName: '',
    rulerName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={`${import.meta.env.BASE_URL}shield.svg`} alt="Wappen" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-medieval-gold">Konto erstellen</h1>
          <p className="text-gray-400 text-sm mt-1">Gründe deine Dynastie</p>
        </div>

        {error && (
          <div className="bg-medieval-red/20 border border-medieval-red text-red-300 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'email', label: 'E-Mail', type: 'email' },
            { key: 'username', label: 'Benutzername', type: 'text' },
            { key: 'password', label: 'Passwort', type: 'password' },
            { key: 'kingdomName', label: 'Name des Königreichs', type: 'text' },
            { key: 'rulerName', label: 'Name des Herrschers', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-sm text-medieval-light mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => update(key, e.target.value)}
                className="input-field"
                required
                minLength={key === 'password' ? 6 : 3}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Erstellen...' : 'Königreich gründen'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Bereits registriert?{' '}
          <Link to="/login" className="text-medieval-gold hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}

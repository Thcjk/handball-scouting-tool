import { useState, useEffect, type FormEvent } from 'react';
import { api, type Profile } from '../api/client';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setUsername(p.username);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Fehler');
        setLoading(false);
      });
  }, []);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const updated = await api.updateProfile({ username });
      setProfile(updated);
      setMessage('Profil aktualisiert');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.changePassword({ currentPassword, newPassword });
      setMessage('Passwort geändert');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    }
  };

  if (loading)
    return <div className="text-center text-medieval-gold animate-pulse py-20">Laden...</div>;
  if (!profile) return <div className="text-center text-red-400">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-medieval-gold">Profil</h2>

        {message && (
          <div className="bg-medieval-green/20 border border-medieval-green text-green-300 px-3 py-2 rounded text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-medieval-red/20 border border-medieval-red text-red-300 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">E-Mail:</span> {profile.email}
          </div>
          <div>
            <span className="text-gray-400">Mitglied seit:</span>{' '}
            {new Date(profile.createdAt).toLocaleDateString('de-DE')}
          </div>
        </div>

        {profile.kingdom && (
          <div className="border-t border-medieval-brown/30 pt-4 space-y-2 text-sm">
            <h3 className="font-semibold text-medieval-gold">Königreich: {profile.kingdom.name}</h3>
            {profile.kingdom.dynasty && (
              <div>
                Dynastie: {profile.kingdom.dynasty.name} – „{profile.kingdom.dynasty.motto}"
              </div>
            )}
            {profile.kingdom.ruler && (
              <div>
                Herrscher: {profile.kingdom.ruler.name} (Kampf: {profile.kingdom.ruler.martial})
              </div>
            )}
            <div>Provinzen: {profile.kingdom.provinceCount}</div>
          </div>
        )}
      </div>

      <form onSubmit={handleProfileUpdate} className="card space-y-4">
        <h3 className="font-semibold text-medieval-gold">Benutzername ändern</h3>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
          required
          minLength={3}
        />
        <button type="submit" className="btn-primary">
          Speichern
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="card space-y-4">
        <h3 className="font-semibold text-medieval-gold">Passwort ändern</h3>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input-field"
          placeholder="Aktuelles Passwort"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-field"
          placeholder="Neues Passwort"
          required
          minLength={6}
        />
        <button type="submit" className="btn-primary">
          Passwort ändern
        </button>
      </form>
    </div>
  );
}

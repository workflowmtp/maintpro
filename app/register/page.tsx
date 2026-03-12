'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!nom.trim()) { setError('Veuillez entrer votre nom'); return; }
    if (!email.trim()) { setError('Veuillez entrer votre email'); return; }
    if (!password) { setError('Veuillez entrer un mot de passe'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
      } else {
        setSuccess('Inscription reussie ! Redirection vers la connexion...');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister();
  };

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <div className="login-box">
        <div className="login-logo">Maint<span>Pro</span></div>
        <div className="login-subtitle">Creer un nouveau compte</div>

        <div className="login-field">
          <label>Nom complet</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => { setNom(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Entrez votre nom"
            autoComplete="name"
          />
        </div>

        <div className="login-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Entrez votre email"
            autoComplete="email"
          />
        </div>

        <div className="login-field">
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Minimum 6 caracteres"
          />
        </div>

        <div className="login-field">
          <label>Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Confirmez votre mot de passe"
          />
        </div>

        <button className="login-btn" onClick={handleRegister} disabled={loading}>
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </button>

        {error && <div className="login-error">{error}</div>}
        {success && <div style={{ color: 'var(--accent)', textAlign: 'center', marginTop: 8, fontSize: '0.85rem' }}>{success}</div>}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Deja un compte ? </span>
          <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Se connecter</a>
        </div>
      </div>
    </div>
  );
}

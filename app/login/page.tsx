'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const err = await login(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/dashboard');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <div className="login-box">
        <div className="login-logo">Maint<span>Pro</span></div>
        <div className="login-subtitle">Gestion Maintenance Industrielle Multi-Poles v3+</div>

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
            placeholder="Entrez votre mot de passe"
          />
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        {error && <div className="login-error">{error}</div>}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Pas encore de compte ? </span>
          <a href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>S&apos;inscrire</a>
        </div>
      </div>
    </div>
  );
}

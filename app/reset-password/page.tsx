'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('Lien invalide'); return; }
    if (!newPassword || !confirmPassword) { setError('Tous les champs sont requis'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (newPassword.length < 6) { setError('Le mot de passe doit faire au moins 6 caracteres'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error || 'Erreur');
      }
    } catch {
      setError('Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--color-surface)', borderRadius: 12, padding: 32, boxShadow: 'var(--shadow)' }}>
        <h2 style={{ marginBottom: 8, fontSize: '1.5rem', textAlign: 'center' }}>MaintPro</h2>
        <p style={{ marginBottom: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.9rem' }}>Reinitialisation du mot de passe</p>

        {done ? (
          <>
            <div style={{ padding: 16, background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
              Mot de passe modifie avec succes !
            </div>
            <Link href="/login" style={{ display: 'block', textAlign: 'center', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={{ padding: 12, background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 500 }}>Nouveau mot de passe</label>
              <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 500 }}>Confirmer le mot de passe</label>
              <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

export default function ProfilPage() {
  const { user } = useAuth();
  const { toast } = useApp();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast('Non connecte', 'error'); return; }
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('Tous les champs sont requis', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Les nouveaux mots de passe ne correspondent pas', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('Le mot de passe doit faire au moins 6 caracteres', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast('Mot de passe modifie avec succes', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast(data.error || 'Erreur', 'error');
      }
    } catch {
      toast('Erreur reseau', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="page-header"><h1 className="page-title">Profil</h1></div>
        <p>Veuillez vous connecter pour acceder a cette page.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Profil</h1></div>
      <div className="int-detail-grid">
        <div className="int-detail-card">
          <div className="int-detail-card-title">Informations</div>
          <div className="int-detail-row"><span className="int-detail-label">Nom</span><span className="int-detail-value">{user.nom}</span></div>
          <div className="int-detail-row"><span className="int-detail-label">Email</span><span className="int-detail-value">{user.email}</span></div>
          <div className="int-detail-row"><span className="int-detail-label">Login</span><span className="int-detail-value">{user.login}</span></div>
          <div className="int-detail-row"><span className="int-detail-label">Role</span><span className="int-detail-value">{user.role}</span></div>
        </div>
        <div className="int-detail-card">
          <div className="int-detail-card-title">Changer le mot de passe</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Ancien mot de passe</label>
              <input className="form-input" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Modification...' : 'Modifier le mot de passe'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import Store from '@/lib/store';
import { COMPANY_DEFAULT, SAGE_X3_CONFIG } from '@/lib/config';
import { ROLES, getRoleName } from '@/lib/roles';
import { getPoleName, getAtelierName } from '@/lib/utils';
import { getConnectionStatus } from '@/lib/sage-x3';
import { useData } from '@/contexts/DataContext';
import type { User, Pole, Atelier, Cause, CompanyInfo, RoleId } from '@/lib/types';

type Tab = 'entreprise' | 'users' | 'poles' | 'ateliers' | 'causes' | 'sage' | 'systeme';

const TABS: { id: Tab; label: string }[] = [
  { id: 'entreprise', label: 'Entreprise' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'poles', label: 'Poles' },
  { id: 'ateliers', label: 'Ateliers' },
  { id: 'causes', label: 'Causes' },
  { id: 'sage', label: 'Sage X3' },
  { id: 'systeme', label: 'Systeme' },
];

export default function ParametragePage() {
  const { hasPermission } = useAuth();
  const { toast } = useApp();
  const { refreshAll } = useData();
  const [tab, setTab] = useState<Tab>('entreprise');
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [, setTick] = useState(0);
  const [company, setCompany] = useState<CompanyInfo>(Store.get<CompanyInfo>('company_info') || COMPANY_DEFAULT);
  const [exportJson, setExportJson] = useState('');
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  // --- ENTREPRISE ---
  if (tab === 'entreprise') {
    const save = () => {
      const c: CompanyInfo = { nom: gv('ce_nom') || company.nom, adresse: gv('ce_adr') || company.adresse, tel: gv('ce_tel') || company.tel, email: gv('ce_email') || company.email, logo_text: gv('ce_logo') || company.logo_text };
      Store.set('company_info', c); setCompany(c); toast('Informations entreprise sauvegardees', 'success');
    };
    return (<>
      <TabBar tab={tab} setTab={setTab} />
      <div className="int-detail-card" style={{ maxWidth: 700 }}>
        <div className="int-detail-card-title">🏢 Informations Entreprise</div>
        <div className="form-group"><label className="form-label">Nom</label><input className="form-input" id="ce_nom" defaultValue={company.nom} /></div>
        <div className="form-group"><label className="form-label">Adresse</label><input className="form-input" id="ce_adr" defaultValue={company.adresse} /></div>
        <div className="form-row"><div className="form-group"><label className="form-label">Telephone</label><input className="form-input" id="ce_tel" defaultValue={company.tel} /></div><div className="form-group"><label className="form-label">Email</label><input className="form-input" id="ce_email" defaultValue={company.email} /></div></div>
        <div className="form-group"><label className="form-label">Logo (texte)</label><input className="form-input" id="ce_logo" defaultValue={company.logo_text} /></div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save}>💾 Sauvegarder</button>
      </div>
    </>);
  }

  // --- USERS ---
  if (tab === 'users') {
    const users = Store.getAll<User>('users');
    const roles = Object.values(ROLES);
    const poles = Store.getAll<Pole>('poles');

    const saveUser = () => {
      const nom = gv('uf_nom'), login = gv('uf_login'), email = gv('uf_email'), role = gv('uf_role') as RoleId, password = gv('uf_password');
      if (!nom || !login || !role || !email) { toast('Nom, login, email et role requis', 'error'); return; }
      const userData: any = { id: editId || Store.generateId('usr'), nom, login, email, role, pole_id: gv('uf_pole') || null, actif: true };
      if (password) userData.password = password;
      Store.upsert('users', userData as User);
      toast(editId ? 'Modifie' : 'Cree', 'success'); setShowModal(false); setEditId(null); refresh();
    };
    const del = (id: string) => { Store.deleteById('users', id); toast('Supprime', 'success'); refresh(); };

    return (<>
      <TabBar tab={tab} setTab={setTab} />
      <div className="int-toolbar"><div /><button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setShowModal(true); }}>➕ Utilisateur</button></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Nom</th><th>Email</th><th>Login</th><th>Role</th><th>Pole</th><th>Actif</th><th>Actions</th></tr></thead><tbody>
        {users.map((u) => (
          <tr key={u.id}><td><div className="param-user-card" style={{ padding: 0, border: 'none' }}><div className="param-user-avatar">{u.nom.split(' ').map((w) => w[0]).join('').substring(0, 2)}</div><div className="param-user-info"><div className="param-user-name">{u.nom}</div></div></div></td>
          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{u.email}</td><td style={{ fontFamily: 'var(--font-mono)' }}>{u.login}</td><td><span className="badge badge-blue">{getRoleName(u.role)}</span></td><td>{u.pole_id ? getPoleName(u.pole_id) : 'Tous'}</td>
          <td>{u.actif ? <span className="badge badge-green">Oui</span> : <span className="badge badge-red">Non</span>}</td>
          <td><div style={{ display: 'flex', gap: 4 }}><button className="btn-icon" onClick={() => { setEditId(u.id); setShowModal(true); }}>✏</button><button className="btn-icon" onClick={() => del(u.id)}>🗑</button></div></td></tr>
        ))}
      </tbody></table></div>
      {showModal && (() => {
        const u = editId ? Store.findById<User>('users', editId) : null;
        return <Modal isOpen={true} title={u ? 'Modifier ' + u.nom : 'Nouvel utilisateur'} onClose={() => { setShowModal(false); setEditId(null); }} onConfirm={saveUser}>
          <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" id="uf_nom" defaultValue={u?.nom || ''} /></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-input" id="uf_email" type="email" defaultValue={u?.email || ''} /></div>
          <div className="form-row"><div className="form-group"><label className="form-label">Login *</label><input className="form-input" id="uf_login" defaultValue={u?.login || ''} /></div><div className="form-group"><label className="form-label">Mot de passe {u ? '' : '*'}</label><input className="form-input" id="uf_password" type="password" placeholder={u ? 'Laisser vide pour ne pas changer' : ''} /></div></div>
          <div className="form-row"><div className="form-group"><label className="form-label">Role *</label><select className="form-select" id="uf_role" defaultValue={u?.role || ''}><option value="">--</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Pole</label><select className="form-select" id="uf_pole" defaultValue={u?.pole_id || ''}><option value="">Tous</option>{poles.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></div></div>
        </Modal>;
      })()}
    </>);
  }

  // --- GENERIC LIST TABS ---
  const genericTabs: Record<string, { collection: string; fields: { key: string; label: string; type?: string; ref?: { collection: string; labelKey: string } }[]; title: string }> = {
    poles: { collection: 'poles', title: 'Poles', fields: [{ key: 'nom', label: 'Nom' }, { key: 'code', label: 'Code' }] },
    ateliers: { collection: 'ateliers', title: 'Ateliers', fields: [{ key: 'nom', label: 'Nom' }, { key: 'pole_id', label: 'Pole', type: 'select', ref: { collection: 'poles', labelKey: 'nom' } }] },
    causes: { collection: 'causes', title: 'Causes', fields: [{ key: 'nom', label: 'Nom' }, { key: 'categorie', label: 'Categorie' }] },
  };

  if (genericTabs[tab]) {
    const cfg = genericTabs[tab];
    const items = Store.getAll<any>(cfg.collection);

    const saveItem = () => {
      const obj: any = { id: editId || Store.generateId(tab.substring(0, 4)) };
      cfg.fields.forEach((f) => { obj[f.key] = gv('gf_' + f.key); });
      if (!obj[cfg.fields[0].key]) { toast('Premier champ requis', 'error'); return; }
      Store.upsert(cfg.collection, obj); toast('Sauvegarde', 'success'); setShowModal(false); setEditId(null); refresh();
    };
    const del = (id: string) => { Store.deleteById(cfg.collection, id); toast('Supprime', 'success'); refresh(); };

    return (<>
      <TabBar tab={tab} setTab={setTab} />
      <div className="int-toolbar"><div className="data-table-title">{cfg.title} ({items.length})</div><button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setShowModal(true); }}>➕ Ajouter</button></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr>{cfg.fields.map((f) => <th key={f.key}>{f.label}</th>)}<th>Actions</th></tr></thead><tbody>
        {items.map((item: any) => (
          <tr key={item.id}>{cfg.fields.map((f) => {
            let val = item[f.key];
            if (f.ref) { const ref = Store.findById<any>(f.ref.collection, val); val = ref?.[f.ref.labelKey] || val; }
            return <td key={f.key}>{val || '-'}</td>;
          })}<td><div style={{ display: 'flex', gap: 4 }}><button className="btn-icon" onClick={() => { setEditId(item.id); setShowModal(true); }}>✏</button><button className="btn-icon" onClick={() => del(item.id)}>🗑</button></div></td></tr>
        ))}
      </tbody></table></div>
      {showModal && (() => {
        const item = editId ? Store.findById<any>(cfg.collection, editId) : null;
        return <Modal isOpen={true} title={item ? 'Modifier' : 'Ajouter'} onClose={() => { setShowModal(false); setEditId(null); }} onConfirm={saveItem}>
          {cfg.fields.map((f) => {
            if (f.type === 'select' && f.ref) {
              const opts = Store.getAll<any>(f.ref.collection);
              return <div key={f.key} className="form-group"><label className="form-label">{f.label}</label><select className="form-select" id={'gf_' + f.key} defaultValue={item?.[f.key] || ''}><option value="">--</option>{opts.map((o: any) => <option key={o.id} value={o.id}>{o[f.ref!.labelKey]}</option>)}</select></div>;
            }
            
            return <div key={f.key} className="form-group"><label className="form-label">{f.label}</label><input className="form-input" id={'gf_' + f.key} defaultValue={item?.[f.key] || ''} /></div>;
          })}
        </Modal>;
      })()}
    </>);
  }

  // --- SAGE X3 ---
  if (tab === 'sage') {
    const status = getConnectionStatus();
    return (<>
      <TabBar tab={tab} setTab={setTab} />
      <div className="int-detail-card" style={{ maxWidth: 700 }}>
        <div className="int-detail-card-title">🔗 Connecteur Sage X3</div>
        <div style={{ background: status.enabled ? 'var(--accent-green-dim)' : 'var(--accent-orange-dim)', border: '1px solid ' + (status.enabled ? 'var(--accent-green)' : 'var(--accent-orange)'), borderRadius: 'var(--radius)', padding: 14, marginBottom: 20 }}>
          <strong>{status.enabled ? '✓ Actif' : '⏸ Desactive'}</strong> — Mode {status.enabled ? 'Sage X3' : 'localStorage'}
        </div>
        {[['API URL', status.api_url], ['Mirror DB', status.mirror_url], ['Company', status.company], ['Site', status.site], ['Tables mappees', status.tables_mapped]].map(([l, v]) => (
          <div key={l as string} className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{String(v)}</span></div>
        ))}
        <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-input)', borderRadius: 'var(--radius)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          <strong>Architecture Mirror Database :</strong><br />
          MaintPro ne requete jamais la base Sage X3 en production.<br />
          ETL (n8n, Talend) synchronise vers un datamart intermediaire.<br />
          Flux : Sage X3 (prod) → ETL → Datamart → MaintPro (lecture)<br />
          MaintPro (ecriture) → API Backend → Sage X3 (prod)
        </div>
      </div>
    </>);
  }

  // --- SYSTEME ---
  if (tab === 'systeme') {
    const exportData = () => {
      const data: Record<string, any> = {};
      ['users','poles','ateliers','techniciens','operateurs','chefs_atelier','machines','organes','causes','pieces','interventions','actions','stock_movements','demandes_achat','sous_traitances','taches_preventives','signalements','company_info'].forEach((k) => { data[k] = Store.get(k); });
      setExportJson(JSON.stringify(data, null, 2));
    };

    const resetAll = async () => {
      if (!confirm('Reinitialiser toutes les donnees ? Cela va re-peupler la base PostgreSQL.')) return;
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();
        if (data.seeded) {
          toast('Base de donnees reinitialisee avec succes', 'success');
          await refreshAll();
          window.location.reload();
        } else {
          toast(data.message || 'Donnees deja presentes', 'info');
        }
      } catch {
        toast('Erreur lors de la reinitialisation', 'error');
      }
    };

    return (<>
      <TabBar tab={tab} setTab={setTab} />
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">📊 Informations</div>
          <div className="int-detail-row"><span className="int-detail-label">Stockage</span><span className="int-detail-value">PostgreSQL (distant)</span></div>
          <div className="int-detail-row"><span className="int-detail-label">Version</span><span className="int-detail-value">MaintPro v3+</span></div>
        </div>
        <div className="int-detail-card"><div className="int-detail-card-title">⚠ Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={exportData}>📤 Exporter (JSON)</button>
            <button className="btn btn-danger btn-sm" onClick={resetAll}>🔄 Reinitialiser donnees demo</button>
          </div>
        </div>
      </div>
      {exportJson && <div className="int-detail-card" style={{ marginTop: 16 }}><div className="int-detail-card-title">📤 Export JSON</div><textarea className="form-textarea" value={exportJson} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', minHeight: 200 }} /></div>}
    </>);
  }

  return <TabBar tab={tab} setTab={setTab} />;
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="param-tabs">
      {TABS.map((t) => <div key={t.id} className={'param-tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</div>)}
    </div>
  );
}

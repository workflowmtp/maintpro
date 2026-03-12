'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge, CriticiteBadge } from '@/components/ui/Badge';
import Store from '@/lib/store';
import { formatDate, formatMoney, getPoleName, getAtelierName, filterByPole, getUsersByRole } from '@/lib/utils';
import type { Machine, Intervention, Piece, Organe, TachePreventive, Pole, Atelier, User } from '@/lib/types';

type View = 'grid' | 'detail' | 'form';

export default function MachinesPage() {
  const { hasPermission } = useAuth();
  const { activePole, toast } = useApp();
  const [view, setView] = useState<View>('grid');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCrit, setFilterCrit] = useState('all');
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  if (view === 'grid') {
    let machines = filterByPole(Store.getAll<Machine>('machines'), activePole);
    if (search) { const s = search.toLowerCase(); machines = machines.filter((m) => m.nom.toLowerCase().includes(s) || m.code.toLowerCase().includes(s)); }
    if (filterCrit !== 'all') machines = machines.filter((m) => m.criticite === filterCrit);
    const all = Store.getAll<Machine>('machines');
    const panne = all.filter((m) => m.etat === 'En panne').length;

    return (<>
      <div className="int-toolbar">
        <div className="int-toolbar-left">
          <input className="int-search" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="int-filter-select" value={filterCrit} onChange={(e) => setFilterCrit(e.target.value)}><option value="all">Toutes</option><option value="Critique">Critique</option><option value="Important">Important</option><option value="Standard">Standard</option></select>
        </div>
        <div className="int-toolbar-right">{hasPermission('parametrage_edit') && <button className="btn btn-primary btn-sm" onClick={() => { setCurrentId(null); setView('form'); }}>➕ Machine</button>}</div>
      </div>
      <div className="int-stats-bar">
        <div className="int-stat"><span className="int-stat-val">{all.length}</span><span className="int-stat-label">Machines</span></div>
        <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-red)' }}>{panne}</span><span className="int-stat-label">En panne</span></div>
        <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-green)' }}>{all.length - panne}</span><span className="int-stat-label">En service</span></div>
      </div>
      <div className="mach-grid">
        {machines.map((m) => (
          <div key={m.id} className="mach-card" onClick={() => { setCurrentId(m.id); setView('detail'); }}>
            <div className="mach-card-header">
              <div><div className="mach-card-name">{m.nom}</div><div className="mach-card-code">{m.code}</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>{m.etat === 'En panne' ? <span className="badge badge-red">En panne</span> : <span className="badge badge-green">En service</span>}<CriticiteBadge criticite={m.criticite} /></div>
            </div>
            <div className="mach-card-stats">
              <span className="mach-card-stat-label">Pole</span><span className="mach-card-stat-val">{getPoleName(m.pole_id)}</span>
              <span className="mach-card-stat-label">Dispo</span><span className="mach-card-stat-val" style={{ color: m.disponibilite >= 90 ? 'var(--accent-green)' : m.disponibilite >= 75 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>{m.disponibilite}%</span>
              <span className="mach-card-stat-label">Heures</span><span className="mach-card-stat-val" style={{ fontFamily: 'var(--font-mono)' }}>{m.heures_courantes.toLocaleString()} h</span>
            </div>
            {m.techniciens_affectes?.length > 0 && <div className="mach-card-team">{m.techniciens_affectes.map((ta, i) => {
              const tech = Store.findById<User>('users', ta.technicien_id);
              const cls = 'mach-team-tag' + (ta.specialite === 'Mecanique' ? ' mec' : ta.specialite === 'Electricite' ? ' elec' : ' poly');
              return <span key={i} className={cls}>{tech?.nom.split(' ')[0] || '?'} ({ta.role})</span>;
            })}</div>}
          </div>
        ))}
      </div>
    </>);
  }

  if (view === 'detail' && currentId) {
    const m = Store.findById<Machine>('machines', currentId);
    if (!m) { setView('grid'); return null; }
    const chef = m.chef_atelier_id ? Store.findById<User>('users', m.chef_atelier_id) : null;
    const ints = Store.getAll<Intervention>('interventions').filter((it) => it.machine_id === m.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const pcs = Store.getAll<Piece>('pieces').filter((p) => p.machine_id === m.id);
    const orgs = Store.getAll<Organe>('organes').filter((o) => o.machine_id === m.id);
    const nbCur = ints.filter((i) => i.type === 'Curatif').length;
    let cost = 0; ints.forEach((i) => i.pieces_utilisees?.forEach((pu) => { const pc = Store.findById<Piece>('pieces', pu.piece_id); if (pc) cost += pc.prix_unitaire * pu.quantite; }));
    const dispoColor = m.disponibilite >= 90 ? 'var(--accent-green)' : m.disponibilite >= 75 ? 'var(--accent-orange)' : 'var(--accent-red)';
    const DR = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value">{v}</span></div>;

    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('grid')}>← Retour</button>
        <div><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{m.nom}</div><div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{m.code}</div></div>
        {m.etat === 'En panne' ? <span className="badge badge-red">En panne</span> : <span className="badge badge-green">En service</span>} <CriticiteBadge criticite={m.criticite} />
      </div>
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">⚙ Fiche</div><DR l="Pole" v={getPoleName(m.pole_id)} /><DR l="Atelier" v={getAtelierName(m.atelier_id)} /><DR l="Chef" v={chef?.nom || '-'} /><DR l="H prevues/mois" v={m.heures_prevues_mois + ' h'} /><DR l="H courantes" v={m.heures_courantes.toLocaleString() + ' h'} />{m.tours_courants > 0 && <DR l="Tours" v={m.tours_courants.toLocaleString()} />}</div>
        <div className="int-detail-card"><div className="int-detail-card-title">📊 KPI</div><div className="mach-dispo-ring" style={{ border: '4px solid ' + dispoColor, color: dispoColor }}>{m.disponibilite}%</div><div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Disponibilite</div><DR l="Interventions" v={ints.length} /><DR l="Curatives" v={nbCur} /><DR l="Cout maint." v={formatMoney(cost)} /></div>
      </div>
      {m.techniciens_affectes?.length > 0 && <div className="mach-detail-section"><div className="mach-detail-section-title">👥 Equipe</div><div className="mach-detail-section-body">{m.techniciens_affectes.map((aff, i) => { const t = Store.findById<User>('users', aff.technicien_id); return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span className={'mach-team-tag' + (aff.specialite === 'Mecanique' ? ' mec' : aff.specialite === 'Electricite' ? ' elec' : ' poly')}>{aff.specialite}</span><strong>{t?.nom || '?'}</strong><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{aff.role}</span></div>; })}</div></div>}
      {orgs.length > 0 && <div className="mach-detail-section"><div className="mach-detail-section-title">🔧 Organes ({orgs.length})</div><div className="mach-detail-section-body">{orgs.map((o) => <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}><strong>{o.nom}</strong><span className="badge badge-blue">{o.type}</span></div>)}</div></div>}
      {pcs.length > 0 && <div className="mach-detail-section"><div className="mach-detail-section-title">📦 Pieces ({pcs.length})</div><div className="mach-detail-section-body">{pcs.map((p) => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}><div><strong>{p.ref}</strong> - {p.designation}</div><div style={{ display: 'flex', gap: 8 }}><span style={{ fontFamily: 'var(--font-mono)' }}>Stock: {p.stock_actuel}/{p.seuil_reappro}</span>{p.stock_actuel === 0 ? <span className="badge badge-red">RUPTURE</span> : p.stock_actuel <= p.seuil_reappro ? <span className="badge badge-orange">BAS</span> : <span className="badge badge-green">OK</span>}</div></div>)}</div></div>}
      <div className="mach-detail-section"><div className="mach-detail-section-title">📅 Historique ({Math.min(ints.length, 10)})</div><div className="mach-detail-section-body">{ints.slice(0, 10).map((it) => <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}><strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{it.ref}</strong>{it.type === 'Curatif' ? <span className="badge badge-orange">Cur</span> : <span className="badge badge-green">Prev</span>}<StatusBadge statut={it.statut} /><span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDate(it.date)}</span></div>)}</div></div>
    </>);
  }

  // FORM
  const m = currentId ? Store.findById<Machine>('machines', currentId) : null;
  const isNew = !m;
  const poles = Store.getAll<Pole>('poles'); const ateliers = Store.getAll<Atelier>('ateliers'); const chefs = getUsersByRole('chef_atelier');
  const save = () => {
    const nom = gv('mf_nom'); if (!nom) { toast('Nom requis', 'error'); return; }
    Store.upsert('machines', { id: m?.id || Store.generateId('mach'), nom, code: gv('mf_code'), pole_id: gv('mf_pole'), atelier_id: gv('mf_atelier'), criticite: (gv('mf_crit') || 'Standard') as any, etat: (gv('mf_etat') || 'En service') as any, chef_atelier_id: gv('mf_chef'), disponibilite: parseInt(gv('mf_dispo')) || 100, heures_prevues_mois: parseInt(gv('mf_hpm')) || 0, heures_courantes: parseInt(gv('mf_hc')) || 0, tours_courants: parseInt(gv('mf_tc')) || 0, techniciens_affectes: m?.techniciens_affectes || [] } as Machine);
    toast(isNew ? 'Machine creee' : 'Modifiee', 'success'); setView('grid');
  };
  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('grid')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{isNew ? 'Nouvelle machine' : 'Modifier ' + m?.nom}</span></div>
    <div className="int-detail-card" style={{ maxWidth: 900 }}>
      <div className="form-row"><div className="form-group"><label className="form-label">Nom *</label><input className="form-input" id="mf_nom" defaultValue={m?.nom || ''} /></div><div className="form-group"><label className="form-label">Code</label><input className="form-input" id="mf_code" defaultValue={m?.code || ''} /></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label">Pole</label><select className="form-select" id="mf_pole" defaultValue={m?.pole_id || ''}><option value="">--</option>{poles.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Atelier</label><select className="form-select" id="mf_atelier" defaultValue={m?.atelier_id || ''}><option value="">--</option>{ateliers.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}</select></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label">Criticite</label><select className="form-select" id="mf_crit" defaultValue={m?.criticite || 'Standard'}><option value="Critique">Critique</option><option value="Important">Important</option><option value="Standard">Standard</option></select></div><div className="form-group"><label className="form-label">Etat</label><select className="form-select" id="mf_etat" defaultValue={m?.etat || 'En service'}><option value="En service">En service</option><option value="En panne">En panne</option></select></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label">Chef</label><select className="form-select" id="mf_chef" defaultValue={m?.chef_atelier_id || ''}><option value="">--</option>{chefs.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Dispo (%)</label><input className="form-input" type="number" id="mf_dispo" defaultValue={m?.disponibilite || 100} /></div></div>
      <div className="form-row-3"><div className="form-group"><label className="form-label">H prevues/mois</label><input className="form-input" type="number" id="mf_hpm" defaultValue={m?.heures_prevues_mois || ''} /></div><div className="form-group"><label className="form-label">H courantes</label><input className="form-input" type="number" id="mf_hc" defaultValue={m?.heures_courantes || ''} /></div><div className="form-group"><label className="form-label">Tours</label><input className="form-input" type="number" id="mf_tc" defaultValue={m?.tours_courants || ''} /></div></div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={save}>💾 {isNew ? 'Creer' : 'Enregistrer'}</button><button className="btn btn-outline" onClick={() => setView('grid')}>Annuler</button></div>
    </div>
  </>);
}

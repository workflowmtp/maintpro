'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import Store from '@/lib/store';
import { formatDate, formatMoney, getPoleName, getMachineName, filterByPole } from '@/lib/utils';
import type { SousTraitance, Machine, Intervention, Pole } from '@/lib/types';

type View = 'list' | 'detail' | 'form';

export default function SousTraitancePage() {
  const { hasPermission } = useAuth();
  const { activePole, toast } = useApp();
  const [view, setView] = useState<View>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState('all');
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  if (view === 'list') {
    let sts = filterByPole(Store.getAll<SousTraitance>('sous_traitances'), activePole);
    if (filterStatut !== 'all') sts = sts.filter((s) => s.statut === filterStatut);
    sts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allSts = Store.getAll<SousTraitance>('sous_traitances');
    const totalMontant = allSts.reduce((s, st) => s + (st.montant || 0), 0);
    const enCours = allSts.filter((s) => s.statut === 'En cours').length;
    const terminees = allSts.filter((s) => s.statut === 'Terminee').length;

    return (<>
      <div className="int-toolbar">
        <div className="int-toolbar-left"><select className="int-filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}><option value="all">Tous</option>{['Demandee', 'Validee', 'En cours', 'Terminee', 'Annulee'].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div className="int-toolbar-right">{hasPermission('st_create') && <button className="btn btn-primary" onClick={() => { setCurrentId(null); setView('form'); }}>➕ Nouvelle ST</button>}</div>
      </div>
      <div className="st-stats">
        {[{ v: allSts.length, l: 'Total', c: 'var(--accent-blue)' }, { v: enCours, l: 'En cours', c: 'var(--accent-orange)' }, { v: terminees, l: 'Terminees', c: 'var(--accent-green)' }, { v: formatMoney(totalMontant), l: 'Montant', c: 'var(--accent-purple)' }].map((s, i) => (
          <div key={i} className="stock-summary-card"><div className="stock-summary-val" style={{ color: s.c }}>{s.v}</div><div className="stock-summary-lbl">{s.l}</div></div>
        ))}
      </div>
      {sts.length === 0 ? <div className="alert-empty">Aucune sous-traitance</div> : sts.map((st) => (
        <div key={st.id} className="st-card">
          <div className="st-card-header">
            <div><span className="st-card-ref">{st.ref}</span><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{st.objet}</div></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><StatusBadge statut={st.statut} /><button className="btn-icon" onClick={() => { setCurrentId(st.id); setView('detail'); }}>👁</button></div>
          </div>
          <div className="st-card-body">
            {[['Prestataire', st.prestataire], ['Machine', getMachineName(st.machine_id)], ['Montant', formatMoney(st.montant)], ['Debut', formatDate(st.date_debut_prevue)], ['Fin', formatDate(st.date_fin_prevue)]].map(([l, v]) => (
              <div key={l as string} className="st-card-row"><span className="st-card-label">{l}</span><span className="st-card-value">{v}</span></div>
            ))}
          </div>
        </div>
      ))}
    </>);
  }

  if (view === 'detail' && currentId) {
    const st = Store.findById<SousTraitance>('sous_traitances', currentId);
    if (!st) { setView('list'); return null; }
    const DR = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value">{v}</span></div>;
    const transitions: Record<string, [string, string][]> = { 'Demandee': [['Validee', 'Valider'], ['Annulee', 'Annuler']], 'Validee': [['En cours', 'Demarrer'], ['Annulee', 'Annuler']], 'En cours': [['Terminee', 'Terminer'], ['Annulee', 'Annuler']] };
    const changeSt = (ns: string) => { st.statut = ns as any; Store.upsert('sous_traitances', st); toast('ST → ' + ns, 'success'); refresh(); };

    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>{st.ref}</span><StatusBadge statut={st.statut} /></div>
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">💼 Infos</div><DR l="Ref" v={st.ref} /><DR l="Objet" v={st.objet} /><DR l="Machine" v={getMachineName(st.machine_id)} /><DR l="Pole" v={getPoleName(st.pole_id)} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">💰 Budget</div><DR l="Prestataire" v={st.prestataire} /><DR l="Contact" v={st.contact || '-'} /><DR l="Montant" v={formatMoney(st.montant)} /><DR l="BC" v={st.bon_commande || '-'} /><DR l="Debut" v={formatDate(st.date_debut_prevue)} /><DR l="Fin" v={formatDate(st.date_fin_prevue)} /></div>
      </div>
      {st.observations && <div className="int-detail-card" style={{ marginTop: 16 }}><div className="int-detail-card-title">📝 Observations</div><div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{st.observations}</div></div>}
      {hasPermission('st_edit') && <div className="int-detail-card" style={{ marginTop: 16 }}><div className="int-detail-card-title">⚙ Actions</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(transitions[st.statut] || []).map(([ns, label]) => <button key={ns} className={ns === 'Annulee' ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm'} onClick={() => changeSt(ns)}>{label}</button>)}
        <button className="btn btn-outline btn-sm" onClick={() => setView('form')}>✏ Modifier</button>
      </div></div>}
    </>);
  }

  // FORM
  const st = currentId ? Store.findById<SousTraitance>('sous_traitances', currentId) : null;
  const isNew = !st;
  const machines = Store.getAll<Machine>('machines'); const interventions = Store.getAll<Intervention>('interventions'); const poles = Store.getAll<Pole>('poles');
  const save = () => {
    const presta = gv('st_presta'), objet = gv('st_objet');
    if (!presta || !objet) { toast('Prestataire et objet requis', 'error'); return; }
    const obj: SousTraitance = { id: st?.id || Store.generateId('st'), ref: st?.ref || ('ST-' + new Date().getFullYear() + '-' + ('000' + (Store.getAll<SousTraitance>('sous_traitances').length + 1)).slice(-3)), date: st?.date || new Date().toISOString(), pole_id: gv('st_pole'), prestataire: presta, contact: gv('st_contact'), objet, machine_id: gv('st_mach'), intervention_id: gv('st_int'), montant: parseInt(gv('st_montant')) || 0, date_debut_prevue: gv('st_deb'), date_fin_prevue: gv('st_fin'), bon_commande: gv('st_bc'), statut: st?.statut || 'Demandee' as any, observations: gv('st_obs') };
    Store.upsert('sous_traitances', obj); toast(isNew ? 'ST creee' : 'ST modifiee', 'success'); setView('list');
  };
  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{isNew ? 'Nouvelle ST' : 'Modifier ' + st?.ref}</span></div>
    <div className="int-detail-card" style={{ maxWidth: 900 }}>
      <div className="form-row"><div className="form-group"><label className="form-label">Prestataire *</label><input className="form-input" id="st_presta" defaultValue={st?.prestataire || ''} /></div><div className="form-group"><label className="form-label">Contact</label><input className="form-input" id="st_contact" defaultValue={st?.contact || ''} /></div></div>
      <div className="form-group"><label className="form-label">Objet *</label><textarea className="form-textarea" id="st_objet" defaultValue={st?.objet || ''} /></div>
      <div className="form-row"><div className="form-group"><label className="form-label">Pole</label><select className="form-select" id="st_pole" defaultValue={st?.pole_id || ''}><option value="">--</option>{poles.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Machine</label><select className="form-select" id="st_mach" defaultValue={st?.machine_id || ''}><option value="">--</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label">Montant</label><input className="form-input" type="number" id="st_montant" defaultValue={st?.montant || ''} /></div><div className="form-group"><label className="form-label">BC</label><input className="form-input" id="st_bc" defaultValue={st?.bon_commande || ''} /></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label">Debut</label><input className="form-input" type="date" id="st_deb" defaultValue={st?.date_debut_prevue?.substring(0, 10) || ''} /></div><div className="form-group"><label className="form-label">Fin</label><input className="form-input" type="date" id="st_fin" defaultValue={st?.date_fin_prevue?.substring(0, 10) || ''} /></div></div>
      <div className="form-group"><label className="form-label">Intervention</label><select className="form-select" id="st_int" defaultValue={st?.intervention_id || ''}><option value="">--</option>{interventions.map((i) => <option key={i.id} value={i.id}>{i.ref}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Observations</label><textarea className="form-textarea" id="st_obs" defaultValue={st?.observations || ''} /></div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={save}>💾 {isNew ? 'Creer' : 'Enregistrer'}</button><button className="btn btn-outline" onClick={() => setView('list')}>Annuler</button></div>
    </div>
  </>);
}

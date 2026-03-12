'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import Store from '@/lib/store';
import { getMachineName, getTechName, getPoleName, filterByPole, formatMoney } from '@/lib/utils';
import type { Intervention, Machine, Technicien, Piece, Action, TachePreventive } from '@/lib/types';

export default function KPIPage() {
  const { activePole } = useApp();
  const [searchTech, setSearchTech] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ s0: true });

  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const interventions = filterByPole(Store.getAll<Intervention>('interventions'), activePole);
  const machines = filterByPole(Store.getAll<Machine>('machines'), activePole);
  const techs = Store.getAll<Technicien>('techniciens');
  const pieces = Store.getAll<Piece>('pieces');
  const actions = Store.getAll<Action>('actions');
  const tprevs = Store.getAll<TachePreventive>('taches_preventives');
  const completions = Store.get<Record<string, boolean>>('prev_completions') || {};

  // KPI Calculations
  const nbCur = interventions.filter((i) => i.type === 'Curatif').length;
  const nbPrev = interventions.filter((i) => i.type === 'Preventif').length;
  const totalDuree = interventions.reduce((s, i) => s + (i.duree_minutes || 0), 0);
  const mttr = nbCur > 0 ? Math.round(totalDuree / nbCur) : 0;
  const dispoMoy = machines.length > 0 ? Math.round(machines.reduce((s, m) => s + m.disponibilite, 0) / machines.length) : 0;
  const tauxPrev = interventions.length > 0 ? Math.round((nbPrev / interventions.length) * 100) : 0;
  const tauxCur = interventions.length > 0 ? Math.round((nbCur / interventions.length) * 100) : 0;
  const pannesRep = interventions.filter((i) => i.panne_repetitive).length;
  const actionsRetard = actions.filter((a) => a.statut === 'En retard').length;
  const stockAlerts = pieces.filter((p) => p.stock_actuel <= p.seuil_reappro).length;
  let coutTotal = 0;
  interventions.forEach((i) => i.pieces_utilisees?.forEach((pu) => { const pc = Store.findById<Piece>('pieces', pu.piece_id); if (pc) coutTotal += pc.prix_unitaire * pu.quantite; }));

  // Preventif completion
  const totalPrevTasks = Object.keys(completions).length;
  const donePrevTasks = Object.values(completions).filter(Boolean).length;
  const tauxRealPrev = tprevs.length > 0 ? Math.round((donePrevTasks / Math.max(tprevs.length, 1)) * 100) : 0;

  // Tech performance
  let techPerf = techs.map((t) => {
    const techInts = interventions.filter((i) => i.technicien_principal_id === t.id);
    const duree = techInts.reduce((s, i) => s + (i.duree_minutes || 0), 0);
    const terminees = techInts.filter((i) => i.statut === 'Termine' || i.statut === 'Valide production').length;
    return { id: t.id, nom: t.nom, specialite: t.specialite, pole: getPoleName(t.pole_id), nb: techInts.length, duree, terminees, score: terminees > 0 ? Math.min(100, Math.round((terminees / Math.max(techInts.length, 1)) * 100)) : 0 };
  }).sort((a, b) => b.nb - a.nb);
  if (searchTech) { const s = searchTech.toLowerCase(); techPerf = techPerf.filter((t) => t.nom.toLowerCase().includes(s) || t.specialite.toLowerCase().includes(s)); }

  // Machine ranking
  const machRank = machines.map((m) => {
    const mInts = interventions.filter((i) => i.machine_id === m.id);
    return { id: m.id, nom: m.nom, code: m.code, dispo: m.disponibilite, criticite: m.criticite, nbInts: mInts.length, nbCur: mInts.filter((i) => i.type === 'Curatif').length };
  }).sort((a, b) => b.nbInts - a.nbInts);

  const gaugeColor = (val: number, target: number, inverse: boolean = false) => {
    const ratio = inverse ? target / Math.max(val, 1) : val / Math.max(target, 1);
    return ratio >= 0.9 ? 'var(--accent-green)' : ratio >= 0.7 ? 'var(--accent-orange)' : 'var(--accent-red)';
  };

  const sections = [
    { key: 's0', title: '📊 KPI Globaux', icon: '📊' },
    { key: 's1', title: '⚙ Disponibilite Machines', icon: '⚙' },
    { key: 's2', title: '👥 Performance Techniciens', icon: '👥' },
    { key: 's3', title: '📅 Taux Preventif', icon: '📅' },
    { key: 's4', title: '📦 Stock & Couts', icon: '📦' },
    { key: 's5', title: '🏆 Classement Machines', icon: '🏆' },
  ];

  const Acc = ({ sk, title, children }: { sk: string; title: string; children: React.ReactNode }) => (
    <div className={'accord-section' + (openSections[sk] ? ' open' : '')}>
      <div className="accord-header" onClick={() => toggleSection(sk)}>
        <div className="accord-header-left">{title}</div>
        <span className="accord-chevron">▶</span>
      </div>
      <div className="accord-body"><div className="accord-body-inner">{children}</div></div>
    </div>
  );

  return (<>
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>KPI Maintenance</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Indicateurs de performance — {interventions.length} interventions analysees</div>
    </div>

    <Acc sk="s0" title="📊 KPI Globaux">
      <div className="kpi-gauge-grid">
        {[
          { label: 'Dispo. moyenne', val: dispoMoy, target: 95, unit: '%' },
          { label: 'MTTR', val: mttr, target: 120, unit: 'min', inv: true },
          { label: 'Taux preventif', val: tauxPrev, target: 60, unit: '%' },
          { label: 'Taux curatif', val: tauxCur, target: 40, unit: '%', inv: true },
          { label: 'Realisation prev.', val: tauxRealPrev, target: 90, unit: '%' },
          { label: 'Pannes repet.', val: pannesRep, target: 0, unit: '', inv: true },
        ].map((g, i) => {
          const col = g.inv ? gaugeColor(g.val, g.target, true) : gaugeColor(g.val, g.target);
          return (<div key={i} className="kpi-gauge">
            <div className="kpi-gauge-ring" style={{ borderColor: col, color: col }}>{g.val}{g.unit}</div>
            <div className="kpi-gauge-label">{g.label}</div>
            <div className="kpi-gauge-target">Cible: {g.target}{g.unit}</div>
          </div>);
        })}
      </div>
      <div className="kpi-score-card" style={{ marginTop: 16 }}>
        <div className="kpi-score-val" style={{ color: dispoMoy >= 90 ? 'var(--accent-green)' : dispoMoy >= 75 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>{dispoMoy}%</div>
        <div className="kpi-score-label">Indice Global Maintenance</div>
        <div className="kpi-score-bar"><div className="kpi-score-bar-fill" style={{ width: dispoMoy + '%', background: dispoMoy >= 90 ? 'var(--accent-green)' : dispoMoy >= 75 ? 'var(--accent-orange)' : 'var(--accent-red)' }} /></div>
      </div>
    </Acc>

    <Acc sk="s1" title="⚙ Disponibilite Machines">
      <div className="kpi-bar-chart">
        {machines.sort((a, b) => a.disponibilite - b.disponibilite).map((m) => {
          const col = m.disponibilite >= 90 ? 'var(--accent-green)' : m.disponibilite >= 75 ? 'var(--accent-orange)' : 'var(--accent-red)';
          return (<div key={m.id} className="kpi-bar-row">
            <div className="kpi-bar-label" title={m.nom}>{m.code || m.nom.substring(0, 15)}</div>
            <div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: m.disponibilite + '%', background: col }}>{m.disponibilite}%</div></div>
          </div>);
        })}
      </div>
    </Acc>

    <Acc sk="s2" title="👥 Performance Techniciens">
      <div style={{ marginBottom: 12 }}>
        <input className="int-search" placeholder="Rechercher technicien..." value={searchTech} onChange={(e) => setSearchTech(e.target.value)} style={{ maxWidth: 300 }} />
      </div>
      <div className="data-table-wrap" style={{ marginBottom: 0 }}>
        <table className="data-table kpi-eval-table"><thead><tr><th>Technicien</th><th>Specialite</th><th>Pole</th><th>Interventions</th><th>Terminees</th><th>Duree (min)</th><th>Score</th></tr></thead><tbody>
          {techPerf.map((t) => (
            <tr key={t.id}><td><strong>{t.nom}</strong></td><td><span className={'mach-team-tag' + (t.specialite === 'Mecanique' ? ' mec' : t.specialite === 'Electricite' ? ' elec' : ' poly')}>{t.specialite}</span></td><td>{t.pole}</td>
            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.nb}</td><td>{t.terminees}</td><td>{t.duree}</td>
            <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ flex: 1, height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: t.score + '%', height: '100%', borderRadius: 4, background: t.score >= 80 ? 'var(--accent-green)' : t.score >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)' }} /></div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>{t.score}%</span></div></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </Acc>

    <Acc sk="s3" title="📅 Taux Preventif">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="kpi-score-card"><div className="kpi-score-val" style={{ color: tauxPrev >= 60 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{tauxPrev}%</div><div className="kpi-score-label">Preventif / Total</div><div className="kpi-score-bar"><div className="kpi-score-bar-fill" style={{ width: tauxPrev + '%', background: 'var(--accent-green)' }} /></div></div>
        <div className="kpi-score-card"><div className="kpi-score-val" style={{ color: tauxCur <= 40 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{tauxCur}%</div><div className="kpi-score-label">Curatif / Total</div><div className="kpi-score-bar"><div className="kpi-score-bar-fill" style={{ width: tauxCur + '%', background: 'var(--accent-orange)' }} /></div></div>
      </div>
      <div className="kpi-bar-chart" style={{ marginTop: 16 }}>
        <div className="kpi-bar-row"><div className="kpi-bar-label">Preventives</div><div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: (interventions.length > 0 ? (nbPrev / interventions.length) * 100 : 0) + '%', background: 'var(--accent-green)' }}>{nbPrev}</div></div></div>
        <div className="kpi-bar-row"><div className="kpi-bar-label">Curatives</div><div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: (interventions.length > 0 ? (nbCur / interventions.length) * 100 : 0) + '%', background: 'var(--accent-orange)' }}>{nbCur}</div></div></div>
      </div>
    </Acc>

    <Acc sk="s4" title="📦 Stock & Couts">
      <div className="kpi-gauge-grid">
        <div className="kpi-gauge"><div className="kpi-gauge-ring" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>{pieces.length}</div><div className="kpi-gauge-label">References</div></div>
        <div className="kpi-gauge"><div className="kpi-gauge-ring" style={{ borderColor: stockAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)', color: stockAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{stockAlerts}</div><div className="kpi-gauge-label">Alertes stock</div></div>
        <div className="kpi-gauge"><div className="kpi-gauge-ring" style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', fontSize: '0.9rem' }}>{formatMoney(coutTotal)}</div><div className="kpi-gauge-label">Cout pieces</div></div>
        <div className="kpi-gauge"><div className="kpi-gauge-ring" style={{ borderColor: actionsRetard > 0 ? 'var(--accent-red)' : 'var(--accent-green)', color: actionsRetard > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{actionsRetard}</div><div className="kpi-gauge-label">Actions retard</div></div>
      </div>
    </Acc>

    <Acc sk="s5" title="🏆 Classement Machines">
      <div className="data-table-wrap" style={{ marginBottom: 0 }}>
        <table className="data-table"><thead><tr><th>#</th><th>Machine</th><th>Code</th><th>Criticite</th><th>Dispo</th><th>Interventions</th><th>Curatives</th></tr></thead><tbody>
          {machRank.map((m, i) => (
            <tr key={m.id}><td style={{ fontWeight: 700 }}>{i + 1}</td><td><strong>{m.nom}</strong></td><td style={{ fontFamily: 'var(--font-mono)' }}>{m.code}</td>
            <td>{m.criticite === 'Critique' ? <span className="badge badge-red">Critique</span> : m.criticite === 'Important' ? <span className="badge badge-orange">Important</span> : <span className="badge badge-blue">Standard</span>}</td>
            <td style={{ fontWeight: 700, color: m.dispo >= 90 ? 'var(--accent-green)' : m.dispo >= 75 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>{m.dispo}%</td>
            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.nbInts}</td><td style={{ color: m.nbCur > 2 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{m.nbCur}</td></tr>
          ))}
        </tbody></table>
      </div>
    </Acc>
  </>);
}

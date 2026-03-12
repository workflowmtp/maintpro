'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import Store from '@/lib/store';
import { formatDate, formatMoney, getPoleName, getMachineName, getTechName, filterByPole, getUsersByRole } from '@/lib/utils';
import type { Intervention, Machine, Piece, Action, DemandeAchat, SousTraitance, Signalement } from '@/lib/types';

type RapportId = 'synthese' | 'machines' | 'techniciens' | 'stock' | 'cout' | 'actions';

const RAPPORTS: { id: RapportId; icon: string; title: string; desc: string }[] = [
  { id: 'synthese', icon: '📊', title: 'Synthese mensuelle', desc: 'Resume global des interventions, KPI, alertes' },
  { id: 'machines', icon: '⚙', title: 'Rapport machines', desc: 'Etat, disponibilite, historique par machine' },
  { id: 'techniciens', icon: '👥', title: 'Rapport techniciens', desc: 'Performance, charge, interventions par technicien' },
  { id: 'stock', icon: '📦', title: 'Rapport stock', desc: 'Niveaux, alertes, mouvements, valorisation' },
  { id: 'cout', icon: '💰', title: 'Analyse couts', desc: 'Couts par pole, machine, type intervention' },
  { id: 'actions', icon: '⚠', title: 'Suivi actions', desc: 'Actions ouvertes, en retard, par priorite' },
];

export default function RapportsPage() {
  const { activePole } = useApp();
  const [selectedReport, setSelectedReport] = useState<RapportId | null>(null);

  const interventions = filterByPole(Store.getAll<Intervention>('interventions'), activePole);
  const machines = filterByPole(Store.getAll<Machine>('machines'), activePole);
  const techs = getUsersByRole('technicien');
  const pieces = Store.getAll<Piece>('pieces');
  const actions = Store.getAll<Action>('actions');
  const das = Store.getAll<DemandeAchat>('demandes_achat');
  const sts = Store.getAll<SousTraitance>('sous_traitances');
  const sigs = Store.getAll<Signalement>('signalements');

  const nbCur = interventions.filter((i) => i.type === 'Curatif').length;
  const nbPrev = interventions.filter((i) => i.type === 'Preventif').length;
  let coutTotal = 0;
  interventions.forEach((i) => i.pieces_utilisees?.forEach((pu) => { const pc = Store.findById<Piece>('pieces', pu.piece_id); if (pc) coutTotal += pc.prix_unitaire * pu.quantite; }));

  if (!selectedReport) {
    return (<>
      <div style={{ marginBottom: 20 }}><div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Rapports & Syntheses</div><div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Choisissez un rapport a generer</div></div>
      <div className="rapport-card-grid">
        {RAPPORTS.map((r) => (
          <div key={r.id} className="rapport-card" onClick={() => setSelectedReport(r.id)}>
            <div className="rapport-card-icon">{r.icon}</div>
            <div className="rapport-card-title">{r.title}</div>
            <div className="rapport-card-desc">{r.desc}</div>
          </div>
        ))}
      </div>
    </>);
  }

  const rDef = RAPPORTS.find((r) => r.id === selectedReport)!;
  const now = new Date();
  const mois = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const dateStr = mois[now.getMonth()] + ' ' + now.getFullYear();

  const renderContent = () => {
    if (selectedReport === 'synthese') {
      const dispoMoy = machines.length > 0 ? Math.round(machines.reduce((s, m) => s + m.disponibilite, 0) / machines.length) : 0;
      return (<div className="rapport-content">
        <h3>Interventions</h3><p>Total: <strong>{interventions.length}</strong> | Curatives: <strong>{nbCur}</strong> | Preventives: <strong>{nbPrev}</strong></p>
        <p>Taux preventif: <strong>{interventions.length > 0 ? Math.round((nbPrev / interventions.length) * 100) : 0}%</strong> (cible: 60%)</p>
        <h3>Disponibilite</h3><p>Moyenne: <strong>{dispoMoy}%</strong></p>
        <table><thead><tr><th>Machine</th><th>Dispo</th><th>Interventions</th></tr></thead><tbody>{machines.sort((a, b) => a.disponibilite - b.disponibilite).slice(0, 5).map((m) => <tr key={m.id}><td>{m.nom}</td><td>{m.disponibilite}%</td><td>{interventions.filter((i) => i.machine_id === m.id).length}</td></tr>)}</tbody></table>
        <h3>Signalements</h3><p>Total: <strong>{sigs.length}</strong> | Nouveaux: <strong>{sigs.filter((s) => s.statut === 'Nouveau').length}</strong></p>
        <h3>Alertes</h3><p>Stock critiques: <strong>{pieces.filter((p) => p.stock_actuel <= p.seuil_reappro).length}</strong> | Actions retard: <strong>{actions.filter((a) => a.statut === 'En retard').length}</strong> | Pannes repetitives: <strong>{interventions.filter((i) => i.panne_repetitive).length}</strong></p>
        <h3>Couts</h3><p>Cout pieces: <strong>{formatMoney(coutTotal)}</strong> | DA en attente: <strong>{das.filter((d) => d.statut === 'Soumise').length}</strong> ({formatMoney(das.filter((d) => d.statut === 'Soumise').reduce((s, d) => s + d.montant_estime, 0))})</p>
      </div>);
    }
    if (selectedReport === 'machines') {
      return (<div className="rapport-content"><table><thead><tr><th>Machine</th><th>Code</th><th>Pole</th><th>Etat</th><th>Dispo</th><th>Criticite</th><th>Heures</th></tr></thead><tbody>
        {machines.sort((a, b) => a.disponibilite - b.disponibilite).map((m) => <tr key={m.id}><td>{m.nom}</td><td>{m.code}</td><td>{getPoleName(m.pole_id)}</td><td>{m.etat}</td><td>{m.disponibilite}%</td><td>{m.criticite}</td><td>{m.heures_courantes.toLocaleString()}</td></tr>)}
      </tbody></table></div>);
    }
    if (selectedReport === 'techniciens') {
      return (<div className="rapport-content"><table><thead><tr><th>Technicien</th><th>Pole</th><th>Interventions</th><th>Duree (min)</th><th>Terminees</th></tr></thead><tbody>
        {techs.map((t) => { const tInts = interventions.filter((i) => i.technicien_principal_id === t.id); return <tr key={t.id}><td>{t.nom}</td><td>{getPoleName(t.pole_id)}</td><td>{tInts.length}</td><td>{tInts.reduce((s, i) => s + (i.duree_minutes || 0), 0)}</td><td>{tInts.filter((i) => i.statut === 'Termine' || i.statut === 'Valide production').length}</td></tr>; })}
      </tbody></table></div>);
    }
    if (selectedReport === 'stock') {
      const totalVal = pieces.reduce((s, p) => s + p.stock_actuel * p.prix_unitaire, 0);
      return (<div className="rapport-content">
        <p>References: <strong>{pieces.length}</strong> | Valeur: <strong>{formatMoney(totalVal)}</strong> | En rupture: <strong>{pieces.filter((p) => p.stock_actuel === 0).length}</strong> | Stock bas: <strong>{pieces.filter((p) => p.stock_actuel > 0 && p.stock_actuel <= p.seuil_reappro).length}</strong></p>
        <table><thead><tr><th>Ref</th><th>Designation</th><th>Stock</th><th>Seuil</th><th>Valeur</th><th>Fournisseur</th></tr></thead><tbody>
          {pieces.sort((a, b) => (a.stock_actuel / Math.max(a.seuil_reappro, 1)) - (b.stock_actuel / Math.max(b.seuil_reappro, 1))).map((p) => <tr key={p.id}><td>{p.ref}</td><td>{p.designation}</td><td>{p.stock_actuel}</td><td>{p.seuil_reappro}</td><td>{formatMoney(p.stock_actuel * p.prix_unitaire)}</td><td>{p.fournisseur || '-'}</td></tr>)}
        </tbody></table></div>);
    }
    if (selectedReport === 'cout') {
      const parPole: Record<string, number> = {};
      interventions.forEach((i) => { let c = 0; i.pieces_utilisees?.forEach((pu) => { const pc = Store.findById<Piece>('pieces', pu.piece_id); if (pc) c += pc.prix_unitaire * pu.quantite; }); parPole[i.pole_id] = (parPole[i.pole_id] || 0) + c; });
      const stMontant = sts.reduce((s, st) => s + (st.montant || 0), 0);
      return (<div className="rapport-content">
        <h3>Par pole</h3><table><thead><tr><th>Pole</th><th>Cout pieces</th></tr></thead><tbody>{Object.entries(parPole).map(([pid, c]) => <tr key={pid}><td>{getPoleName(pid)}</td><td>{formatMoney(c)}</td></tr>)}</tbody></table>
        <h3>Sous-traitance</h3><p>Montant total: <strong>{formatMoney(stMontant)}</strong> ({sts.length} contrats)</p>
        <h3>DA</h3><p>Montant total DA: <strong>{formatMoney(das.reduce((s, d) => s + d.montant_estime, 0))}</strong> ({das.length} demandes)</p>
        <h3>Total maintenance</h3><p><strong>{formatMoney(coutTotal + stMontant)}</strong> (pieces + sous-traitance)</p>
      </div>);
    }
    if (selectedReport === 'actions') {
      return (<div className="rapport-content"><table><thead><tr><th>Description</th><th>Priorite</th><th>Statut</th><th>Echeance</th><th>Responsable</th></tr></thead><tbody>
        {actions.sort((a, b) => { const ord: Record<string, number> = { 'En retard': 0, 'Ouverte': 1, 'En cours': 2, 'Terminee': 3 }; return (ord[a.statut] || 4) - (ord[b.statut] || 4); }).map((a) => <tr key={a.id}><td>{a.description.substring(0, 60)}</td><td>{a.priorite}</td><td>{a.statut}</td><td>{formatDate(a.echeance)}</td><td>{getTechName(a.responsable)}</td></tr>)}
      </tbody></table></div>);
    }
    return null;
  };

  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <button className="btn btn-outline btn-sm" onClick={() => setSelectedReport(null)}>← Retour</button>
      <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{rDef.icon} {rDef.title}</span>
      <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>🖨 Imprimer</button>
    </div>
    <div className="rapport-preview">
      <div className="rapport-preview-title">{rDef.icon} {rDef.title} — {dateStr}</div>
      {renderContent()}
    </div>
  </>);
}

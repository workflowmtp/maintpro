'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import Store from '@/lib/store';
import { formatDate, formatMoney, getPoleName, getMachineName, filterByPole } from '@/lib/utils';
import type { DemandeAchat, Machine, Piece, Intervention, Pole, Signalement } from '@/lib/types';

type View = 'list' | 'detail' | 'form';

export default function DAPage() {
  const { hasPermission } = useAuth();
  const auth = useAuth();
  const { activePole, toast } = useApp();
  const [view, setView] = useState<View>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState('all');
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  const statuts = ['Brouillon', 'Soumise', 'Validee', 'Commandee', 'Receptionnee', 'Refusee'];

  if (view === 'list') {
    let das = filterByPole(Store.getAll<DemandeAchat>('demandes_achat'), activePole);
    if (filterStatut !== 'all') das = das.filter((d) => d.statut === filterStatut);
    das.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allDas = Store.getAll<DemandeAchat>('demandes_achat');
    const counts: Record<string, number> = {}; statuts.forEach((s) => counts[s] = 0); allDas.forEach((d) => { if (counts[d.statut] !== undefined) counts[d.statut]++; });
    const totalMontant = das.reduce((s, d) => s + (d.montant_estime || 0), 0);

    return (<>
      <div className="int-toolbar">
        <div className="int-toolbar-left">
          <select className="int-filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}><option value="all">Tous</option>{statuts.map((s) => <option key={s} value={s}>{s} ({counts[s]})</option>)}</select>
        </div>
        <div className="int-toolbar-right">
          {hasPermission('da_create') && <button className="btn btn-primary" onClick={() => { setCurrentId(null); setView('form'); }}>➕ Nouvelle DA</button>}
        </div>
      </div>
      <div className="da-workflow-bar">{statuts.map((s) => <div key={s} className={'da-wf-step' + (filterStatut === s ? ' active' : '')} style={{ cursor: 'pointer' }} onClick={() => setFilterStatut(s)}><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{counts[s]}</div>{s}</div>)}</div>
      <div className="int-stats-bar"><div className="int-stat"><span className="int-stat-val">{das.length}</span><span className="int-stat-label">DA</span></div><div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-orange)' }}>{formatMoney(totalMontant)}</span><span className="int-stat-label">Total</span></div></div>
      <div className="da-card-grid">
        {das.length === 0 && <div className="alert-empty" style={{ gridColumn: '1/-1' }}>Aucune DA</div>}
        {das.map((da) => (<div key={da.id} className="da-card" onClick={() => { setCurrentId(da.id); setView('detail'); }}>
          <div className="da-card-header"><span className="da-card-ref">{da.ref}</span><StatusBadge statut={da.statut} /></div>
          <div className="da-card-body"><div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{da.designation}</div><div>Qte: {da.quantite} | <StatusBadge statut={da.urgence} /></div></div>
          <div className="da-card-footer"><span>{formatMoney(da.montant_estime)}</span><span style={{ color: 'var(--text-muted)' }}>{formatDate(da.date)}</span></div>
        </div>))}
      </div>
    </>);
  }

  if (view === 'detail' && currentId) {
    const da = Store.findById<DemandeAchat>('demandes_achat', currentId);
    if (!da) { setView('list'); return null; }
    const stIdx = statuts.indexOf(da.statut);
    const DR = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value">{v}</span></div>;

    const changeStatut = (newS: string) => {
      da.statut = newS as any;
      if (newS === 'Receptionnee' && da.piece_id) {
        const pc = Store.findById<Piece>('pieces', da.piece_id);
        if (pc) { pc.stock_actuel += da.quantite || 0; Store.upsert('pieces', pc); toast('Stock +' + da.quantite + ' ' + pc.designation, 'info'); }
      }
      Store.upsert('demandes_achat', da); toast('DA ' + da.ref + ' → ' + newS, 'success'); refresh();
    };

    // Diagnostic summary
    let diagHtml = null;
    if (da.intervention_id) {
      const intv = Store.findById<Intervention>('interventions', da.intervention_id);
      if (intv) {
        const sig = Store.getAll<Signalement>('signalements').find((s) => s.intervention_id === da.intervention_id);
        diagHtml = (<div style={{ background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 10 }}>🔧 Resume diagnostic — {intv.ref}</div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div><strong>Machine :</strong> {getMachineName(intv.machine_id)}</div>
            <div><strong>Description :</strong> {intv.description}</div>
            {sig && <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(75,141,248,0.3)' }}><strong>Signalement :</strong> {sig.dysfonctionnement} | <strong>Symptome :</strong> {sig.symptome || '-'}{sig.qualification?.completed && <><br /><strong>Constat :</strong> {sig.qualification.constat_terrain}</>}</div>}
            {intv.workflow?.step5?.notes && <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(75,141,248,0.3)' }}><strong>Diagnostic :</strong> {intv.workflow.step5.notes}</div>}
          </div>
        </div>);
      }
    }

    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>{da.ref}</span>
        <StatusBadge statut={da.statut} /> <StatusBadge statut={da.urgence} />
      </div>
      <div className="da-workflow-bar" style={{ marginBottom: 24 }}>{statuts.slice(0, 5).map((s, i) => <div key={s} className={'da-wf-step' + (i < stIdx ? ' done' : '') + (i === stIdx ? ' active' : '')}>{i < stIdx ? '✓ ' : ''}{s}</div>)}</div>
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">📄 Infos DA</div><DR l="Ref" v={da.ref} /><DR l="Date" v={formatDate(da.date)} /><DR l="Type" v={da.type_achat} /><DR l="Urgence" v={<StatusBadge statut={da.urgence} />} /><DR l="Demandeur" v={da.demandeur || '-'} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">📦 Detail</div><DR l="Designation" v={da.designation} /><DR l="Quantite" v={da.quantite} /><DR l="Montant" v={formatMoney(da.montant_estime)} /><DR l="Fournisseur" v={da.fournisseur_propose || '-'} /><DR l="Date souhaitee" v={formatDate(da.date_souhaitee)} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">📝 Justification</div><div style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{da.justification || '-'}</div></div>
        <div className="int-detail-card"><div className="int-detail-card-title">🔗 Liens</div><DR l="Machine" v={getMachineName(da.machine_id)} /><DR l="Intervention" v={da.intervention_id || '-'} /><DR l="Pole" v={getPoleName(da.pole_id)} /></div>
      </div>
      {diagHtml}
      {(hasPermission('da_workflow') || hasPermission('da_edit')) && <div className="int-detail-card" style={{ marginTop: 16 }}><div className="int-detail-card-title">⚙ Actions</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {da.statut === 'Brouillon' && <button className="btn btn-primary btn-sm" onClick={() => changeStatut('Soumise')}>➤ Soumettre</button>}
          {da.statut === 'Soumise' && <><button className="btn btn-success btn-sm" onClick={() => changeStatut('Validee')}>✓ Valider</button><button className="btn btn-danger btn-sm" onClick={() => changeStatut('Refusee')}>✗ Refuser</button></>}
          {da.statut === 'Validee' && <button className="btn btn-primary btn-sm" onClick={() => changeStatut('Commandee')}>📦 Commandee</button>}
          {da.statut === 'Commandee' && <button className="btn btn-success btn-sm" onClick={() => changeStatut('Receptionnee')}>✓ Receptionnee</button>}
          {hasPermission('da_edit') && <button className="btn btn-outline btn-sm" onClick={() => setView('form')}>✏ Modifier</button>}
        </div>
      </div>}
    </>);
  }

  // FORM
  const da = currentId ? Store.findById<DemandeAchat>('demandes_achat', currentId) : null;
  const isNew = !da;
  const machines = Store.getAll<Machine>('machines');
  const pieces = Store.getAll<Piece>('pieces');
  const interventions = Store.getAll<Intervention>('interventions');
  const poles = Store.getAll<Pole>('poles');

  const save = () => {
    const desig = gv('da_desig'), type = gv('da_type'), urgence = gv('da_urgence'), justif = gv('da_justif');
    if (!desig || !type || !urgence || !justif) { toast('Champs requis', 'error'); return; }
    const obj: DemandeAchat = {
      id: da?.id || Store.generateId('da'), ref: da?.ref || ('DA-' + new Date().getFullYear() + '-' + ('000' + (Store.getAll<DemandeAchat>('demandes_achat').length + 1)).slice(-3)),
      date: da?.date || new Date().toISOString(), pole_id: gv('da_pole'), type_achat: type, urgence, designation: desig,
      quantite: parseInt(gv('da_qty')) || 1, montant_estime: parseInt(gv('da_montant')) || 0,
      fournisseur_propose: gv('da_fourn'), date_souhaitee: gv('da_date_souh'), machine_id: gv('da_mach'),
      intervention_id: gv('da_int'), piece_id: gv('da_piece'), st_id: da?.st_id || '',
      demandeur: auth.user?.nom || '', justification: justif, statut: da?.statut || 'Brouillon' as any,
    };
    Store.upsert('demandes_achat', obj); toast(isNew ? 'DA creee' : 'DA modifiee', 'success'); setView('list');
  };

  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{isNew ? 'Nouvelle DA' : 'Modifier ' + da?.ref}</span></div>
    <div className="int-detail-card" style={{ maxWidth: 900 }}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Type *</label><select className="form-select" id="da_type" defaultValue={da?.type_achat || ''}><option value="">--</option>{['Piece', 'Sous-traitance', 'Outillage', 'Consommable'].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Urgence *</label><select className="form-select" id="da_urgence" defaultValue={da?.urgence || ''}><option value="">--</option>{['Faible', 'Moyenne', 'Haute', 'Critique'].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
      </div>
      <div className="form-group"><label className="form-label">Designation *</label><input className="form-input" id="da_desig" defaultValue={da?.designation || ''} /></div>
      <div className="form-row-3">
        <div className="form-group"><label className="form-label">Quantite</label><input className="form-input" type="number" id="da_qty" defaultValue={da?.quantite || 1} /></div>
        <div className="form-group"><label className="form-label">Montant (FCFA)</label><input className="form-input" type="number" id="da_montant" defaultValue={da?.montant_estime || ''} /></div>
        <div className="form-group"><label className="form-label">Date souhaitee</label><input className="form-input" type="date" id="da_date_souh" defaultValue={da?.date_souhaitee?.substring(0, 10) || ''} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Pole</label><select className="form-select" id="da_pole" defaultValue={da?.pole_id || ''}><option value="">--</option>{poles.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" id="da_fourn" defaultValue={da?.fournisseur_propose || ''} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Machine</label><select className="form-select" id="da_mach" defaultValue={da?.machine_id || ''}><option value="">--</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Piece</label><select className="form-select" id="da_piece" defaultValue={da?.piece_id || ''}><option value="">--</option>{pieces.map((p) => <option key={p.id} value={p.id}>{p.designation}</option>)}</select></div>
      </div>
      <div className="form-group"><label className="form-label">Intervention</label><select className="form-select" id="da_int" defaultValue={da?.intervention_id || ''}><option value="">--</option>{interventions.map((i) => <option key={i.id} value={i.id}>{i.ref}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Justification *</label><textarea className="form-textarea" id="da_justif" rows={6} defaultValue={da?.justification || ''} /></div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={save}>💾 {isNew ? 'Creer' : 'Enregistrer'}</button><button className="btn btn-outline" onClick={() => setView('list')}>Annuler</button></div>
    </div>
  </>);
}

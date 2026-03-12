'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination, paginate } from '@/components/ui/Pagination';
import Store from '@/lib/store';
import { formatDateTime, getPoleName, getMachineName, getTechName } from '@/lib/utils';
import type { Signalement, Machine, Operateur, ChefAtelier, Intervention } from '@/lib/types';

type View = 'list' | 'detail' | 'form';

export default function SignalementsPage() {
  const { hasPermission, getUserPoleId } = useAuth();
  const { activePole, toast } = useApp();
  const [view, setView] = useState<View>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState('all');
  const [page, setPage] = useState(1);
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  if (view === 'list') {
    let sigs = Store.getAll<Signalement>('signalements');
    if (activePole && activePole !== 'all') sigs = sigs.filter((s) => s.pole_id === activePole);
    if (filterStatut !== 'all') sigs = sigs.filter((s) => s.statut === filterStatut);
    sigs.sort((a, b) => new Date(b.date_signalement).getTime() - new Date(a.date_signalement).getTime());
    const allSigs = Store.getAll<Signalement>('signalements');
    const counts = { Nouveau: allSigs.filter((s) => s.statut === 'Nouveau').length, Qualifie: allSigs.filter((s) => s.statut === 'Qualifie').length, 'Intervention creee': allSigs.filter((s) => s.statut === 'Intervention creee').length };
    const paged = paginate(sigs, page, 8);

    return (<>
      <div className="int-toolbar">
        <div className="int-toolbar-left">
          <select className="int-filter-select" value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}>
            <option value="all">Tous statuts</option>
            {Object.entries(counts).map(([k, v]) => <option key={k} value={k}>{k} ({v})</option>)}
          </select>
        </div>
        <div className="int-toolbar-right"><button className="btn btn-primary" onClick={() => setView('form')}>🚨 Signaler une panne</button></div>
      </div>
      <div className="sig-flow-bar">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className={'sig-flow-step' + (filterStatut === k ? ' active' : '') + (k === 'Intervention creee' ? ' done' : '')} onClick={() => { setFilterStatut(k); setPage(1); }} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v}</div>{k}
          </div>
        ))}
      </div>
      <div className="sig-card-grid">
        {paged.length === 0 && <div className="alert-empty" style={{ gridColumn: '1/-1' }}>Aucun signalement</div>}
        {paged.map((s) => {
          const op = s.operateur_id ? Store.findById<Operateur>('operateurs', s.operateur_id) : null;
          return (<div key={s.id} className={'sig-card urgence-' + s.urgence_percue} onClick={() => { setCurrentId(s.id); setView('detail'); }}>
            <div className="sig-card-header"><span className="sig-card-ref">{s.ref}</span><div style={{ display: 'flex', gap: 4 }}><StatusBadge statut={s.statut} /> <StatusBadge statut={s.urgence_percue} /></div></div>
            <div className="sig-card-machine">{getMachineName(s.machine_id)}</div>
            <div className="sig-card-desc">{s.dysfonctionnement.substring(0, 100)}</div>
            <div className="sig-card-footer"><span>{op?.nom || '-'}</span><span>{formatDateTime(s.date_signalement)}</span></div>
          </div>);
        })}
      </div>
      {sigs.length > 8 && <Pagination totalItems={sigs.length} currentPage={page} perPage={8} onPageChange={setPage} />}
    </>);
  }

  if (view === 'detail' && currentId) {
    const s = Store.findById<Signalement>('signalements', currentId);
    if (!s) { setView('list'); return null; }
    const op = s.operateur_id ? Store.findById<Operateur>('operateurs', s.operateur_id) : null;
    const machine = Store.findById<Machine>('machines', s.machine_id);
    const chefs = Store.getAll<ChefAtelier>('chefs_atelier');
    const intv = s.intervention_id ? Store.findById<Intervention>('interventions', s.intervention_id) : null;
    const flowSteps = ['Nouveau', 'Qualifie', 'Intervention creee'];
    const ci = flowSteps.indexOf(s.statut);

    const qualify = () => {
      const chef = gv('sq_chef'), impact = gv('sq_impact'), constat = gv('sq_constat'), priorite = gv('sq_priorite');
      if (!chef || !impact || !constat || !priorite) { toast('Remplir tous les champs', 'error'); return; }
      s.qualification = { chef_id: chef, date: new Date().toISOString(), impact_production: impact, constat_terrain: constat, priorite_production: priorite, commentaire: gv('sq_comment'), completed: true };
      s.statut = 'Qualifie';
      Store.upsert('signalements', s); toast('Signalement qualifie', 'success'); refresh();
    };

    const createInt = () => {
      const ints = Store.getAll<Intervention>('interventions');
      const ref = 'INT-' + new Date().getFullYear() + '-' + ('000' + (ints.length + 1)).slice(-3);
      const it: Intervention = { id: Store.generateId('int'), ref, date: new Date().toISOString(), machine_id: s.machine_id, pole_id: s.pole_id, atelier_id: s.atelier_id, technicien_principal_id: machine?.techniciens_affectes?.find((t) => t.role === 'Principal')?.technicien_id || machine?.techniciens_affectes?.[0]?.technicien_id || '', techniciens_participants: [], type: 'Curatif', statut: 'En cours', description: 'Issue du signalement ' + s.ref + ' : ' + s.dysfonctionnement, cause_id: null, pieces_utilisees: [], duree_minutes: 0, duree_diagnostic_min: 0, duree_intervention_min: 0, panne_repetitive: false, operateur_id: s.operateur_id, chef_validation_id: null, workflow: {}, signalement_id: s.id };
      Store.upsert('interventions', it); s.statut = 'Intervention creee'; s.intervention_id = it.id; Store.upsert('signalements', s);
      toast('Intervention ' + ref + ' creee', 'success'); refresh();
    };

    const DR = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value">{v}</span></div>;

    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>{s.ref}</span>
        <StatusBadge statut={s.statut} /> <StatusBadge statut={s.urgence_percue} />
      </div>
      <div className="sig-flow-bar" style={{ marginBottom: 24 }}>
        {flowSteps.map((fs, fi) => <div key={fs} className={'sig-flow-step' + (fi < ci ? ' done' : '') + (fi === ci ? ' active' : '')}>{fi < ci ? '✓ ' : ''}{fs}</div>)}
      </div>
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">🚨 Signalement</div>
          <DR l="Reference" v={s.ref} /><DR l="Date" v={formatDateTime(s.date_signalement)} /><DR l="Operateur" v={op?.nom || '-'} /><DR l="Machine" v={machine ? machine.nom : '-'} /><DR l="Pole" v={getPoleName(s.pole_id)} />
          <DR l="Machine arretee" v={s.machine_arretee === 'oui' ? <span className="badge badge-red">OUI</span> : <span className="badge badge-green">Non</span>} />
        </div>
        <div className="int-detail-card"><div className="int-detail-card-title">📝 Description</div>
          <div style={{ marginBottom: 12 }}><strong>Dysfonctionnement :</strong><br />{s.dysfonctionnement}</div>
          <div><strong>Symptome :</strong><br />{s.symptome || '-'}</div>
        </div>
      </div>
      {s.qualification?.completed && <div className="int-detail-card" style={{ marginBottom: 16, borderLeft: '4px solid var(--accent-green)' }}><div className="int-detail-card-title" style={{ color: 'var(--accent-green)' }}>✓ Qualification</div>
        <DR l="Chef" v={chefs.find((c) => c.id === s.qualification!.chef_id)?.nom || '-'} /><DR l="Impact" v={s.qualification!.impact_production} /><DR l="Constat" v={s.qualification!.constat_terrain} /><DR l="Priorite" v={s.qualification!.priorite_production} />
      </div>}
      {s.statut === 'Nouveau' && (hasPermission('constat_chef') || hasPermission('interventions_edit')) && <div className="sig-qualif-box">
        <div className="sig-qualif-box-title">⚠ Qualification requise</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Chef *</label><select className="form-select" id="sq_chef"><option value="">--</option>{chefs.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Impact *</label><select className="form-select" id="sq_impact"><option value="">--</option>{['Aucun','Faible','Modere','Fort','Arret total'].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Constat *</label><textarea className="form-textarea" id="sq_constat" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Priorite *</label><select className="form-select" id="sq_priorite"><option value="">--</option>{['Basse','Normale','Haute','Urgente'].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Commentaire</label><input className="form-input" id="sq_comment" /></div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={qualify}>✓ Qualifier</button>
      </div>}
      {intv && <div className="int-detail-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}><div className="int-detail-card-title" style={{ color: 'var(--accent-blue)' }}>🔧 Intervention</div>
        <DR l="Ref" v={intv.ref} /><DR l="Statut" v={<StatusBadge statut={intv.statut} />} /><DR l="Technicien" v={getTechName(intv.technicien_principal_id)} />
      </div>}
      {!s.intervention_id && s.statut === 'Qualifie' && hasPermission('interventions_create') && <div className="int-detail-card" style={{ textAlign: 'center', padding: 24, borderLeft: '4px solid var(--accent-orange)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔧</div><div style={{ fontWeight: 700, marginBottom: 16 }}>Pret pour intervention</div>
        <button className="btn btn-primary" onClick={createInt}>➕ Creer intervention</button>
      </div>}
    </>);
  }

  // FORM
  const userPole = getUserPoleId();
  let machines = Store.getAll<Machine>('machines');
  let operateurs = Store.getAll<Operateur>('operateurs');
  if (userPole && !hasPermission('pole_all')) { machines = machines.filter((m) => m.pole_id === userPole); operateurs = operateurs.filter((o) => o.pole_id === userPole); }

  const save = () => {
    const [machineId, opId, dysfonct, arret, urgence] = ['sf_machine','sf_operateur','sf_dysfonct','sf_arret','sf_urgence'].map(gv);
    if (!machineId || !opId || !dysfonct || !arret || !urgence) { toast('Champs obligatoires manquants', 'error'); return; }
    const machine = Store.findById<Machine>('machines', machineId);
    const allS = Store.getAll<Signalement>('signalements');
    Store.upsert('signalements', { id: Store.generateId('sig'), ref: 'SIG-' + new Date().getFullYear() + '-' + ('000' + (allS.length + 1)).slice(-3), date_signalement: new Date().toISOString(), operateur_id: opId, pole_id: machine?.pole_id || '', atelier_id: machine?.atelier_id || '', machine_id: machineId, dysfonctionnement: dysfonct, symptome: gv('sf_symptome'), machine_arretee: arret as any, urgence_percue: urgence as any, statut: 'Nouveau', intervention_id: null, qualification: null } as Signalement);
    toast('Signalement envoye', 'success'); setView('list');
  };

  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>🚨 Signaler une panne</span></div>
    <div className="int-detail-card" style={{ maxWidth: 750 }}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Machine *</label><select className="form-select" id="sf_machine"><option value="">--</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Operateur *</label><select className="form-select" id="sf_operateur"><option value="">--</option>{operateurs.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>
      </div>
      <div className="form-group"><label className="form-label">Dysfonctionnement *</label><textarea className="form-textarea" id="sf_dysfonct" /></div>
      <div className="form-group"><label className="form-label">Symptome</label><input className="form-input" id="sf_symptome" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Machine arretee ? *</label><select className="form-select" id="sf_arret"><option value="">--</option><option value="non">Non</option><option value="oui">Oui</option></select></div>
        <div className="form-group"><label className="form-label">Urgence *</label><select className="form-select" id="sf_urgence"><option value="">--</option>{['Faible','Moyenne','Haute','Critique'].map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={save}>🚨 Envoyer</button><button className="btn btn-outline" onClick={() => setView('list')}>Annuler</button></div>
    </div>
  </>);
}

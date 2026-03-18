'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge, CriticiteBadge } from '@/components/ui/Badge';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import Store from '@/lib/store';
import { formatDate, formatDateTime, formatMoney, getPoleName, getMachineName, getTechName, getAtelierName, pad2, toLocalDT, filterByPole, getUsersByRole } from '@/lib/utils';
import type { Intervention, Machine, Cause, Piece, Action, Signalement, User, StockMovement } from '@/lib/types';

type View = 'list' | 'detail' | 'workflow' | 'form';

export default function InterventionsPage() {
  const { hasPermission, getUserPoleId } = useAuth();
  const auth = useAuth();
  const { activePole, toast } = useApp();
  const [view, setView] = useState<View>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [, setTick] = useState(0);
  const [pieceModal, setPieceModal] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, { startTime: number; elapsed: number; running: boolean; interval: any }>>({});
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  const fmtTimer = (ms: number) => { const s = Math.floor(ms / 1000); return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor((s % 3600) / 60)) + ':' + pad2(s % 60); };
  const timerStart = (key: string, intId: string) => { const tKey = key + '_' + intId; timers.current[tKey] = { startTime: Date.now(), elapsed: 0, running: true, interval: setInterval(() => { const t = timers.current[tKey]; if (t?.running) setTimerDisplay((p) => ({ ...p, [key]: fmtTimer(t.elapsed + Date.now() - t.startTime) })); }, 1000) }; refresh(); };
  const timerPause = (key: string, intId: string) => { const tKey = key + '_' + intId; const t = timers.current[tKey]; if (!t) return; t.elapsed += Date.now() - t.startTime; t.running = false; clearInterval(t.interval); refresh(); };
  const timerResume = (key: string, intId: string) => { const tKey = key + '_' + intId; const t = timers.current[tKey]; if (!t) return; t.startTime = Date.now(); t.running = true; t.interval = setInterval(() => { if (t.running) setTimerDisplay((p) => ({ ...p, [key]: fmtTimer(t.elapsed + Date.now() - t.startTime) })); }, 1000); refresh(); };
  const timerStop = (key: string, intId: string) => { const tKey = key + '_' + intId; const t = timers.current[tKey]; if (!t) return; if (t.running) t.elapsed += Date.now() - t.startTime; t.running = false; clearInterval(t.interval); const minutes = Math.round(t.elapsed / 60000); const intv = Store.findById<Intervention>('interventions', intId); if (intv) { if (!intv.workflow) intv.workflow = {}; const sk = key === 'diag' ? 'step5' : 'step6'; if (!intv.workflow[sk as keyof typeof intv.workflow]) (intv.workflow as any)[sk] = {}; (intv.workflow as any)[sk].duree_minutes = minutes; (intv.workflow as any)[sk].duree_ms = t.elapsed; if (key === 'diag') intv.duree_diagnostic_min = minutes; else { intv.duree_intervention_min = minutes; intv.duree_minutes = (intv.duree_diagnostic_min || 0) + minutes; } Store.upsert('interventions', intv); } delete timers.current[tKey]; toast('Timer ' + (key === 'diag' ? 'diagnostic' : 'intervention') + ': ' + minutes + ' min', 'info'); refresh(); };
  const getTimerState = (key: string, intId: string) => { const t = timers.current[key + '_' + intId]; if (!t) return 'idle'; return t.running ? 'running' : 'paused'; };

  const duplicateInt = (intId: string) => { const orig = Store.findById<Intervention>('interventions', intId); if (!orig) return; const n = JSON.parse(JSON.stringify(orig)); n.id = Store.generateId('int'); n.ref = 'INT-' + new Date().getFullYear() + '-' + ('000' + (Store.getAll<Intervention>('interventions').length + 1)).slice(-3); n.date = new Date().toISOString(); n.statut = 'Brouillon'; n.chef_validation_id = null; n.workflow = {}; n.pieces_utilisees = []; Store.upsert('interventions', n); toast('Dupliquee: ' + n.ref, 'success'); refresh(); };
  const deleteInt = (intId: string) => { if (!confirm('Supprimer cette intervention ?')) return; Store.deleteById('interventions', intId); toast('Intervention supprimee', 'warning'); refresh(); };
  const exportCSV = () => { const all = Store.getAll<Intervention>('interventions'); const lines = ['Reference;Date;Machine;Pole;Type;Statut;Technicien;Duree(min);Panne repetitive;Description']; all.forEach((i) => lines.push([i.ref, formatDate(i.date), getMachineName(i.machine_id), getPoleName(i.pole_id), i.type, i.statut, getTechName(i.technicien_principal_id), i.duree_minutes || 0, i.panne_repetitive ? 'Oui' : 'Non', '"' + (i.description || '').replace(/"/g, '""') + '"'].join(';'))); const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'interventions_export.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const addPieceToWf = (intId: string) => { setPieceModal(true); };
  const confirmAddPiece = (intId: string) => { const pieceId = gv('wf_add_piece_id'); const qty = parseInt(gv('wf_add_piece_qty')) || 1; if (!pieceId) return; const piece = Store.findById<Piece>('pieces', pieceId); if (piece && piece.stock_actuel < qty) { toast('Stock insuffisant ! Disponible: ' + piece.stock_actuel, 'error'); return; } const intv = Store.findById<Intervention>('interventions', intId); if (!intv) return; if (!intv.pieces_utilisees) intv.pieces_utilisees = []; intv.pieces_utilisees.push({ piece_id: pieceId, quantite: qty }); if (piece) { piece.stock_actuel -= qty; Store.upsert('pieces', piece); const mvts = Store.getAll<StockMovement>('stock_movements'); mvts.push({ id: Store.generateId('mvt'), piece_id: pieceId, type: 'Sortie', quantite: qty, date: new Date().toISOString(), intervention_id: intId, commentaire: 'Sortie pour ' + intv.ref, operateur: 'Systeme' }); Store.set('stock_movements', mvts); } Store.upsert('interventions', intv); setPieceModal(false); toast('Piece ajoutee et stock mis a jour', 'success'); refresh(); };

  // ===== LIST =====
  if (view === 'list') {
    let ints = Store.getAll<Intervention>('interventions');
    if (activePole && activePole !== 'all') ints = ints.filter((it) => it.pole_id === activePole);
    const userPole = getUserPoleId();
    if (userPole && !hasPermission('pole_all') && !hasPermission('interventions_all')) ints = ints.filter((it) => it.pole_id === userPole);
    if (filterType !== 'all') ints = ints.filter((it) => it.type === filterType);
    if (filterStatut !== 'all') ints = ints.filter((it) => it.statut === filterStatut);
    if (search) { const s = search.toLowerCase(); ints = ints.filter((it) => (it.ref?.toLowerCase().includes(s)) || (it.description?.toLowerCase().includes(s)) || getMachineName(it.machine_id).toLowerCase().includes(s)); }
    ints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = ints.length;
    const paged = paginate(ints, page, 10);
    const tC = ints.filter((it) => it.type === 'Curatif').length, tP = ints.filter((it) => it.type === 'Preventif').length;
    const tEC = ints.filter((it) => it.statut === 'En cours' || it.statut === 'En attente piece').length;
    const tT = ints.filter((it) => it.statut === 'Termine' || it.statut === 'Valide production').length;

    return (<>
      <div className="int-toolbar">
        <div className="int-toolbar-left">
          <input className="int-search" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="int-filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}><option value="all">Tous types</option><option value="Curatif">Curatif</option><option value="Preventif">Preventif</option></select>
          <select className="int-filter-select" value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}><option value="all">Tous statuts</option>{['Brouillon','En attente autorisation','Autorise','En cours','Termine','Valide production','En attente piece'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div className="int-toolbar-right">
          {hasPermission('interventions_create') && <button className="btn btn-primary" onClick={() => { setCurrentId(null); setView('form'); }}>➕ Nouvelle</button>}
          {hasPermission('export') && <button className="btn btn-outline" onClick={exportCSV}>📥 CSV</button>}
          <button className="btn btn-outline" onClick={() => window.print()}>🖨</button>
        </div>
      </div>
      <div className="int-stats-bar">
        <div className="int-stat"><span className="int-stat-val">{total}</span><span className="int-stat-label">Total</span></div>
        <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-orange)' }}>{tC}</span><span className="int-stat-label">Curatif</span></div>
        <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-green)' }}>{tP}</span><span className="int-stat-label">Preventif</span></div>
        <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-blue)' }}>{tEC}</span><span className="int-stat-label">En cours</span></div>
        <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-green)' }}>{tT}</span><span className="int-stat-label">Termines</span></div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table"><thead><tr><th>Ref</th><th>Date</th><th>Machine</th><th>Pole</th><th>Type</th><th>Statut</th><th>Technicien</th><th>Duree</th><th>Actions</th></tr></thead><tbody>
          {paged.length === 0 ? <tr><td colSpan={9} className="data-table-empty">Aucune intervention</td></tr> : paged.map((it) => (
            <tr key={it.id}>
              <td><strong style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => { setCurrentId(it.id); setView('detail'); }}>{it.ref}</strong>{it.panne_repetitive && <span className="badge badge-red" style={{ marginLeft: 4 }}>🔄</span>}</td>
              <td>{formatDate(it.date)}</td><td>{getMachineName(it.machine_id)}</td><td>{getPoleName(it.pole_id)}</td>
              <td>{it.type === 'Curatif' ? <span className="badge badge-orange">Curatif</span> : <span className="badge badge-green">Preventif</span>}</td>
              <td><StatusBadge statut={it.statut} /></td><td>{getTechName(it.technicien_principal_id)}</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{it.duree_minutes || 0} min</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon" title="Voir" onClick={() => { setCurrentId(it.id); setView('detail'); }}>👁</button>
                {it.type === 'Curatif' && <button className="btn-icon" title="Workflow" onClick={() => { setCurrentId(it.id); const wfi = Store.findById<Intervention>('interventions', it.id); setStepIdx(wfi?.workflow?.current_step || 0); setView('workflow'); }}>⚙</button>}
                {hasPermission('interventions_edit') && <button className="btn-icon" title="Modifier" onClick={() => { setCurrentId(it.id); setView('form'); }}>✏</button>}
                {hasPermission('interventions_create') && <button className="btn-icon" title="Dupliquer" onClick={() => duplicateInt(it.id)}>📋</button>}
                {hasPermission('interventions_delete') && <button className="btn-icon" title="Supprimer" onClick={() => deleteInt(it.id)}>🗑</button>}
              </div></td>
            </tr>
          ))}
        </tbody></table>
        {total > 10 && <Pagination totalItems={total} currentPage={page} perPage={10} onPageChange={setPage} />}
      </div>
    </>);
  }

  // ===== DETAIL =====
  if (view === 'detail' && currentId) {
    const it = Store.findById<Intervention>('interventions', currentId);
    if (!it) { setView('list'); return null; }
    const machine = Store.findById<Machine>('machines', it.machine_id);
    const techP = Store.findById<User>('users', it.technicien_principal_id);
    const cause = it.cause_id ? Store.findById<Cause>('causes', it.cause_id) : null;
    const parts = (it.techniciens_participants || []).map((id) => Store.findById<User>('users', id)?.nom).filter(Boolean);
    const op = it.operateur_id ? Store.findById<User>('users', it.operateur_id) : null;
    const actions = Store.getAll<Action>('actions').filter((a) => a.intervention_id === it.id);
    const DR = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value">{v}</span></div>;

    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button>
        <span className="int-detail-ref">{it.ref}</span><StatusBadge statut={it.statut} />
        {it.type === 'Curatif' ? <span className="badge badge-orange">Curatif</span> : <span className="badge badge-green">Preventif</span>}
        {it.panne_repetitive && <span className="badge badge-red">🔄 Repetitive</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {it.type === 'Curatif' && <button className="btn btn-primary btn-sm" onClick={() => { const wfi = Store.findById<Intervention>('interventions', it.id); setStepIdx(wfi?.workflow?.current_step || 0); setView('workflow'); }}>⚙ Workflow</button>}
          {hasPermission('interventions_edit') && <button className="btn btn-outline btn-sm" onClick={() => setView('form')}>✏ Modifier</button>}
        </div>
      </div>
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">📄 Infos generales</div><DR l="Reference" v={it.ref} /><DR l="Date" v={formatDateTime(it.date)} /><DR l="Type" v={it.type} /><DR l="Statut" v={<StatusBadge statut={it.statut} />} /><DR l="Description" v={it.description} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">⚙ Machine</div><DR l="Machine" v={machine?.nom || '-'} /><DR l="Code" v={machine?.code || '-'} /><DR l="Pole" v={getPoleName(it.pole_id)} /><DR l="Atelier" v={getAtelierName(it.atelier_id)} /><DR l="Criticite" v={machine ? <CriticiteBadge criticite={machine.criticite} /> : '-'} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">👥 Equipe</div><DR l="Tech principal" v={techP ? techP.nom : '-'} /><DR l="Participants" v={parts.length > 0 ? parts.join(', ') : 'Aucun'} /><DR l="Operateur" v={op?.nom || '-'} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">⏱ Temps & Diagnostic</div><DR l="Duree totale" v={(it.duree_minutes || 0) + ' min'} /><DR l="Diagnostic" v={(it.duree_diagnostic_min || 0) + ' min'} /><DR l="Intervention" v={(it.duree_intervention_min || 0) + ' min'} /><DR l="Cause" v={cause ? cause.nom + ' (' + cause.categorie + ')' : '-'} /></div>
      </div>
      {it.pieces_utilisees?.length > 0 && <div className="int-detail-card" style={{ marginBottom: 24 }}><div className="int-detail-card-title">📦 Pieces utilisees</div>
        {it.pieces_utilisees.map((pu, i) => { const pc = Store.findById<Piece>('pieces', pu.piece_id); return <div key={i} className="piece-row"><div>{pc ? pc.ref + ' - ' + pc.designation : pu.piece_id}</div><span className="piece-row-qty">x{pu.quantite}</span><span>{pc ? formatMoney(pc.prix_unitaire * pu.quantite) : '-'}</span></div>; })}
      </div>}
      {actions.length > 0 && <div className="int-detail-card"><div className="int-detail-card-title">⚠ Actions ({actions.length})</div>
        {actions.map((a) => <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{a.description.substring(0, 80)}</strong><StatusBadge statut={a.statut} /></div><div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>Echeance: {formatDate(a.echeance)} | <StatusBadge statut={a.priorite} /></div></div>)}
      </div>}
    </>);
  }

  // ===== WORKFLOW =====
  if (view === 'workflow' && currentId) {
    const it = Store.findById<Intervention>('interventions', currentId);
    if (!it) { setView('list'); return null; }
    const wf = it.workflow || {};
    const steps = [
      { num: 1, label: 'Validation technicien', key: 'step3' },
      { num: 2, label: 'Autorisation', key: 'step4' },
      { num: 3, label: 'Diagnostic', key: 'step5' },
      { num: 4, label: 'Intervention', key: 'step6' },
      { num: 5, label: 'Cloture technique', key: 'step7' },
      { num: 6, label: 'Validation production', key: 'step8' },
    ];
    const needAuth = wf.step3 && wf.step3.experience === false;

    // Signalement source
    const sigs = Store.getAll<Signalement>('signalements');
    const linkedSig = sigs.find((sg) => sg.intervention_id === it.id);

    const saveStep = (stepKey: string, idx: number) => {
      if (!it.workflow) it.workflow = {};
      let data: any = {};
      if (stepKey === 'step3') { data = { technicien_principal_id: gv('wf_tech'), prise_en_charge: gv('wf_prise'), experience: gv('wf_exp') === 'true', commentaire_experience: gv('wf_comment_exp'), completed: true }; if (gv('wf_exp') === 'false') it.statut = 'En attente autorisation'; else if (it.statut === 'Brouillon' || it.statut === 'En attente autorisation') it.statut = 'En cours'; }
      else if (stepKey === 'step4') { data = { autorisant: gv('wf_autorisant'), motif: gv('wf_motif'), date_autorisation: gv('wf_date_auth'), statut_autorisation: gv('wf_statut_auth'), completed: true }; if (gv('wf_statut_auth') === 'Autorise') it.statut = 'Autorise'; }
      else if (stepKey === 'step5') { data = it.workflow.step5 || {}; data.notes = gv('wf_notes_diag'); data.completed = true; }
      else if (stepKey === 'step6') { data = it.workflow.step6 || {}; data.travaux = gv('wf_travaux'); data.completed = true; }
      else if (stepKey === 'step7') { data = { cause_id: gv('wf_cause'), action_corrective: gv('wf_action_corr'), action_preventive: gv('wf_action_prev'), panne_repetitive: gv('wf_panne_rep') === 'true', duree_arret_min: parseInt(gv('wf_duree_arret')) || 0, validation_technicien: gv('wf_valid_tech'), completed: true }; it.cause_id = data.cause_id; it.panne_repetitive = data.panne_repetitive; it.statut = 'Termine'; }
      else if (stepKey === 'step8') { data = { machine_ok: gv('wf_machine_ok'), commentaire_validation: gv('wf_comment_valid'), validateur_id: gv('wf_validateur'), date_validation: gv('wf_date_valid') || new Date().toISOString(), completed: true }; it.statut = 'Valide production'; it.chef_validation_id = gv('wf_validateur') || it.chef_validation_id; }
      it.workflow[stepKey as keyof typeof it.workflow] = data as any;
      if (!it.workflow.current_step || idx >= it.workflow.current_step) it.workflow.current_step = Math.min(idx + 1, 5);
      Store.upsert('interventions', it); toast('Etape ' + (idx + 1) + ' sauvegardee', 'success'); refresh();
    };

    const techs = getUsersByRole('technicien');
    const causes = Store.getAll<Cause>('causes');
    const chefsA = getUsersByRole('chef_atelier');
    const pieces = Store.getAll<Piece>('pieces');

    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Liste</button>
        <button className="btn btn-outline btn-sm" onClick={() => setView('detail')}>👁 Fiche</button>
        <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Workflow Curatif — {it.ref}</span><StatusBadge statut={it.statut} />
      </div>
      {linkedSig && <div style={{ background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 10 }}>🚨 Signalement source : {linkedSig.ref}</div>
        <div style={{ fontSize: '0.85rem' }}>Dysfonctionnement: {linkedSig.dysfonctionnement}<br />Symptome: {linkedSig.symptome || '-'}</div>
        {linkedSig.qualification?.completed && <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(75,141,248,0.3)', fontSize: '0.85rem' }}>Constat: {linkedSig.qualification.constat_terrain} | Impact: {linkedSig.qualification.impact_production}</div>}
      </div>}
      <div className="wf-steps-nav">
        {steps.map((s, si) => {
          const isComp = wf[s.key as keyof typeof wf] && (wf[s.key as keyof typeof wf] as any)?.completed;
          const isAct = si === stepIdx;
          if (s.key === 'step4' && !needAuth && !isComp) return <div key={s.key} className="wf-step-tab locked" style={{ opacity: 0.3 }}><span className="wf-step-num">{s.num}</span>{s.label} (N/A)</div>;
          return <div key={s.key} className={'wf-step-tab' + (isComp ? ' completed' : '') + (isAct ? ' active' : '') + (si > stepIdx + 1 ? ' locked' : '')} onClick={() => si <= stepIdx + 1 && setStepIdx(si)}><span className="wf-step-num">{isComp ? '✓' : s.num}</span>{s.label}</div>;
        })}
      </div>
      <div className="wf-step-content">
        {steps[stepIdx] && (() => {
          const sk = steps[stepIdx].key;
          const d = (wf[sk as keyof typeof wf] || {}) as any;
          const Sel = ({ id, items, vk, lk, val: v }: any) => <select className="form-select" id={id}><option value="">--</option>{items.map((i: any) => <option key={i[vk]} value={i[vk]} selected={i[vk] === v}>{i[lk]}</option>)}</select>;

          if (sk === 'step3') return <><div className="wf-step-title"><span style={{ color: 'var(--accent-blue)' }}>Etape 1</span> Validation technicien</div>
            <div className="form-row"><div className="form-group"><label className="form-label">Technicien</label><Sel id="wf_tech" items={techs} vk="id" lk="nom" val={d.technicien_principal_id || it.technicien_principal_id} /></div><div className="form-group"><label className="form-label">Prise en charge</label><select className="form-select" id="wf_prise" defaultValue={d.prise_en_charge || ''}><option value="">--</option><option value="oui">Oui</option><option value="non">Non</option></select></div></div>
            <div className="form-group"><label className="form-label">Experience ?</label><select className="form-select" id="wf_exp" defaultValue={d.experience === true ? 'true' : d.experience === false ? 'false' : ''}><option value="">--</option><option value="true">Oui</option><option value="false">Non</option></select></div>
            <div className="form-group"><label className="form-label">Commentaire</label><textarea className="form-textarea" id="wf_comment_exp" defaultValue={d.commentaire_experience || ''} /></div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => saveStep('step3', stepIdx)}>💾 Sauvegarder</button></>;
          if (sk === 'step4') return <><div className="wf-step-title"><span style={{ color: 'var(--accent-blue)' }}>Etape 2</span> Autorisation</div>
            {!needAuth ? <div className="alert-empty">N/A si experience confirmee</div> : <>
              <div style={{ background: 'var(--accent-orange-dim)', border: '1px solid var(--accent-orange)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16, fontSize: '0.9rem' }}>⚠ Autorisation requise</div>
              <div className="form-group"><label className="form-label">Autorisant</label><input className="form-input" id="wf_autorisant" defaultValue={d.autorisant || ''} /></div>
              <div className="form-group"><label className="form-label">Motif</label><textarea className="form-textarea" id="wf_motif" defaultValue={d.motif || ''} /></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" id="wf_date_auth" defaultValue={d.date_autorisation || ''} /></div><div className="form-group"><label className="form-label">Statut</label><select className="form-select" id="wf_statut_auth" defaultValue={d.statut_autorisation || ''}><option value="">--</option><option value="Autorise">Autorise</option><option value="Refuse">Refuse</option></select></div></div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => saveStep('step4', stepIdx)}>💾 Sauvegarder</button></>}</>;
          if (sk === 'step5') { const ts = getTimerState('diag', it.id); return <><div className="wf-step-title"><span style={{ color: 'var(--accent-blue)' }}>Etape 3</span> Diagnostic</div>
            <div className="timer-block"><div className="timer-label">Timer Diagnostic</div><div className={`timer-display${ts === 'running' ? ' running' : ts === 'paused' ? ' paused' : ''}`}>{timerDisplay.diag || (d.duree_ms ? fmtTimer(d.duree_ms) : '00:00:00')}</div>
            <div className="timer-actions">
              {ts === 'idle' && <button className="btn btn-success btn-sm" onClick={() => timerStart('diag', it.id)}>▶ Demarrer</button>}
              {ts === 'running' && <><button className="btn btn-outline btn-sm" onClick={() => timerPause('diag', it.id)}>⏸ Pause</button><button className="btn btn-danger btn-sm" onClick={() => timerStop('diag', it.id)}>⏹ Terminer</button></>}
              {ts === 'paused' && <><button className="btn btn-outline btn-sm" onClick={() => timerResume('diag', it.id)}>▶ Reprendre</button><button className="btn btn-danger btn-sm" onClick={() => timerStop('diag', it.id)}>⏹ Terminer</button></>}
            </div></div>
            {d.duree_minutes && <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Duree enregistree: <strong>{d.duree_minutes} min</strong></div>}
            <div className="form-group"><label className="form-label">Notes diagnostic</label><textarea className="form-textarea" id="wf_notes_diag" defaultValue={d.notes || ''} /></div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => saveStep('step5', stepIdx)}>💾 Sauvegarder</button></>; }
          if (sk === 'step6') { const ts6 = getTimerState('int', it.id); return <><div className="wf-step-title"><span style={{ color: 'var(--accent-blue)' }}>Etape 4</span> Intervention</div>
            <div className="timer-block"><div className="timer-label">Timer Intervention Curative</div><div className={`timer-display${ts6 === 'running' ? ' running' : ts6 === 'paused' ? ' paused' : ''}`}>{timerDisplay.int || (d.duree_ms ? fmtTimer(d.duree_ms) : '00:00:00')}</div>
            <div className="timer-actions">
              {ts6 === 'idle' && <button className="btn btn-success btn-sm" onClick={() => timerStart('int', it.id)}>▶ Demarrer</button>}
              {ts6 === 'running' && <><button className="btn btn-outline btn-sm" onClick={() => timerPause('int', it.id)}>⏸ Pause</button><button className="btn btn-danger btn-sm" onClick={() => timerStop('int', it.id)}>⏹ Terminer</button></>}
              {ts6 === 'paused' && <><button className="btn btn-outline btn-sm" onClick={() => timerResume('int', it.id)}>▶ Reprendre</button><button className="btn btn-danger btn-sm" onClick={() => timerStop('int', it.id)}>⏹ Terminer</button></>}
            </div></div>
            {d.duree_minutes && <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Duree enregistree: <strong>{d.duree_minutes} min</strong></div>}
            <div className="form-group"><label className="form-label">Travaux realises</label><textarea className="form-textarea" id="wf_travaux" defaultValue={d.travaux || ''} /></div>
            <div style={{ marginTop: 12 }}><label className="form-label">Pieces utilisees</label>{(d.pieces_utilisees || it.pieces_utilisees || []).map((pu: any, i: number) => { const pc = Store.findById<Piece>('pieces', pu.piece_id); return <div key={i} className="piece-row"><div className="piece-row-info">{pc ? pc.ref + ' - ' + pc.designation : pu.piece_id}</div><span className="piece-row-qty">x{pu.quantite}</span>{pc && <span>{formatMoney(pc.prix_unitaire * pu.quantite)}</span>}</div>; })}
            <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => addPieceToWf(it.id)}>➕ Ajouter piece</button></div>
            {pieceModal && <Modal isOpen={true} title="Ajouter une piece" onClose={() => setPieceModal(false)}><div className="form-group"><label className="form-label">Piece</label><select className="form-select" id="wf_add_piece_id">{pieces.map((p) => <option key={p.id} value={p.id}>{p.ref} - {p.designation} (Stock: {p.stock_actuel})</option>)}</select></div><div className="form-group"><label className="form-label">Quantite</label><input className="form-input" type="number" id="wf_add_piece_qty" defaultValue={1} min={1} /></div><div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="btn btn-primary" onClick={() => confirmAddPiece(it.id)}>Confirmer</button><button className="btn btn-outline" onClick={() => setPieceModal(false)}>Annuler</button></div></Modal>}
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => saveStep('step6', stepIdx)}>💾 Sauvegarder</button></>; }
          if (sk === 'step7') return <><div className="wf-step-title"><span style={{ color: 'var(--accent-blue)' }}>Etape 5</span> Cloture technique</div>
            <div className="form-group"><label className="form-label">Cause</label><Sel id="wf_cause" items={causes} vk="id" lk="nom" val={d.cause_id || it.cause_id} /></div>
            <div className="form-group"><label className="form-label">Action corrective</label><textarea className="form-textarea" id="wf_action_corr" defaultValue={d.action_corrective || ''} /></div>
            <div className="form-group"><label className="form-label">Action preventive</label><textarea className="form-textarea" id="wf_action_prev" defaultValue={d.action_preventive || ''} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Panne repetitive</label><select className="form-select" id="wf_panne_rep" defaultValue={d.panne_repetitive === true ? 'true' : d.panne_repetitive === false ? 'false' : it.panne_repetitive ? 'true' : ''}><option value="">--</option><option value="true">Oui</option><option value="false">Non</option></select></div><div className="form-group"><label className="form-label">Duree arret (min)</label><input className="form-input" type="number" id="wf_duree_arret" defaultValue={d.duree_arret_min || ''} /></div></div>
            <div className="form-group"><label className="form-label">Validation technicien</label><select className="form-select" id="wf_valid_tech" defaultValue={d.validation_technicien || ''}><option value="">--</option><option value="oui">Valide</option><option value="non">Non valide</option></select></div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => saveStep('step7', stepIdx)}>💾 Sauvegarder</button></>;
          if (sk === 'step8') return <><div className="wf-step-title"><span style={{ color: 'var(--accent-blue)' }}>Etape 6</span> Validation production</div>
            <div style={{ background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16, fontSize: '0.9rem' }}>🔨 Confirme la remise en service.</div>
            <div className="form-group"><label className="form-label">Machine OK ?</label><select className="form-select" id="wf_machine_ok" defaultValue={d.machine_ok || ''}><option value="">--</option><option value="oui">Oui</option><option value="non">Non</option></select></div>
            <div className="form-group"><label className="form-label">Commentaire</label><textarea className="form-textarea" id="wf_comment_valid" defaultValue={d.commentaire_validation || ''} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Validateur</label><Sel id="wf_validateur" items={chefsA} vk="id" lk="nom" val={d.validateur_id} /></div><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="datetime-local" id="wf_date_valid" defaultValue={d.date_validation || ''} /></div></div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}><button className="btn btn-success" onClick={() => saveStep('step8', stepIdx)}>✓ Valider remise en service</button></div></>;
          return null;
        })()}
      </div>
    </>);
  }

  // ===== FORM =====
  const it = currentId ? Store.findById<Intervention>('interventions', currentId) : null;
  const isNew = !it;
  const machines = Store.getAll<Machine>('machines');
  const techs = getUsersByRole('technicien');
  const ops = getUsersByRole('operateur');
  const causes = Store.getAll<Cause>('causes');

  const save = () => {
    const type = gv('frm_type'), date = gv('frm_date'), machId = gv('frm_machine'), techId = gv('frm_tech'), desc = gv('frm_desc');
    if (!type || !date || !machId || !techId || !desc) { toast('Champs obligatoires *', 'error'); return; }
    const machine = Store.findById<Machine>('machines', machId);
    const intervention: Intervention = {
      id: it?.id || Store.generateId('int'), ref: it?.ref || ('INT-' + new Date().getFullYear() + '-' + ('000' + (Store.getAll<Intervention>('interventions').length + 1)).slice(-3)),
      date: new Date(date).toISOString(), machine_id: machId, pole_id: machine?.pole_id || '', atelier_id: machine?.atelier_id || '',
      technicien_principal_id: techId, techniciens_participants: it?.techniciens_participants || [], type: type as any, statut: (gv('frm_statut') || it?.statut || 'Brouillon') as any,
      description: desc, cause_id: gv('frm_cause') || null, pieces_utilisees: it?.pieces_utilisees || [],
      duree_minutes: parseInt(gv('frm_duree')) || 0, duree_diagnostic_min: parseInt(gv('frm_duree_diag')) || 0, duree_intervention_min: parseInt(gv('frm_duree_int')) || 0,
      panne_repetitive: gv('frm_panne_rep') === 'true', operateur_id: gv('frm_op') || null, chef_validation_id: it?.chef_validation_id || null, workflow: it?.workflow || {},
    };
    Store.upsert('interventions', intervention); toast(isNew ? 'Intervention creee' : 'Modifiee', 'success'); setView('list');
  };

  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{isNew ? 'Nouvelle intervention' : 'Modifier ' + it?.ref}</span></div>
    <div className="int-detail-card" style={{ maxWidth: 900 }}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Type *</label><select className="form-select" id="frm_type" defaultValue={it?.type || ''}><option value="">--</option><option value="Curatif">Curatif</option><option value="Preventif">Preventif</option></select></div>
        <div className="form-group"><label className="form-label">Statut</label><select className="form-select" id="frm_statut" defaultValue={it?.statut || 'Brouillon'}>{['Brouillon','En attente autorisation','Autorise','En cours','Termine','Valide production','En attente piece'].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Date *</label><input className="form-input" type="datetime-local" id="frm_date" defaultValue={it ? toLocalDT(it.date) : toLocalDT(new Date().toISOString())} /></div>
        <div className="form-group"><label className="form-label">Machine *</label><select className="form-select" id="frm_machine" defaultValue={it?.machine_id || ''}><option value="">--</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Technicien principal *</label><select className="form-select" id="frm_tech" defaultValue={it?.technicien_principal_id || ''}><option value="">--</option>{techs.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Operateur</label><select className="form-select" id="frm_op" defaultValue={it?.operateur_id || ''}><option value="">--</option>{ops.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>
      </div>
      <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" id="frm_desc" defaultValue={it?.description || ''} /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Cause</label><select className="form-select" id="frm_cause" defaultValue={it?.cause_id || ''}><option value="">--</option>{causes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Panne repetitive</label><select className="form-select" id="frm_panne_rep" defaultValue={it?.panne_repetitive ? 'true' : 'false'}><option value="false">Non</option><option value="true">Oui</option></select></div>
      </div>
      <div className="form-row-3">
        <div className="form-group"><label className="form-label">Duree totale (min)</label><input className="form-input" type="number" id="frm_duree" defaultValue={it?.duree_minutes || ''} /></div>
        <div className="form-group"><label className="form-label">Duree diagnostic</label><input className="form-input" type="number" id="frm_duree_diag" defaultValue={it?.duree_diagnostic_min || ''} /></div>
        <div className="form-group"><label className="form-label">Duree intervention</label><input className="form-input" type="number" id="frm_duree_int" defaultValue={it?.duree_intervention_min || ''} /></div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={save}>💾 {isNew ? 'Creer' : 'Enregistrer'}</button><button className="btn btn-outline" onClick={() => setView('list')}>Annuler</button></div>
    </div>
  </>);
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import Store from '@/lib/store';
import { getMachineName, filterByPole } from '@/lib/utils';
import type { TachePreventive, Machine, Organe, Piece, Intervention } from '@/lib/types';

export default function PreventifPage() {
  const { hasPermission } = useAuth();
  const { activePole, toast } = useApp();
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'form'>('calendar');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [editId, setEditId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  let tasks = Store.getAll<TachePreventive>('taches_preventives');
  if (activePole && activePole !== 'all') tasks = tasks.filter((t) => { const m = Store.findById<Machine>('machines', t.machine_id); return m?.pole_id === activePole; });

  const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

  // Compute scheduled tasks
  const getInterval = (freq: string): number => ({ 'Quotidien': 1, 'Hebdomadaire': 7, 'Bi-mensuel': 15, 'Mensuel': 30, 'Trimestriel': 90, 'Semestriel': 180, 'Annuel': 365 }[freq] || 30);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toFullYear + '-' + ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' + ('0' + new Date().getDate()).slice(-2);
  const pad = (n: number) => n < 10 ? '0' + n : '' + n;
  const todayS = year + '-' + pad(new Date().getMonth() + 1) + '-' + pad(new Date().getDate());
  const completions = Store.get<Record<string, boolean>>('prev_completions') || {};

  const scheduled: { taskId: string; date: string; tache: string; machCode: string; machName: string; freq: string; duree: number; status: string }[] = [];
  tasks.forEach((task, ti) => {
    const mach = Store.findById<Machine>('machines', task.machine_id);
    const interval = getInterval(task.frequence);
    const startDay = ((ti * 3) % daysInMonth) + 1;
    for (let day = startDay; day <= daysInMonth; day += interval) {
      const dateStr = year + '-' + pad(month + 1) + '-' + pad(day);
      const compKey = task.id + '_' + dateStr;
      const isDone = completions[compKey] || false;
      let status = 'upcoming';
      if (isDone) status = 'done';
      else if (dateStr < todayS) status = 'overdue';
      else if (dateStr === todayS) status = 'due';
      scheduled.push({ taskId: task.id, date: dateStr, tache: task.tache, machCode: mach?.code || '', machName: mach?.nom || '-', freq: task.frequence, duree: task.duree_std_min, status });
    }
  });

  const done = scheduled.filter((s) => s.status === 'done').length;
  const overdue = scheduled.filter((s) => s.status === 'overdue').length;
  const tauxReal = scheduled.length > 0 ? Math.round((done / scheduled.length) * 100) : 0;

  const toggleTask = (taskId: string, dateStr: string) => {
    const comps = Store.get<Record<string, boolean>>('prev_completions') || {};
    const key = taskId + '_' + dateStr;
    if (comps[key]) delete comps[key]; else comps[key] = true;
    Store.set('prev_completions', comps); refresh();
  };

  if (viewMode === 'form') {
    const t = editId ? Store.findById<TachePreventive>('taches_preventives', editId) : null;
    const machines = Store.getAll<Machine>('machines'); const organes = Store.getAll<Organe>('organes'); const pieces = Store.getAll<Piece>('pieces');
    const save = () => {
      const tache = gv('tp_tache'), machId = gv('tp_machine'), freq = gv('tp_freq');
      if (!tache || !machId || !freq) { toast('Champs requis', 'error'); return; }
      Store.upsert('taches_preventives', { id: t?.id || Store.generateId('tp'), machine_id: machId, organe_id: gv('tp_organe') || null, piece_id: gv('tp_piece') || null, tache, frequence: freq, duree_std_min: parseInt(gv('tp_duree')) || 0, type_seuil: (gv('tp_seuil_type') || 'Periode') as any, seuil_valeur: parseInt(gv('tp_seuil_val')) || 0, alerte_avant_jours: parseInt(gv('tp_alerte')) || 3 } as TachePreventive);
      toast(t ? 'Modifiee' : 'Creee', 'success'); setViewMode('calendar');
    };
    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setViewMode('calendar')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t ? 'Modifier tache' : 'Nouvelle tache'}</span></div>
      <div className="int-detail-card" style={{ maxWidth: 800 }}>
        <div className="form-group"><label className="form-label">Tache *</label><input className="form-input" id="tp_tache" defaultValue={t?.tache || ''} /></div>
        <div className="form-row"><div className="form-group"><label className="form-label">Machine *</label><select className="form-select" id="tp_machine" defaultValue={t?.machine_id || ''}><option value="">--</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Frequence *</label><select className="form-select" id="tp_freq" defaultValue={t?.frequence || ''}><option value="">--</option>{['Quotidien', 'Hebdomadaire', 'Bi-mensuel', 'Mensuel', 'Trimestriel'].map((f) => <option key={f} value={f}>{f}</option>)}</select></div></div>
        <div className="form-row"><div className="form-group"><label className="form-label">Organe</label><select className="form-select" id="tp_organe" defaultValue={t?.organe_id || ''}><option value="">--</option>{organes.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Piece</label><select className="form-select" id="tp_piece" defaultValue={t?.piece_id || ''}><option value="">--</option>{pieces.map((p) => <option key={p.id} value={p.id}>{p.designation}</option>)}</select></div></div>
        <div className="form-row-3"><div className="form-group"><label className="form-label">Type seuil</label><select className="form-select" id="tp_seuil_type" defaultValue={t?.type_seuil || 'Periode'}><option value="Periode">Periode</option><option value="Heures">Heures</option><option value="Tours">Tours</option></select></div><div className="form-group"><label className="form-label">Valeur seuil</label><input className="form-input" type="number" id="tp_seuil_val" defaultValue={t?.seuil_valeur || ''} /></div><div className="form-group"><label className="form-label">Duree (min)</label><input className="form-input" type="number" id="tp_duree" defaultValue={t?.duree_std_min || ''} /></div></div>
        <div className="form-group"><label className="form-label">Alerte avant (jours)</label><input className="form-input" type="number" id="tp_alerte" defaultValue={t?.alerte_avant_jours || 3} /></div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={save}>💾 Enregistrer</button><button className="btn btn-outline" onClick={() => setViewMode('calendar')}>Annuler</button></div>
      </div>
    </>);
  }

  // Calendar / List header
  return (<>
    <div className="int-toolbar">
      <div className="int-toolbar-left">
        <button className={'btn btn-sm ' + (viewMode === 'calendar' ? 'btn-primary' : 'btn-outline')} onClick={() => setViewMode('calendar')}>📅 Calendrier</button>
        <button className={'btn btn-sm ' + (viewMode === 'list' ? 'btn-primary' : 'btn-outline')} onClick={() => setViewMode('list')}>☰ Liste</button>
      </div>
      <div className="int-toolbar-right">{hasPermission('interventions_create') && <button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setViewMode('form'); }}>➕ Tache</button>}</div>
    </div>
    <div className="int-stats-bar">
      <div className="int-stat"><span className="int-stat-val">{scheduled.length}</span><span className="int-stat-label">Planifiees</span></div>
      <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-green)' }}>{done}</span><span className="int-stat-label">Realisees</span></div>
      <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-red)' }}>{overdue}</span><span className="int-stat-label">Retard</span></div>
      <div className="int-stat"><span className="int-stat-val" style={{ color: 'var(--accent-blue)' }}>{tauxReal}%</span><span className="int-stat-label">Taux</span></div>
    </div>
    <div style={{ marginBottom: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}><span>Progression</span><span style={{ fontWeight: 700 }}>{done}/{scheduled.length}</span></div><div className="prev-progress-bar"><div className="prev-progress-fill" style={{ width: tauxReal + '%' }} /></div></div>

    {viewMode === 'calendar' && <>
      <div className="prev-month-nav">
        <button className="prev-month-nav-btn" onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }}>◀</button>
        <span className="prev-month-label">{monthNames[month]} {year}</span>
        <button className="prev-month-nav-btn" onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }}>▶</button>
        <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setMonth(new Date().getMonth()); setYear(new Date().getFullYear()); }}>Aujourd&apos;hui</button>
      </div>
      <div className="prev-calendar">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <div key={d} className="prev-cal-header">{d}</div>)}
        {(() => {
          const firstDay = new Date(year, month, 1); const startDow = (firstDay.getDay() + 6) % 7;
          const cells: React.ReactNode[] = [];
          const prevDays = new Date(year, month, 0).getDate();
          for (let pb = startDow - 1; pb >= 0; pb--) cells.push(<div key={'p' + pb} className="prev-cal-day other-month"><div className="prev-cal-num">{prevDays - pb}</div></div>);
          for (let day = 1; day <= daysInMonth; day++) {
            const ds = year + '-' + pad(month + 1) + '-' + pad(day);
            const isToday = ds === todayS;
            const dayTasks = scheduled.filter((s) => s.date === ds);
            cells.push(<div key={day} className={'prev-cal-day' + (isToday ? ' today' : '')}><div className="prev-cal-num">{day}</div>{dayTasks.slice(0, 3).map((dt, i) => <div key={i} className={'prev-cal-task ' + dt.status} title={dt.tache}>{dt.machCode} {dt.tache.substring(0, 18)}</div>)}{dayTasks.length > 3 && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{dayTasks.length - 3}</div>}</div>);
          }
          const rem = (7 - ((startDow + daysInMonth) % 7)) % 7;
          for (let nx = 1; nx <= rem; nx++) cells.push(<div key={'n' + nx} className="prev-cal-day other-month"><div className="prev-cal-num">{nx}</div></div>);
          return cells;
        })()}
      </div>
    </>}

    {/* Task list below or as main view */}
    <div className="data-table-wrap">
      <div className="data-table-header"><div className="data-table-title">Taches du mois ({scheduled.length})</div></div>
      <div style={{ maxHeight: viewMode === 'list' ? 'none' : 400, overflowY: 'auto' }}>
        {scheduled.sort((a, b) => a.date < b.date ? -1 : 1).map((sc, i) => (
          <div key={i} className="prev-task-list-item">
            <div className={'prev-task-check' + (sc.status === 'done' ? ' checked' : '')} onClick={() => toggleTask(sc.taskId, sc.date)}>{sc.status === 'done' ? '✓' : ''}</div>
            <div className="prev-task-info"><div className="prev-task-name">{sc.tache}</div><div className="prev-task-meta">{sc.machName} | {sc.freq} | {sc.date} | {sc.duree} min</div></div>
            {sc.status === 'done' ? <span className="badge badge-green">Fait</span> : sc.status === 'overdue' ? <span className="badge badge-red">Retard</span> : sc.status === 'due' ? <span className="badge badge-orange">A faire</span> : <span className="badge badge-blue">A venir</span>}
          </div>
        ))}
      </div>
    </div>
  </>);
}

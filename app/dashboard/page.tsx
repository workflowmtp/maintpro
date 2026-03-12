'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import Store from '@/lib/store';
import { formatFullDate, formatMoney, formatDate, getPoleName, getMachineName, getTechName, filterByPole } from '@/lib/utils';
import type { Intervention, Action, Piece, DemandeAchat, SousTraitance, Machine, Signalement } from '@/lib/types';

export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const { activePole } = useApp();
  const router = useRouter();
  const [, setTick] = useState(0);
  useEffect(() => { setTick((t) => t + 1); }, [activePole]);

  const interventions = filterByPole(Store.getAll<Intervention>('interventions'), activePole);
  const actions = Store.getAll<Action>('actions');
  const pieces = Store.getAll<Piece>('pieces');
  const das = filterByPole(Store.getAll<DemandeAchat>('demandes_achat'), activePole);
  const sts = filterByPole(Store.getAll<SousTraitance>('sous_traitances'), activePole);
  const machines = filterByPole(Store.getAll<Machine>('machines'), activePole);
  const sigNouveaux = filterByPole(Store.getAll<Signalement>('signalements'), activePole).filter((s) => s.statut === 'Nouveau' || s.statut === 'Qualifie');

  const now = new Date();
  const monthInts = interventions.filter((it) => { const d = new Date(it.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const curatives = monthInts.filter((it) => it.type === 'Curatif');
  const preventives = monthInts.filter((it) => it.type === 'Preventif');
  const enCours = interventions.filter((it) => it.statut === 'En cours' || it.statut === 'En attente piece');
  const attValidation = interventions.filter((it) => it.statut === 'Termine');
  const stockCritique = pieces.filter((p) => p.stock_actuel <= p.seuil_reappro);
  const stockRupture = pieces.filter((p) => p.stock_actuel === 0);
  const daEnAttente = das.filter((d) => d.statut === 'Soumise');
  const stEnCours = sts.filter((s) => s.statut === 'En cours');
  const pannesRepet = interventions.filter((it) => it.panne_repetitive);
  const machinesPanne = machines.filter((m) => m.etat === 'En panne');
  const actionsRetard = actions.filter((a) => a.statut === 'En retard');

  return (
    <>
      <div className="dash-header">
        <div>
          <div className="dash-title">Dashboard Maintenance</div>
          <div className="dash-date">{formatFullDate(now)}</div>
        </div>
        <div className="dash-actions">
          {hasPermission('interventions_create') && (
            <>
              <button className="dash-action-btn primary" onClick={() => router.push('/signalements')}>🚨 Signaler panne</button>
              <button className="dash-action-btn" onClick={() => router.push('/interventions')}>🔧 Interventions</button>
            </>
          )}
          {hasPermission('da_create') && <button className="dash-action-btn" onClick={() => router.push('/da')}>📄 Nouvelle DA</button>}
          {hasPermission('bot') && <button className="dash-action-btn" onClick={() => router.push('/maintbot')}>🤖 MaintBot</button>}
        </div>
      </div>
      <div className="kpi-grid">
        {[
          { color: 'red', icon: '🚨', value: sigNouveaux.length, label: 'Signalements a traiter' },
          { color: 'blue', icon: '🔧', value: monthInts.length, label: 'Interventions du mois' },
          { color: 'green', icon: '📅', value: preventives.length, label: 'Preventives' },
          { color: 'orange', icon: '⚠', value: curatives.length, label: 'Curatives' },
          { color: 'red', icon: '🔄', value: enCours.length, label: 'En cours' },
          { color: 'purple', icon: '⏳', value: attValidation.length, label: 'Att. validation prod.' },
          { color: 'red', icon: '🚨', value: stockCritique.length, label: 'Alertes stock' },
          { color: 'orange', icon: '📄', value: daEnAttente.length, label: 'DA en attente' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className={'kpi-card-icon ' + k.color}>{k.icon}</div>
            <div className="kpi-card-value">{k.value}</div>
            <div className="kpi-card-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="alert-grid">
        <AB title="Signalements a traiter" dot="red" items={sigNouveaux.map((sg) => ({ icon: sg.statut === 'Nouveau' ? '🔴' : '🟠', text: <><strong>{sg.ref}</strong> - {getMachineName(sg.machine_id)}</>, meta: <><StatusBadge statut={sg.statut} /> — <StatusBadge statut={sg.urgence_percue} /></> }))} />
        <AB title="Urgences critiques" dot="red" items={[
          ...machinesPanne.map((m) => ({ icon: '🔴', text: <><strong>{m.nom}</strong> en panne</>, meta: getPoleName(m.pole_id) })),
          ...stockRupture.map((p) => ({ icon: '🚨', text: <><strong>{p.designation}</strong> - Rupture</>, meta: 'Ref: ' + p.ref })),
          ...pannesRepet.map((it) => ({ icon: '🔄', text: <>Repetitive - <strong>{getMachineName(it.machine_id)}</strong></>, meta: it.ref })),
        ]} />
        <AB title="Interventions en cours" dot="blue" items={enCours.map((it) => ({ icon: '🔧', text: <><strong>{it.ref}</strong> - {getMachineName(it.machine_id)}</>, meta: <><StatusBadge statut={it.statut} /> — {getTechName(it.technicien_principal_id)}</> }))} />
        <AB title="Validations production" dot="purple" items={attValidation.map((it) => ({ icon: '🔧', text: <><strong>{it.ref}</strong> - {getMachineName(it.machine_id)}</>, meta: <>{formatDate(it.date)} — {getTechName(it.technicien_principal_id)}</> }))} />
        <AB title="Actions en retard" dot="orange" items={actionsRetard.map((a) => ({ icon: '⚠', text: <strong>{a.description.substring(0, 60)}</strong>, meta: <>Echeance: {formatDate(a.echeance)} — <StatusBadge statut={a.priorite} /></> }))} />
        <AB title="Alertes stock" dot="red" items={stockCritique.map((p) => ({ icon: p.stock_actuel === 0 ? '🚨' : '⚠', text: <><strong>{p.designation}</strong> - {p.stock_actuel === 0 ? 'RUPTURE' : 'Stock bas'}</>, meta: <>Stock: {p.stock_actuel} / Seuil: {p.seuil_reappro}</> }))} />
        <AB title="DA en attente" dot="orange" items={daEnAttente.map((d) => ({ icon: '📄', text: <><strong>{d.ref}</strong> - {d.designation.substring(0, 50)}</>, meta: <>{formatMoney(d.montant_estime)} — <StatusBadge statut={d.urgence} /></> }))} />
        <AB title="Sous-traitances" dot="blue" items={stEnCours.map((s) => ({ icon: '💼', text: <><strong>{s.ref}</strong> - {s.prestataire}</>, meta: <>{s.objet.substring(0, 60)}</> }))} />
      </div>
    </>
  );
}

function AB({ title, dot, items }: { title: string; dot: string; items: { icon: string; text: React.ReactNode; meta?: React.ReactNode }[] }) {
  return (
    <div className="alert-block">
      <div className="alert-block-header">
        <div className="alert-block-title"><span className={'dot ' + dot} />{title}</div>
        <span className="alert-block-count">{items.length}</span>
      </div>
      <div className="alert-block-body">
        {items.length === 0 ? <div className="alert-empty">Aucun element</div> : items.map((item, i) => (
          <div key={i} className="alert-item">
            <span className="alert-item-icon">{item.icon}</span>
            <div className="alert-item-text">{item.text}{item.meta && <div className="alert-item-meta">{item.meta}</div>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

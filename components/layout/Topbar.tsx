'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Store from '@/lib/store';
import type { Pole } from '@/lib/types';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/signalements': 'Signalements',
  '/interventions': 'Interventions',
  '/preventif': 'Preventif',
  '/machines': 'Machines',
  '/stock': 'Stock',
  '/da': 'Demandes Achat',
  '/sous-traitance': 'Sous-traitance',
  '/kpi': 'KPI',
  '/rapports': 'Rapports',
  '/parametrage': 'Parametrage',
  '/maintbot': 'MaintBot',
};

interface TopbarProps {
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export function Topbar({ onToggleSidebar, isMobile }: TopbarProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const { activePole, setActivePole } = useApp();

  const poles = Store.getAll<Pole>('poles');
  const pageLabel = PAGE_LABELS[pathname] || 'MaintPro';

  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    Store.set('theme', next);
  };

  const handlePoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivePole(e.target.value);
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        {isMobile && (
          <button className="topbar-btn" onClick={onToggleSidebar}>☰</button>
        )}
        <div className="topbar-breadcrumb">
          <strong>{pageLabel}</strong>
        </div>
        <div className="topbar-pole-filter">
          <select value={activePole} onChange={handlePoleChange}>
            <option value="all">Tous les poles</option>
            {poles.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" onClick={toggleTheme} title="Theme clair/sombre">◑</button>
        <button className="topbar-btn" onClick={() => window.print()} title="Imprimer">🖨</button>
      </div>
    </div>
  );
}

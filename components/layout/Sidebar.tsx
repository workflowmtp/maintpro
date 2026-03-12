'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleName } from '@/lib/roles';
import Store from '@/lib/store';
import type { Intervention, Piece, DemandeAchat, Signalement } from '@/lib/types';

interface NavItem {
  section?: string;
  id?: string;
  label?: string;
  icon?: string;
  perm?: string | null;
  badgeKey?: string;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { section: 'PRINCIPAL' },
  { id: 'dashboard', label: 'Dashboard', icon: '■', perm: null, href: '/dashboard' },
  { section: 'MAINTENANCE' },
  { id: 'signalements', label: 'Signalements', icon: '🚨', perm: 'interventions_create', badgeKey: 'signalements_pending', href: '/signalements' },
  { id: 'interventions', label: 'Interventions', icon: '🔧', perm: 'interventions_view', badgeKey: 'interventions_pending', href: '/interventions' },
  { id: 'preventif', label: 'Preventif', icon: '📅', perm: 'planning_view', href: '/preventif' },
  { id: 'machines', label: 'Machines', icon: '⚙', perm: 'interventions_view', href: '/machines' },
  { section: 'LOGISTIQUE' },
  { id: 'stock', label: 'Stock', icon: '📦', perm: 'stock_view', badgeKey: 'stock_alerts', href: '/stock' },
  { id: 'da', label: 'Demandes Achat', icon: '📄', perm: 'da_view', badgeKey: 'da_pending', href: '/da' },
  { id: 'st', label: 'Sous-traitance', icon: '💼', perm: 'st_view', href: '/sous-traitance' },
  { section: 'ANALYSE' },
  { id: 'kpi', label: 'KPI', icon: '📈', perm: 'kpi_view', href: '/kpi' },
  { id: 'rapports', label: 'Rapports', icon: '📑', perm: 'rapports_view', href: '/rapports' },
  { section: 'SYSTEME' },
  { id: 'parametrage', label: 'Parametrage', icon: '⚙', perm: 'parametrage_view', href: '/parametrage' },
  { id: 'maintbot', label: 'MaintBot', icon: '🤖', perm: 'bot', href: '/maintbot' },
];

function getBadgeCount(key: string): number {
  if (key === 'signalements_pending') {
    const sigs = Store.getAll<Signalement>('signalements');
    return sigs.filter((s) => s.statut === 'Nouveau' || s.statut === 'Qualifie').length;
  }
  if (key === 'interventions_pending') {
    const ints = Store.getAll<Intervention>('interventions');
    return ints.filter((i) => i.statut === 'En cours' || i.statut === 'En attente piece' || i.statut === 'Termine').length;
  }
  if (key === 'stock_alerts') {
    const pieces = Store.getAll<Piece>('pieces');
    return pieces.filter((p) => p.stock_actuel <= p.seuil_reappro).length;
  }
  if (key === 'da_pending') {
    const das = Store.getAll<DemandeAchat>('demandes_achat');
    return das.filter((d) => d.statut === 'Soumise' || d.statut === 'Brouillon').length;
  }
  return 0;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, hasPermission, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const initials = user.nom.split(' ').map((w) => w.charAt(0)).join('').toUpperCase().substring(0, 2);
  const roleName = getRoleName(user.role);

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">Maint<span>Pro</span></div>
        <div className="sidebar-version">v3+ Multi-Poles</div>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return <div key={'sec-' + i} className="nav-section">{item.section}</div>;
          }
          if (item.perm && !hasPermission(item.perm)) return null;

          const isActive = pathname === item.href || (item.href && item.href !== '/' && pathname.startsWith(item.href + '/'));
          const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.href!)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badge > 0 && <span className="nav-badge">{badge}</span>}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user.nom}</div>
          <div className="sidebar-user-role">{roleName}</div>
        </div>
        <div className="sidebar-logout" onClick={logout} title="Deconnexion">⏻</div>
      </div>
    </nav>
  );
}

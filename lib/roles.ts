// ============================================================
// MaintPro v3+ — Roles & Permissions
// ============================================================

import { RoleId, RoleDefinition } from './types';
import Store from './store';

// --- PERMISSION REGISTRY ---
// Each permission has a label, category, and description of what it unlocks
export interface PermissionDef {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const PERMISSION_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'menu_maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'menu_logistique', label: 'Logistique', icon: '📦' },
  { id: 'menu_analyse', label: 'Analyse', icon: '📈' },
  { id: 'menu_systeme', label: 'Systeme', icon: '⚙' },
  { id: 'actions_metier', label: 'Actions Metier', icon: '✏' },
  { id: 'avance', label: 'Avance', icon: '🔐' },
];

export const ALL_PERMISSIONS: PermissionDef[] = [
  // --- Maintenance ---
  { id: 'interventions_view', label: 'Voir interventions', category: 'menu_maintenance', description: 'Acces au menu Interventions' },
  { id: 'interventions_create', label: 'Creer interventions', category: 'menu_maintenance', description: 'Creer des interventions' },
  { id: 'interventions_edit', label: 'Modifier interventions', category: 'menu_maintenance', description: 'Modifier des interventions existantes' },
  { id: 'interventions_all', label: 'Voir toutes les interventions', category: 'menu_maintenance', description: 'Voir les interventions de tous les poles' },
  { id: 'interventions_delete', label: 'Supprimer interventions', category: 'menu_maintenance', description: 'Supprimer des interventions' },
  { id: 'interventions_workflow', label: 'Gerer workflow interventions', category: 'menu_maintenance', description: 'Acces au workflow des interventions curatives' },
  { id: 'interventions_validate', label: 'Valider/autoriser interventions', category: 'menu_maintenance', description: 'Valider et autoriser les interventions' },
  { id: 'signalements_view', label: 'Voir signalements', category: 'menu_maintenance', description: 'Acces au menu Signalements' },
  { id: 'signalements_create', label: 'Creer signalements', category: 'menu_maintenance', description: 'Signaler une panne' },
  { id: 'planning_view', label: 'Voir preventif / planning', category: 'menu_maintenance', description: 'Acces au menu Preventif' },
  { id: 'preventif_create', label: 'Creer taches preventives', category: 'menu_maintenance', description: 'Creer des taches preventives' },
  { id: 'preventif_edit', label: 'Modifier taches preventives', category: 'menu_maintenance', description: 'Modifier les taches preventives' },
  { id: 'preventif_complete', label: 'Valider taches preventives', category: 'menu_maintenance', description: 'Valider/realiser les taches preventives' },
  { id: 'machines_view', label: 'Voir machines', category: 'menu_maintenance', description: 'Acces au menu Machines' },
  { id: 'machines_edit', label: 'Modifier machines/organes', category: 'menu_maintenance', description: 'Creer et modifier les machines et organes' },
  { id: 'actions_view', label: 'Voir actions', category: 'menu_maintenance', description: 'Acces a la liste des actions correctives' },
  { id: 'actions_create', label: 'Creer actions', category: 'menu_maintenance', description: 'Creer des actions correctives' },
  { id: 'actions_edit', label: 'Modifier actions', category: 'menu_maintenance', description: 'Modifier des actions existantes' },
  { id: 'actions_delete', label: 'Supprimer actions', category: 'menu_maintenance', description: 'Supprimer des actions correctives' },
  // --- Logistique ---
  { id: 'stock_view', label: 'Voir stock', category: 'menu_logistique', description: 'Acces au menu Stock' },
  { id: 'stock_edit', label: 'Modifier stock', category: 'menu_logistique', description: 'Entrees/sorties de stock' },
  { id: 'stock_import', label: 'Importer stock', category: 'menu_logistique', description: 'Importer des donnees de stock' },
  { id: 'stock_export', label: 'Exporter stock', category: 'menu_logistique', description: 'Exporter des donnees de stock' },
  { id: 'stock_delete', label: 'Supprimer pieces', category: 'menu_logistique', description: 'Supprimer des pieces du stock' },
  { id: 'da_view', label: 'Voir demandes achat', category: 'menu_logistique', description: 'Acces au menu Demandes Achat' },
  { id: 'da_create', label: 'Creer demandes achat', category: 'menu_logistique', description: 'Creer des demandes d\'achat' },
  { id: 'da_edit', label: 'Modifier demandes achat', category: 'menu_logistique', description: 'Modifier les demandes d\'achat' },
  { id: 'da_workflow', label: 'Valider demandes achat', category: 'menu_logistique', description: 'Valider/refuser les DA' },
  { id: 'da_delete', label: 'Supprimer demandes achat', category: 'menu_logistique', description: 'Supprimer des demandes d\'achat' },
  { id: 'st_view', label: 'Voir sous-traitance', category: 'menu_logistique', description: 'Acces au menu Sous-traitance' },
  { id: 'st_create', label: 'Creer sous-traitance', category: 'menu_logistique', description: 'Creer des contrats de sous-traitance' },
  { id: 'st_edit', label: 'Modifier sous-traitance', category: 'menu_logistique', description: 'Modifier les sous-traitances' },
  { id: 'st_delete', label: 'Supprimer sous-traitance', category: 'menu_logistique', description: 'Supprimer des sous-traitances' },
  { id: 'st_workflow', label: 'Changer statut sous-traitance', category: 'menu_logistique', description: 'Valider/annuler/changer le statut des sous-traitances' },
  // --- Analyse ---
  { id: 'kpi_view', label: 'Voir KPI', category: 'menu_analyse', description: 'Acces au menu KPI' },
  { id: 'evaluations_view', label: 'Voir evaluations', category: 'menu_analyse', description: 'Acces aux evaluations' },
  { id: 'rapports_view', label: 'Voir rapports', category: 'menu_analyse', description: 'Acces au menu Rapports' },
  { id: 'rapports_print', label: 'Imprimer rapports', category: 'menu_analyse', description: 'Imprimer les rapports' },
  { id: 'export', label: 'Exporter donnees', category: 'menu_analyse', description: 'Exporter les donnees en CSV/JSON' },
  // --- Systeme ---
  { id: 'dashboard_view', label: 'Voir dashboard', category: 'menu_systeme', description: 'Acces au tableau de bord' },
  { id: 'parametrage_view', label: 'Voir parametrage', category: 'menu_systeme', description: 'Acces au menu Parametrage' },
  { id: 'parametrage_edit', label: 'Modifier parametrage', category: 'menu_systeme', description: 'Modifier la configuration' },
  { id: 'users_view', label: 'Voir utilisateurs', category: 'menu_systeme', description: 'Voir la liste des utilisateurs' },
  { id: 'users_manage', label: 'Gerer utilisateurs', category: 'menu_systeme', description: 'Creer, modifier, supprimer des utilisateurs' },
  { id: 'bot', label: 'MaintBot', category: 'menu_systeme', description: 'Acces au chatbot MaintBot' },
  // --- Actions Metier ---
  { id: 'constat_chef', label: 'Constat chef atelier', category: 'actions_metier', description: 'Valider le constat terrain' },
  { id: 'val_production', label: 'Validation production', category: 'actions_metier', description: 'Valider la remise en production' },
  // --- Avance ---
  { id: 'pole_all', label: 'Acces tous les poles', category: 'avance', description: 'Voir les donnees de tous les poles' },
];

// --- DEFAULT ROLE PERMISSIONS ---
export const ROLES: Record<RoleId, RoleDefinition> = {
  admin: {
    id: 'admin',
    nom: 'Administrateur',
    niveau: 0,
    permissions: ['*'],
  },
  direction: {
    id: 'direction',
    nom: 'Direction',
    niveau: 1,
    permissions: [
      'interventions_view', 'interventions_all', 'interventions_workflow', 'interventions_validate',
      'signalements_view', 'signalements_create',
      'actions_view', 'planning_view',
      'machines_view',
      'preventif_create', 'preventif_edit', 'preventif_complete',
      'kpi_view', 'evaluations_view', 'stock_view', 'da_view', 'da_workflow',
      'st_view', 'st_workflow',
      'rapports_view', 'rapports_print', 'export', 'pole_all', 'bot',
      'dashboard_view', 'users_view',
    ],
  },
  resp_maintenance: {
    id: 'resp_maintenance',
    nom: 'Responsable Maintenance',
    niveau: 2,
    permissions: [
      'interventions_view', 'interventions_create', 'interventions_edit', 'interventions_delete', 'interventions_all', 'interventions_workflow', 'interventions_validate',
      'signalements_view', 'signalements_create',
      'actions_view', 'actions_create', 'actions_edit', 'actions_delete', 'planning_view',
      'machines_view', 'machines_edit',
      'preventif_create', 'preventif_edit', 'preventif_complete',
      'kpi_view', 'evaluations_view',
      'stock_view', 'stock_edit', 'stock_delete',
      'da_view', 'da_create', 'da_edit', 'da_delete', 'da_workflow',
      'st_view', 'st_create', 'st_edit', 'st_delete', 'st_workflow',
      'rapports_view', 'rapports_print', 'export', 'pole_all', 'bot',
      'parametrage_view',
      'dashboard_view', 'users_view', 'users_manage',
    ],
  },
  resp_pole: {
    id: 'resp_pole',
    nom: 'Responsable de Pole',
    niveau: 3,
    permissions: [
      'interventions_view', 'interventions_create', 'interventions_edit', 'interventions_workflow',
      'signalements_view', 'signalements_create',
      'actions_view', 'actions_create', 'actions_edit', 'planning_view',
      'machines_view',
      'preventif_create', 'preventif_edit', 'preventif_complete',
      'kpi_view', 'da_view', 'da_create', 'st_view',
      'rapports_view', 'rapports_print', 'export', 'bot', 'dashboard_view',
    ],
  },
  chef_atelier: {
    id: 'chef_atelier',
    nom: "Chef d'Atelier",
    niveau: 4,
    permissions: [
      'interventions_view', 'interventions_workflow', 'interventions_validate',
      'signalements_view', 'signalements_create',
      'actions_view', 'planning_view',
      'machines_view',
      'preventif_complete',
      'kpi_view', 'constat_chef', 'val_production',
      'rapports_view', 'bot', 'dashboard_view',
    ],
  },
  technicien: {
    id: 'technicien',
    nom: 'Technicien',
    niveau: 5,
    permissions: [
      'interventions_view', 'interventions_create', 'interventions_edit', 'interventions_workflow',
      'signalements_view',
      'actions_view', 'actions_create', 'planning_view',
      'machines_view',
      'preventif_complete',
      'stock_view', 'bot', 'dashboard_view',
    ],
  },
  operateur: {
    id: 'operateur',
    nom: 'Operateur',
    niveau: 6,
    permissions: [
      'signalements_view', 'signalements_create',
      'bot', 'dashboard_view',
    ],
  },
  magasinier: {
    id: 'magasinier',
    nom: 'Magasinier Maintenance',
    niveau: 5,
    permissions: [
      'stock_view', 'stock_edit', 'stock_import', 'stock_export', 'stock_delete',
      'da_view', 'da_create', 'da_edit', 'da_delete',
      'rapports_view', 'export', 'bot', 'dashboard_view',
    ],
  },
};

// --- DYNAMIC OVERRIDES (DB-backed via Store) ---

export function getCustomRolePermissions(): Record<string, string[]> {
  return Store.get<Record<string, string[]>>('role_permissions') || {};
}

export function setCustomRolePermissions(overrides: Record<string, string[]>): void {
  // Update local cache immediately
  Store.set('role_permissions', overrides);
  // Persist each role to the DB via API
  Object.entries(overrides).forEach(([roleId, permissions]) => {
    fetch('/api/data/role_permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: roleId, permissions }),
    }).catch(err => console.error('Save role_permissions error:', err));
  });
}

export function getEffectivePermissions(roleId: RoleId): string[] {
  if (roleId === 'admin') return ['*'];
  const defaults = ROLES[roleId]?.permissions || [];
  const overrides = getCustomRolePermissions();
  if (!overrides[roleId]) return defaults;
  // Merge: custom overrides + new default permissions not yet in overrides
  const custom = overrides[roleId];
  const merged = Array.from(new Set([...custom, ...defaults.filter((p) => !custom.includes(p) && p !== '*')]));
  return merged;
}

export function hasPermission(roleId: RoleId, perm: string): boolean {
  const perms = getEffectivePermissions(roleId);
  if (perms.includes('*')) return true;
  return perms.includes(perm);
}

export function getRolePerms(roleId: RoleId): string[] {
  return [...getEffectivePermissions(roleId)];
}

export function getAllRoles(): RoleDefinition[] {
  return Object.values(ROLES);
}

export function getRoleName(roleId: RoleId): string {
  return ROLES[roleId]?.nom || roleId;
}

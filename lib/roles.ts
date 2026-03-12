// ============================================================
// MaintPro v3+ — Roles & Permissions
// ============================================================

import { RoleId, RoleDefinition } from './types';

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
  { id: 'interventions_create', label: 'Creer interventions / signalements', category: 'menu_maintenance', description: 'Creer des interventions et signalements' },
  { id: 'interventions_edit', label: 'Modifier interventions', category: 'menu_maintenance', description: 'Modifier des interventions existantes' },
  { id: 'interventions_all', label: 'Voir toutes les interventions', category: 'menu_maintenance', description: 'Voir les interventions de tous les poles' },
  { id: 'planning_view', label: 'Voir preventif / planning', category: 'menu_maintenance', description: 'Acces au menu Preventif' },
  { id: 'actions_view', label: 'Voir actions', category: 'menu_maintenance', description: 'Acces a la liste des actions correctives' },
  { id: 'actions_create', label: 'Creer actions', category: 'menu_maintenance', description: 'Creer des actions correctives' },
  { id: 'actions_edit', label: 'Modifier actions', category: 'menu_maintenance', description: 'Modifier des actions existantes' },
  // --- Logistique ---
  { id: 'stock_view', label: 'Voir stock', category: 'menu_logistique', description: 'Acces au menu Stock' },
  { id: 'stock_edit', label: 'Modifier stock', category: 'menu_logistique', description: 'Entrees/sorties de stock' },
  { id: 'stock_import', label: 'Importer stock', category: 'menu_logistique', description: 'Importer des donnees de stock' },
  { id: 'stock_export', label: 'Exporter stock', category: 'menu_logistique', description: 'Exporter des donnees de stock' },
  { id: 'da_view', label: 'Voir demandes achat', category: 'menu_logistique', description: 'Acces au menu Demandes Achat' },
  { id: 'da_create', label: 'Creer demandes achat', category: 'menu_logistique', description: 'Creer des demandes d\'achat' },
  { id: 'da_edit', label: 'Modifier demandes achat', category: 'menu_logistique', description: 'Modifier les demandes d\'achat' },
  { id: 'da_workflow', label: 'Valider demandes achat', category: 'menu_logistique', description: 'Valider/refuser les DA' },
  { id: 'st_view', label: 'Voir sous-traitance', category: 'menu_logistique', description: 'Acces au menu Sous-traitance' },
  { id: 'st_create', label: 'Creer sous-traitance', category: 'menu_logistique', description: 'Creer des contrats de sous-traitance' },
  { id: 'st_edit', label: 'Modifier sous-traitance', category: 'menu_logistique', description: 'Modifier les sous-traitances' },
  // --- Analyse ---
  { id: 'kpi_view', label: 'Voir KPI', category: 'menu_analyse', description: 'Acces au menu KPI' },
  { id: 'evaluations_view', label: 'Voir evaluations', category: 'menu_analyse', description: 'Acces aux evaluations' },
  { id: 'rapports_view', label: 'Voir rapports', category: 'menu_analyse', description: 'Acces au menu Rapports' },
  { id: 'rapports_print', label: 'Imprimer rapports', category: 'menu_analyse', description: 'Imprimer les rapports' },
  { id: 'export', label: 'Exporter donnees', category: 'menu_analyse', description: 'Exporter les donnees en CSV/JSON' },
  // --- Systeme ---
  { id: 'parametrage_view', label: 'Voir parametrage', category: 'menu_systeme', description: 'Acces au menu Parametrage' },
  { id: 'parametrage_edit', label: 'Modifier parametrage', category: 'menu_systeme', description: 'Modifier la configuration' },
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
      'interventions_view', 'interventions_all', 'actions_view', 'planning_view',
      'kpi_view', 'evaluations_view', 'stock_view', 'da_view', 'da_workflow',
      'st_view', 'rapports_view', 'rapports_print', 'export', 'pole_all', 'bot',
    ],
  },
  resp_maintenance: {
    id: 'resp_maintenance',
    nom: 'Responsable Maintenance',
    niveau: 2,
    permissions: [
      'interventions_view', 'interventions_create', 'interventions_edit', 'interventions_all',
      'actions_view', 'actions_create', 'actions_edit', 'planning_view',
      'kpi_view', 'evaluations_view', 'stock_view', 'stock_edit',
      'da_view', 'da_create', 'da_edit', 'da_workflow',
      'st_view', 'st_create', 'st_edit',
      'rapports_view', 'rapports_print', 'export', 'pole_all', 'bot',
      'parametrage_view',
    ],
  },
  resp_pole: {
    id: 'resp_pole',
    nom: 'Responsable de Pole',
    niveau: 3,
    permissions: [
      'interventions_view', 'actions_view', 'planning_view',
      'kpi_view', 'da_view', 'st_view',
      'rapports_view', 'rapports_print', 'export', 'bot',
    ],
  },
  chef_atelier: {
    id: 'chef_atelier',
    nom: "Chef d'Atelier",
    niveau: 4,
    permissions: [
      'interventions_view', 'actions_view', 'planning_view',
      'kpi_view', 'constat_chef', 'val_production',
      'rapports_view', 'bot',
    ],
  },
  technicien: {
    id: 'technicien',
    nom: 'Technicien',
    niveau: 5,
    permissions: [
      'interventions_view', 'interventions_create', 'interventions_edit',
      'actions_view', 'actions_create', 'planning_view',
      'stock_view', 'bot',
    ],
  },
  operateur: {
    id: 'operateur',
    nom: 'Operateur',
    niveau: 6,
    permissions: [
      'interventions_view', 'interventions_create', 'bot',
    ],
  },
  magasinier: {
    id: 'magasinier',
    nom: 'Magasinier Maintenance',
    niveau: 5,
    permissions: [
      'stock_view', 'stock_edit', 'stock_import', 'stock_export',
      'da_view', 'da_create', 'rapports_view', 'export', 'bot',
    ],
  },
};

// --- DYNAMIC OVERRIDES ---
const OVERRIDES_KEY = 'mp3_role_permissions';

export function getCustomRolePermissions(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCustomRolePermissions(overrides: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function getEffectivePermissions(roleId: RoleId): string[] {
  if (roleId === 'admin') return ['*'];
  const overrides = getCustomRolePermissions();
  if (overrides[roleId]) return overrides[roleId];
  return ROLES[roleId]?.permissions || [];
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

// ============================================================
// MaintPro v3+ — Roles & Permissions
// ============================================================

import { RoleId, RoleDefinition } from './types';

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

export function hasPermission(roleId: RoleId, perm: string): boolean {
  const role = ROLES[roleId];
  if (!role) return false;
  if (role.permissions.includes('*')) return true;
  return role.permissions.includes(perm);
}

export function getRolePerms(roleId: RoleId): string[] {
  const role = ROLES[roleId];
  if (!role) return [];
  return [...role.permissions];
}

export function getAllRoles(): RoleDefinition[] {
  return Object.values(ROLES);
}

export function getRoleName(roleId: RoleId): string {
  return ROLES[roleId]?.nom || roleId;
}

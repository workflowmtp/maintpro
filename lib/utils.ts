// ============================================================
// MaintPro v3+ — Utility functions
// ============================================================

import { CURRENCY } from './config';
import Store from './store';

export function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const dd = ('0' + d.getDate()).slice(-2);
  const mm = ('0' + (d.getMonth() + 1)).slice(-2);
  return dd + '/' + mm + '/' + d.getFullYear();
}

export function formatDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const dd = ('0' + d.getDate()).slice(-2);
  const mm = ('0' + (d.getMonth() + 1)).slice(-2);
  const hh = ('0' + d.getHours()).slice(-2);
  const mi = ('0' + d.getMinutes()).slice(-2);
  return dd + '/' + mm + '/' + d.getFullYear() + ' ' + hh + ':' + mi;
}

export function formatMoney(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString('fr-FR') + ' ' + CURRENCY;
}

export function formatFullDate(d: Date): string {
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const mois = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
  ];
  return jours[d.getDay()] + ' ' + d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear();
}

export function getPoleName(poleId: string | null | undefined): string {
  if (!poleId) return '-';
  const pole = Store.findById<{ id: string; nom: string }>('poles', poleId);
  return pole ? pole.nom : '-';
}

export function getMachineName(machineId: string | null | undefined): string {
  if (!machineId) return '-';
  const m = Store.findById<{ id: string; nom: string }>('machines', machineId);
  return m ? m.nom : '-';
}

export function getTechName(techId: string | null | undefined): string {
  if (!techId) return '-';
  const t = Store.findById<{ id: string; nom: string }>('users', techId);
  return t ? t.nom : '-';
}

export function getOperateurName(opId: string | null | undefined): string {
  if (!opId) return '-';
  const o = Store.findById<{ id: string; nom: string }>('users', opId);
  return o ? o.nom : '-';
}

export function getChefName(chefId: string | null | undefined): string {
  if (!chefId) return '-';
  const c = Store.findById<{ id: string; nom: string }>('users', chefId);
  return c ? c.nom : '-';
}

export function getUsersByRole(role: string): { id: string; nom: string; role: string; pole_id?: string; email?: string }[] {
  return Store.getAll<{ id: string; nom: string; role: string; pole_id?: string; email?: string }>('users').filter((u) => u.role === role);
}

export function getAtelierName(atelId: string | null | undefined): string {
  if (!atelId) return '-';
  const a = Store.findById<{ id: string; nom: string }>('ateliers', atelId);
  return a ? a.nom : '-';
}

export function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function toLocalDT(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  const h = ('0' + d.getHours()).slice(-2);
  const min = ('0' + d.getMinutes()).slice(-2);
  return y + '-' + m + '-' + day + 'T' + h + ':' + min;
}

// Badge CSS class mapping
export function getStatusBadgeClass(statut: string): string {
  const map: Record<string, string> = {
    'Brouillon': 'badge-purple',
    'Soumise': 'badge-blue',
    'Validee': 'badge-green',
    'Commandee': 'badge-cyan',
    'Receptionnee': 'badge-green',
    'Refusee': 'badge-red',
    'En attente autorisation': 'badge-orange',
    'Autorise': 'badge-blue',
    'En cours': 'badge-blue',
    'Termine': 'badge-green',
    'Valide production': 'badge-green',
    'En attente piece': 'badge-orange',
    'Ouverte': 'badge-blue',
    'En retard': 'badge-red',
    'Demandee': 'badge-purple',
    'Annulee': 'badge-red',
    'Critique': 'badge-red',
    'Haute': 'badge-orange',
    'Moyenne': 'badge-blue',
    'Faible': 'badge-purple',
    'Nouveau': 'badge-orange',
    'Qualifie': 'badge-blue',
    'Intervention creee': 'badge-green',
  };
  return map[statut] || 'badge-blue';
}

export function getCriticiteBadgeClass(crit: string): string {
  const map: Record<string, string> = {
    'Critique': 'badge-red',
    'Important': 'badge-orange',
    'Standard': 'badge-blue',
  };
  return map[crit] || 'badge-blue';
}

export function filterByPole<T extends { pole_id?: string }>(items: T[], poleId: string | null): T[] {
  if (!poleId || poleId === 'all') return items;
  return items.filter((item) => item.pole_id === poleId);
}

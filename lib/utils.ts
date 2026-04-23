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

// --- Global CSV Export ---
const EXPORT_COLLECTIONS: { key: string; label: string; resolve: Record<string, string> }[] = [
  { key: 'interventions', label: 'Interventions', resolve: { machine_id: 'machines', pole_id: 'poles', atelier_id: 'ateliers', technicien_principal_id: 'techniciens', cause_id: 'causes' } },
  { key: 'signalements', label: 'Signalements', resolve: { machine_id: 'machines', pole_id: 'poles', atelier_id: 'ateliers', operateur_id: 'operateurs' } },
  { key: 'taches_preventives', label: 'Taches_Preventives', resolve: { machine_id: 'machines', organe_id: 'organes', piece_id: 'pieces' } },
  { key: 'demandes_achat', label: 'Demandes_Achat', resolve: { machine_id: 'machines', pole_id: 'poles', piece_id: 'pieces' } },
  { key: 'sous_traitances', label: 'Sous_Traitances', resolve: { machine_id: 'machines', pole_id: 'poles' } },
  { key: 'actions', label: 'Actions', resolve: { intervention_id: 'interventions' } },
  { key: 'machines', label: 'Machines', resolve: { pole_id: 'poles', atelier_id: 'ateliers' } },
  { key: 'organes', label: 'Organes', resolve: { machine_id: 'machines' } },
  { key: 'pieces', label: 'Pieces', resolve: {} },
  { key: 'stock_movements', label: 'Mouvements_Stock', resolve: { piece_id: 'pieces' } },
  { key: 'causes', label: 'Causes', resolve: {} },
  { key: 'poles', label: 'Poles', resolve: {} },
  { key: 'ateliers', label: 'Ateliers', resolve: { pole_id: 'poles' } },
  { key: 'techniciens', label: 'Techniciens', resolve: { pole_id: 'poles' } },
  { key: 'operateurs', label: 'Operateurs', resolve: { pole_id: 'poles', atelier_id: 'ateliers' } },
  { key: 'chefs_atelier', label: 'Chefs_Atelier', resolve: { pole_id: 'poles', atelier_id: 'ateliers' } },
  { key: 'users', label: 'Utilisateurs', resolve: { pole_id: 'poles' } },
  { key: 'prev_completions', label: 'Validations_Preventif', resolve: {} },
];

function resolveName(collection: string, id: string | null | undefined): string {
  if (!id) return '';
  const item = Store.findById<{ nom?: string; designation?: string; ref?: string } & { id: string }>(collection, id);
  return item?.nom || item?.designation || item?.ref || id;
}

function flattenObject(obj: Record<string, any>, resolveMap: Record<string, string>): Record<string, string> {
  const row: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      row[key] = '';
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      // Flatten nested objects (e.g. workflow, qualification)
      for (const [subKey, subVal] of Object.entries(val)) {
        if (typeof subVal === 'object' && subVal !== null) {
          row[key + '_' + subKey] = JSON.stringify(subVal);
        } else {
          row[key + '_' + subKey] = String(subVal ?? '');
        }
      }
    } else if (Array.isArray(val)) {
      row[key] = val.map((v: any) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('; ');
    } else {
      // Resolve foreign keys to names
      if (resolveMap[key] && typeof val === 'string') {
        row[key] = resolveName(resolveMap[key], val) || val;
        row[key + '_id'] = val;
      } else {
        row[key] = String(val);
      }
    }
  }
  return row;
}

function collectionToCSV(key: string, resolveMap: Record<string, string>): string {
  const items = Store.getAll<Record<string, any>>(key);
  if (items.length === 0) return '';
  const rows = items.map((item) => flattenObject(item, resolveMap));
  // Collect all column headers
  const colSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => colSet.add(k)));
  const cols = Array.from(colSet).sort();
  const header = cols.join(';');
  const lines = rows.map((r) => cols.map((c) => {
    const v = r[c] || '';
    return v.includes(';') || v.includes('"') || v.includes('\n') ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(';'));
  return header + '\n' + lines.join('\n');
}

export function exportAllCSV(): void {
  const parts: string[] = [];
  for (const col of EXPORT_COLLECTIONS) {
    const csv = collectionToCSV(col.key, col.resolve);
    if (csv) {
      parts.push('=== ' + col.label + ' ===\n' + csv);
    }
  }
  const content = parts.join('\n\n');
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'maintpro_export_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function exportCollectionCSV(key: string, label: string, resolveMap?: Record<string, string>): void {
  const csv = collectionToCSV(key, resolveMap || {});
  if (!csv) return;
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = label.toLowerCase() + '_export_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

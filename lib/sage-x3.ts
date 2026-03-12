// ============================================================
// MaintPro v3+ — Connecteur Sage X3 (couche abstraction)
// ============================================================
// Architecture: Mirror Database / Datamart approach
// MaintPro ne requete JAMAIS directement la base Sage X3 production.
// ETL (n8n, Talend) synchronise vers un datamart intermediaire.
//
// Flux: Sage X3 (prod) --> ETL --> Datamart --> MaintPro (lecture)
//       MaintPro (ecriture) --> API Backend --> Sage X3 (prod)

import { SAGE_X3_CONFIG } from './config';

export const TABLE_MAP = {
  pieces: {
    sage_table: 'ITMMASTER',
    fields: { ref: 'ITMREF', designation: 'ITMDES1', prix_unitaire: 'BASPRI', stock_actuel: 'PHYSTO', emplacement: 'LOC', fournisseur: 'BPSNUM' },
  },
  stock_movements: {
    sage_table: 'STOJOU',
    fields: { piece_id: 'ITMREF', type: 'TRSTYP', quantite: 'QTYSTU', date: 'IPTDAT', commentaire: 'DESSION' },
  },
  demandes_achat: {
    sage_table: 'PREQUEST',
    fields: { ref: 'PRHNUM', designation: 'PRHDES', quantite: 'QTYREQ', montant_estime: 'EXTAMT', fournisseur_propose: 'BPSNUM', statut: 'PRHSTA' },
  },
  fournisseurs: {
    sage_table: 'BPSUPPLIER',
    fields: { code: 'BPSNUM', nom: 'BPSNAM', contact: 'CNTNAM', telephone: 'TEL', email: 'WEB' },
  },
};

export const STATUS_MAP_DA: Record<string, number> = {
  'Brouillon': 1, 'Soumise': 2, 'Validee': 3, 'Commandee': 4, 'Receptionnee': 5, 'Refusee': 6,
};

export function isEnabled(): boolean {
  return SAGE_X3_CONFIG?.enabled === true;
}

export function apiCall(
  method: string, endpoint: string, data?: any
): Promise<any> {
  if (!isEnabled()) {
    console.log('[SageX3] Integration desactivee - mode localStorage');
    return Promise.resolve(null);
  }

  const url = SAGE_X3_CONFIG.api_base_url + endpoint;
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(SAGE_X3_CONFIG.auth_token ? { 'Authorization': 'Bearer ' + SAGE_X3_CONFIG.auth_token } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  }).then((r) => r.json());
}

export function syncStock() {
  return apiCall('GET', SAGE_X3_CONFIG.endpoints.stock);
}

export function syncSuppliers() {
  return apiCall('GET', SAGE_X3_CONFIG.endpoints.suppliers);
}

export function pushDA(daData: any) {
  const sageData = {
    PRHDES: daData.designation, QTYREQ: daData.quantite, EXTAMT: daData.montant_estime,
    BPSNUM: daData.fournisseur_propose || '', PRHSTA: STATUS_MAP_DA[daData.statut] || 1,
    SITE: SAGE_X3_CONFIG.site_code, CPY: SAGE_X3_CONFIG.company_code,
  };
  return apiCall('POST', SAGE_X3_CONFIG.endpoints.purchase_requests, sageData);
}

export function pushStockMovement(mvtData: any) {
  const sageData = {
    ITMREF: mvtData.piece_ref || '', TRSTYP: mvtData.type === 'Entree' ? 'RCT' : 'ISS',
    QTYSTU: mvtData.quantite, LOC: mvtData.emplacement || '',
    DESSION: mvtData.commentaire || '', SITE: SAGE_X3_CONFIG.site_code,
  };
  return apiCall('POST', SAGE_X3_CONFIG.endpoints.stock_movements, sageData);
}

export function getConnectionStatus() {
  return {
    enabled: isEnabled(),
    api_url: SAGE_X3_CONFIG.api_base_url,
    mirror_url: SAGE_X3_CONFIG.mirror_db_url,
    company: SAGE_X3_CONFIG.company_code,
    site: SAGE_X3_CONFIG.site_code,
    tables_mapped: Object.keys(TABLE_MAP).length,
  };
}

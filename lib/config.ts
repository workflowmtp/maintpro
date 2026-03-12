// ============================================================
// MaintPro v3+ — Configuration globale
// ============================================================

import { Pole, CompanyInfo, SageX3Config } from './types';

export const APP_NAME = 'MaintPro v3+';
export const VERSION = '3.0.0';
export const STORAGE_PREFIX = 'mp3_';
export const CURRENCY = 'FCFA';
export const DEFAULT_PIN = '1234';

export const COMPANY_DEFAULT: CompanyInfo = {
  nom: 'MULTIPRINT S.A.',
  adresse: 'Zone Industrielle Bassa, B.P. 1234 Douala, Cameroun',
  tel: '+237 233 XX XX XX',
  email: 'maintenance@multiprint.cm',
  logo_text: 'MULTIPRINT',
};

export const POLES: Pole[] = [
  { id: 'pole_oe', nom: 'Offset Etiquette', code: 'OE' },
  { id: 'pole_hf', nom: 'Heliogravure Flexible', code: 'HF' },
  { id: 'pole_oc', nom: 'Offset Carton', code: 'OC' },
  { id: 'pole_bc', nom: 'Bouchon Couronne / Capsule', code: 'BC' },
];

export const SAGE_X3_CONFIG: SageX3Config = {
  enabled: false,
  api_base_url: 'https://sage-x3.multiprint.local/api/v1',
  mirror_db_url: 'https://datamart.multiprint.local/api',
  auth_type: 'bearer',
  auth_token: '',
  sync_interval_minutes: 15,
  company_code: 'MULTIPRINT',
  site_code: 'DLA',
  endpoints: {
    stock: '/stock/items',
    stock_movements: '/stock/movements',
    purchase_orders: '/purchasing/orders',
    purchase_requests: '/purchasing/requests',
    suppliers: '/purchasing/suppliers',
    cost_centers: '/accounting/costcenters',
    fixed_assets: '/assets/items',
    employees: '/hr/employees',
    work_orders: '/manufacturing/workorders',
  },
};

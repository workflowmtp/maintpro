// ============================================================
// MaintPro v3+ — TypeScript Type Definitions
// ============================================================

// --- POLES & ATELIERS ---
export interface Pole {
  id: string;
  nom: string;
  code: string;
}

export interface Atelier {
  id: string;
  nom: string;
  pole_id: string;
}

// --- PERSONNEL ---
export interface Technicien {
  id: string;
  nom: string;
  specialite: 'Mecanique' | 'Electricite' | 'Polyvalent';
  pole_id: string;
  tel: string;
}

export interface Operateur {
  id: string;
  nom: string;
  pole_id: string;
  atelier_id: string;
}

export interface ChefAtelier {
  id: string;
  nom: string;
  pole_id: string;
  atelier_id: string;
}

export interface User {
  id: string;
  nom: string;
  email: string;
  password?: string;
  login: string;
  role: RoleId;
  pole_id: string | null;
  actif: boolean;
}

// --- ROLES ---
export type RoleId =
  | 'admin'
  | 'direction'
  | 'resp_maintenance'
  | 'resp_pole'
  | 'chef_atelier'
  | 'technicien'
  | 'operateur'
  | 'magasinier';

export interface RoleDefinition {
  id: RoleId;
  nom: string;
  niveau: number;
  permissions: string[];
}

// --- MACHINES & ORGANES ---
export interface TechnicienAffecte {
  technicien_id: string;
  role: 'Principal' | 'Secondaire' | 'Support';
  specialite: string;
}

export interface Machine {
  id: string;
  nom: string;
  code: string;
  pole_id: string;
  atelier_id: string;
  criticite: 'Critique' | 'Important' | 'Standard';
  chef_atelier_id: string;
  etat: 'En service' | 'En panne' | 'Arret programme';
  disponibilite: number;
  heures_prevues_mois: number;
  heures_courantes: number;
  tours_courants: number;
  techniciens_affectes: TechnicienAffecte[];
}

export interface Organe {
  id: string;
  nom: string;
  machine_id: string;
  type: string;
}

// --- CAUSES ---
export interface Cause {
  id: string;
  nom: string;
  categorie: string;
}

// --- PIECES DE RECHANGE ---
export interface Piece {
  id: string;
  ref: string;
  designation: string;
  prix_unitaire: number;
  emplacement: string;
  machine_id: string | null;
  organe_id: string | null;
  stock_actuel: number;
  seuil_reappro: number;
  fournisseur: string;
  delai_livraison: number;
}

// --- INTERVENTIONS ---
export interface PieceUtilisee {
  piece_id: string;
  quantite: number;
}

export interface WorkflowStepData {
  completed?: boolean;
  [key: string]: any;
}

export interface InterventionWorkflow {
  current_step?: number;
  step1?: WorkflowStepData;
  step2?: WorkflowStepData;
  step3?: WorkflowStepData;
  step4?: WorkflowStepData;
  step5?: WorkflowStepData & { duree_minutes?: number; duree_ms?: number; notes?: string };
  step6?: WorkflowStepData & { duree_minutes?: number; duree_ms?: number; travaux?: string; pieces_utilisees?: PieceUtilisee[] };
  step7?: WorkflowStepData;
  step8?: WorkflowStepData;
}

export type InterventionType = 'Curatif' | 'Preventif';
export type InterventionStatut =
  | 'Brouillon'
  | 'En attente autorisation'
  | 'Autorise'
  | 'En cours'
  | 'Termine'
  | 'Valide production'
  | 'En attente piece';

export interface Intervention {
  id: string;
  ref: string;
  date: string;
  machine_id: string;
  pole_id: string;
  atelier_id: string;
  technicien_principal_id: string;
  techniciens_participants: string[];
  type: InterventionType;
  statut: InterventionStatut;
  description: string;
  cause_id: string | null;
  pieces_utilisees: PieceUtilisee[];
  duree_minutes: number;
  duree_diagnostic_min: number;
  duree_intervention_min: number;
  panne_repetitive: boolean;
  operateur_id: string | null;
  chef_validation_id: string | null;
  workflow: InterventionWorkflow;
  signalement_id?: string;
}

// --- ACTIONS ---
export interface Action {
  id: string;
  intervention_id: string | null;
  description: string;
  responsable: string;
  echeance: string;
  statut: 'Ouverte' | 'En cours' | 'En retard' | 'Terminee';
  priorite: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  date_creation: string;
}

// --- STOCK MOVEMENTS ---
export interface StockMovement {
  id: string;
  piece_id: string;
  type: 'Entree' | 'Sortie';
  quantite: number;
  date: string;
  intervention_id: string | null;
  commentaire: string;
  operateur: string;
}

// --- DEMANDES D'ACHAT ---
export type DAStatut = 'Brouillon' | 'Soumise' | 'Validee' | 'Commandee' | 'Receptionnee' | 'Refusee';

export interface DemandeAchat {
  id: string;
  ref: string;
  date: string;
  pole_id: string;
  type_achat: string;
  urgence: string;
  designation: string;
  quantite: number;
  montant_estime: number;
  fournisseur_propose: string;
  date_souhaitee: string;
  machine_id: string;
  intervention_id: string;
  piece_id: string;
  st_id: string;
  demandeur: string;
  justification: string;
  statut: DAStatut;
}

// --- SOUS-TRAITANCE ---
export interface SousTraitance {
  id: string;
  ref: string;
  date: string;
  pole_id: string;
  prestataire: string;
  contact: string;
  objet: string;
  machine_id: string;
  intervention_id: string;
  montant: number;
  date_debut_prevue: string;
  date_fin_prevue: string;
  bon_commande: string;
  statut: 'Demandee' | 'Validee' | 'En cours' | 'Terminee' | 'Annulee';
  observations: string;
}

// --- TACHES PREVENTIVES ---
export interface TachePreventive {
  id: string;
  machine_id: string;
  organe_id: string | null;
  piece_id: string | null;
  tache: string;
  frequence: string;
  duree_std_min: number;
  type_seuil: 'Periode' | 'Heures' | 'Tours' | 'Combine';
  seuil_valeur: number;
  alerte_avant_jours: number;
}

// --- SIGNALEMENTS ---
export interface SignalementQualification {
  chef_id: string;
  date: string;
  impact_production: string;
  constat_terrain: string;
  priorite_production: string;
  commentaire: string;
  completed: boolean;
}

export interface Signalement {
  id: string;
  ref: string;
  date_signalement: string;
  operateur_id: string;
  pole_id: string;
  atelier_id: string;
  machine_id: string;
  dysfonctionnement: string;
  symptome: string;
  machine_arretee: 'oui' | 'non';
  urgence_percue: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  statut: 'Nouveau' | 'Qualifie' | 'Intervention creee';
  intervention_id: string | null;
  qualification: SignalementQualification | null;
}

// --- COMPANY INFO ---
export interface CompanyInfo {
  nom: string;
  adresse: string;
  tel: string;
  email: string;
  logo_text: string;
}

// --- BOT ---
export interface BotMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

// --- SAGE X3 ---
export interface SageX3Config {
  enabled: boolean;
  api_base_url: string;
  mirror_db_url: string;
  auth_type: string;
  auth_token: string;
  sync_interval_minutes: number;
  company_code: string;
  site_code: string;
  endpoints: Record<string, string>;
}

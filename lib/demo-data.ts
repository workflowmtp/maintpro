// ============================================================
// MaintPro v3+ — Donnees de demonstration
// ============================================================

import Store from './store';
import { POLES, COMPANY_DEFAULT } from './config';
import type {
  Atelier, Technicien, Operateur, ChefAtelier, Machine, Organe, Cause,
  Piece, Intervention, Action, StockMovement, DemandeAchat, SousTraitance,
  TachePreventive, User, Signalement,
} from './types';

export function initDemoData(): void {
  if (Store.get('demo_loaded')) return;

  Store.set('poles', POLES);

  // --- ATELIERS ---
  const ateliers: Atelier[] = [
    { id: 'atl_oe1', nom: 'Atelier Impression OE', pole_id: 'pole_oe' },
    { id: 'atl_oe2', nom: 'Atelier Decoupe OE', pole_id: 'pole_oe' },
    { id: 'atl_hf1', nom: 'Atelier Impression HF', pole_id: 'pole_hf' },
    { id: 'atl_hf2', nom: 'Atelier Complexage HF', pole_id: 'pole_hf' },
    { id: 'atl_oc1', nom: 'Atelier Impression OC', pole_id: 'pole_oc' },
    { id: 'atl_oc2', nom: 'Atelier Faconnage OC', pole_id: 'pole_oc' },
    { id: 'atl_bc1', nom: 'Atelier Presse BC', pole_id: 'pole_bc' },
    { id: 'atl_bc2', nom: 'Atelier Assemblage BC', pole_id: 'pole_bc' },
  ];
  Store.set('ateliers', ateliers);

  // --- TECHNICIENS ---
  const techniciens: Technicien[] = [
    { id: 'tech_01', nom: 'Mbarga Jean', specialite: 'Mecanique', pole_id: 'pole_oe', tel: '690001111' },
    { id: 'tech_02', nom: 'Nkoulou Paul', specialite: 'Electricite', pole_id: 'pole_oe', tel: '690002222' },
    { id: 'tech_03', nom: 'Fotso Albert', specialite: 'Mecanique', pole_id: 'pole_hf', tel: '690003333' },
    { id: 'tech_04', nom: 'Tchinda Marie', specialite: 'Electricite', pole_id: 'pole_hf', tel: '690004444' },
    { id: 'tech_05', nom: 'Essomba Pierre', specialite: 'Polyvalent', pole_id: 'pole_oc', tel: '690005555' },
    { id: 'tech_06', nom: 'Ngando Felix', specialite: 'Mecanique', pole_id: 'pole_oc', tel: '690006666' },
    { id: 'tech_07', nom: 'Biya Charles', specialite: 'Electricite', pole_id: 'pole_bc', tel: '690007777' },
    { id: 'tech_08', nom: 'Ateba Samuel', specialite: 'Polyvalent', pole_id: 'pole_bc', tel: '690008888' },
  ];
  Store.set('techniciens', techniciens);

  // --- OPERATEURS ---
  const operateurs: Operateur[] = [
    { id: 'op_01', nom: 'Ondoua Martin', pole_id: 'pole_oe', atelier_id: 'atl_oe1' },
    { id: 'op_02', nom: 'Nana Celine', pole_id: 'pole_hf', atelier_id: 'atl_hf1' },
    { id: 'op_03', nom: 'Kamga Eric', pole_id: 'pole_oc', atelier_id: 'atl_oc1' },
    { id: 'op_04', nom: 'Djomba Alain', pole_id: 'pole_bc', atelier_id: 'atl_bc1' },
  ];
  Store.set('operateurs', operateurs);

  // --- CHEFS D'ATELIER ---
  const chefs: ChefAtelier[] = [
    { id: 'chef_01', nom: 'Messi Roger', pole_id: 'pole_oe', atelier_id: 'atl_oe1' },
    { id: 'chef_02', nom: 'Tamba Jacques', pole_id: 'pole_hf', atelier_id: 'atl_hf1' },
    { id: 'chef_03', nom: 'Nguema Daniel', pole_id: 'pole_oc', atelier_id: 'atl_oc1' },
    { id: 'chef_04', nom: 'Fouda Michel', pole_id: 'pole_bc', atelier_id: 'atl_bc1' },
  ];
  Store.set('chefs_atelier', chefs);

  // --- CAUSES ---
  const causes: Cause[] = [
    { id: 'cause_01', nom: 'Usure mecanique', categorie: 'Mecanique' },
    { id: 'cause_02', nom: 'Court-circuit', categorie: 'Electrique' },
    { id: 'cause_03', nom: 'Reglage incorrect', categorie: 'Operationnel' },
    { id: 'cause_04', nom: 'Defaut matiere premiere', categorie: 'Matiere' },
    { id: 'cause_05', nom: 'Surchauffe', categorie: 'Thermique' },
    { id: 'cause_06', nom: 'Fuite pneumatique', categorie: 'Pneumatique' },
    { id: 'cause_07', nom: 'Fuite hydraulique', categorie: 'Hydraulique' },
    { id: 'cause_08', nom: 'Capteur defaillant', categorie: 'Electronique' },
    { id: 'cause_09', nom: 'Mauvais entretien preventif', categorie: 'Organisation' },
  ];
  Store.set('causes', causes);

  // --- MACHINES ---
  const machines: Machine[] = [
    {
      id: 'mach_01', nom: 'Offset Gallus RCS330', code: 'OE-G330',
      pole_id: 'pole_oe', atelier_id: 'atl_oe1', criticite: 'Critique',
      chef_atelier_id: 'chef_01', etat: 'En service', disponibilite: 92,
      heures_prevues_mois: 400, heures_courantes: 12580, tours_courants: 0,
      techniciens_affectes: [
        { technicien_id: 'tech_01', role: 'Principal', specialite: 'Mecanique' },
        { technicien_id: 'tech_02', role: 'Secondaire', specialite: 'Electricite' },
      ],
    },
    {
      id: 'mach_02', nom: 'Offset Nilpeter FA-4', code: 'OE-NF4',
      pole_id: 'pole_oe', atelier_id: 'atl_oe1', criticite: 'Important',
      chef_atelier_id: 'chef_01', etat: 'En service', disponibilite: 88,
      heures_prevues_mois: 350, heures_courantes: 9400, tours_courants: 0,
      techniciens_affectes: [
        { technicien_id: 'tech_01', role: 'Principal', specialite: 'Mecanique' },
        { technicien_id: 'tech_02', role: 'Support', specialite: 'Electricite' },
      ],
    },
    {
      id: 'mach_03', nom: 'Helio Bobst CL850', code: 'HF-CL850',
      pole_id: 'pole_hf', atelier_id: 'atl_hf1', criticite: 'Critique',
      chef_atelier_id: 'chef_02', etat: 'En service', disponibilite: 85,
      heures_prevues_mois: 450, heures_courantes: 18200, tours_courants: 0,
      techniciens_affectes: [
        { technicien_id: 'tech_03', role: 'Principal', specialite: 'Mecanique' },
        { technicien_id: 'tech_04', role: 'Principal', specialite: 'Electricite' },
      ],
    },
    {
      id: 'mach_04', nom: 'Complexeuse Nordmeccanica', code: 'HF-NMC',
      pole_id: 'pole_hf', atelier_id: 'atl_hf2', criticite: 'Important',
      chef_atelier_id: 'chef_02', etat: 'En panne', disponibilite: 60,
      heures_prevues_mois: 300, heures_courantes: 7800, tours_courants: 0,
      techniciens_affectes: [
        { technicien_id: 'tech_03', role: 'Principal', specialite: 'Mecanique' },
        { technicien_id: 'tech_04', role: 'Secondaire', specialite: 'Electricite' },
      ],
    },
    {
      id: 'mach_05', nom: 'Offset KBA Rapida 106', code: 'OC-KBA106',
      pole_id: 'pole_oc', atelier_id: 'atl_oc1', criticite: 'Critique',
      chef_atelier_id: 'chef_03', etat: 'En service', disponibilite: 90,
      heures_prevues_mois: 500, heures_courantes: 22100, tours_courants: 0,
      techniciens_affectes: [
        { technicien_id: 'tech_05', role: 'Principal', specialite: 'Polyvalent' },
        { technicien_id: 'tech_06', role: 'Secondaire', specialite: 'Mecanique' },
      ],
    },
    {
      id: 'mach_06', nom: 'Plieuse-colleuse Bobst Expertfold', code: 'OC-BEF',
      pole_id: 'pole_oc', atelier_id: 'atl_oc2', criticite: 'Standard',
      chef_atelier_id: 'chef_03', etat: 'En service', disponibilite: 95,
      heures_prevues_mois: 300, heures_courantes: 5600, tours_courants: 0,
      techniciens_affectes: [
        { technicien_id: 'tech_06', role: 'Principal', specialite: 'Mecanique' },
      ],
    },
    {
      id: 'mach_07', nom: 'Presse Sacmi PH490', code: 'BC-PH490',
      pole_id: 'pole_bc', atelier_id: 'atl_bc1', criticite: 'Critique',
      chef_atelier_id: 'chef_04', etat: 'En service', disponibilite: 87,
      heures_prevues_mois: 600, heures_courantes: 31500, tours_courants: 4200000,
      techniciens_affectes: [
        { technicien_id: 'tech_07', role: 'Principal', specialite: 'Electricite' },
        { technicien_id: 'tech_08', role: 'Principal', specialite: 'Polyvalent' },
      ],
    },
    {
      id: 'mach_08', nom: 'Presse Sacmi CCM30', code: 'BC-CCM30',
      pole_id: 'pole_bc', atelier_id: 'atl_bc2', criticite: 'Important',
      chef_atelier_id: 'chef_04', etat: 'En service', disponibilite: 91,
      heures_prevues_mois: 500, heures_courantes: 26000, tours_courants: 3500000,
      techniciens_affectes: [
        { technicien_id: 'tech_07', role: 'Secondaire', specialite: 'Electricite' },
        { technicien_id: 'tech_08', role: 'Principal', specialite: 'Polyvalent' },
      ],
    },
  ];
  Store.set('machines', machines);

  // --- ORGANES ---
  const organes: Organe[] = [
    { id: 'org_01', nom: 'Groupe imprimant 1', machine_id: 'mach_01', type: 'Impression' },
    { id: 'org_02', nom: 'Derouleur', machine_id: 'mach_01', type: 'Alimentation' },
    { id: 'org_03', nom: 'Secheur UV', machine_id: 'mach_01', type: 'Sechage' },
    { id: 'org_04', nom: 'Cylindre trameur', machine_id: 'mach_03', type: 'Impression' },
    { id: 'org_05', nom: 'Systeme de regulation viscosite', machine_id: 'mach_03', type: 'Encrage' },
    { id: 'org_06', nom: 'Margeur', machine_id: 'mach_05', type: 'Alimentation' },
    { id: 'org_07', nom: 'Moule compression', machine_id: 'mach_07', type: 'Moulage' },
    { id: 'org_08', nom: 'Systeme hydraulique', machine_id: 'mach_07', type: 'Puissance' },
  ];
  Store.set('organes', organes);

  // --- PIECES ---
  const pieces: Piece[] = [
    { id: 'pce_01', ref: 'RLM-G330-01', designation: 'Roulement SKF 6205', prix_unitaire: 25000, emplacement: 'Mag-A1', machine_id: 'mach_01', organe_id: 'org_01', stock_actuel: 4, seuil_reappro: 2, fournisseur: 'SKF Cameroun', delai_livraison: 14 },
    { id: 'pce_02', ref: 'CRE-G330-01', designation: 'Courroie dentee HTD8M', prix_unitaire: 85000, emplacement: 'Mag-A2', machine_id: 'mach_01', organe_id: 'org_02', stock_actuel: 1, seuil_reappro: 2, fournisseur: 'Gates Europe', delai_livraison: 30 },
    { id: 'pce_03', ref: 'LAM-UV-01', designation: 'Lampe UV 200W', prix_unitaire: 320000, emplacement: 'Mag-B1', machine_id: 'mach_01', organe_id: 'org_03', stock_actuel: 0, seuil_reappro: 1, fournisseur: 'Heraeus', delai_livraison: 45 },
    { id: 'pce_04', ref: 'RAC-CL850-01', designation: 'Racle docteur ceramique', prix_unitaire: 180000, emplacement: 'Mag-C1', machine_id: 'mach_03', organe_id: 'org_04', stock_actuel: 3, seuil_reappro: 2, fournisseur: 'Daetwyler', delai_livraison: 21 },
    { id: 'pce_05', ref: 'PLQ-KBA-01', designation: 'Plaque caoutchouc blanchet', prix_unitaire: 95000, emplacement: 'Mag-D1', machine_id: 'mach_05', organe_id: 'org_06', stock_actuel: 6, seuil_reappro: 3, fournisseur: 'Trelleborg', delai_livraison: 14 },
    { id: 'pce_06', ref: 'MLD-PH490-01', designation: 'Insert moule compression', prix_unitaire: 750000, emplacement: 'Mag-E1', machine_id: 'mach_07', organe_id: 'org_07', stock_actuel: 2, seuil_reappro: 2, fournisseur: 'Sacmi Italia', delai_livraison: 60 },
    { id: 'pce_07', ref: 'JNT-PH490-01', designation: 'Joint hydraulique Viton', prix_unitaire: 45000, emplacement: 'Mag-E2', machine_id: 'mach_07', organe_id: 'org_08', stock_actuel: 8, seuil_reappro: 4, fournisseur: 'Parker Hannifin', delai_livraison: 21 },
    { id: 'pce_08', ref: 'FLT-NMC-01', designation: 'Filtre aspiration complexeuse', prix_unitaire: 55000, emplacement: 'Mag-C2', machine_id: 'mach_04', organe_id: null, stock_actuel: 1, seuil_reappro: 2, fournisseur: 'Nordmeccanica', delai_livraison: 35 },
  ];
  Store.set('pieces', pieces);

  // Date helpers
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const d = (day: number, hour: number = 8) => new Date(y, m, day, hour).toISOString();

  // --- INTERVENTIONS ---
  const interventions: Intervention[] = [
    {
      id: 'int_01', ref: 'INT-2026-001', date: d(1, 8),
      machine_id: 'mach_03', pole_id: 'pole_hf', atelier_id: 'atl_hf1',
      technicien_principal_id: 'tech_03', techniciens_participants: ['tech_04'],
      type: 'Curatif', statut: 'Valide production',
      description: 'Remplacement racle docteur ceramique - usure excessive provocant defaut impression',
      cause_id: 'cause_01', pieces_utilisees: [{ piece_id: 'pce_04', quantite: 1 }],
      duree_minutes: 180, duree_diagnostic_min: 45, duree_intervention_min: 135,
      panne_repetitive: false, operateur_id: 'op_02', chef_validation_id: 'chef_02', workflow: {},
    },
    {
      id: 'int_02', ref: 'INT-2026-002', date: d(3, 14),
      machine_id: 'mach_07', pole_id: 'pole_bc', atelier_id: 'atl_bc1',
      technicien_principal_id: 'tech_08', techniciens_participants: ['tech_07'],
      type: 'Curatif', statut: 'Termine',
      description: 'Fuite hydraulique sur systeme de presse - joint Viton defaillant',
      cause_id: 'cause_07', pieces_utilisees: [{ piece_id: 'pce_07', quantite: 2 }],
      duree_minutes: 240, duree_diagnostic_min: 60, duree_intervention_min: 180,
      panne_repetitive: true, operateur_id: 'op_04', chef_validation_id: null, workflow: {},
    },
    {
      id: 'int_03', ref: 'INT-2026-003', date: d(5, 7),
      machine_id: 'mach_01', pole_id: 'pole_oe', atelier_id: 'atl_oe1',
      technicien_principal_id: 'tech_01', techniciens_participants: ['tech_02'],
      type: 'Preventif', statut: 'Termine',
      description: 'Maintenance preventive groupe imprimant - graissage, controle tensions, verification roulements',
      cause_id: null, pieces_utilisees: [],
      duree_minutes: 120, duree_diagnostic_min: 0, duree_intervention_min: 120,
      panne_repetitive: false, operateur_id: null, chef_validation_id: 'chef_01', workflow: {},
    },
    {
      id: 'int_04', ref: 'INT-2026-004', date: d(6, 10),
      machine_id: 'mach_07', pole_id: 'pole_bc', atelier_id: 'atl_bc1',
      technicien_principal_id: 'tech_07', techniciens_participants: ['tech_08'],
      type: 'Curatif', statut: 'En cours',
      description: 'Nouvelle fuite hydraulique meme zone - suspicion defaut raccord haute pression',
      cause_id: 'cause_07', pieces_utilisees: [{ piece_id: 'pce_07', quantite: 1 }],
      duree_minutes: 0, duree_diagnostic_min: 30, duree_intervention_min: 0,
      panne_repetitive: true, operateur_id: 'op_04', chef_validation_id: null, workflow: {},
    },
    {
      id: 'int_05', ref: 'INT-2026-005', date: d(7, 6),
      machine_id: 'mach_04', pole_id: 'pole_hf', atelier_id: 'atl_hf2',
      technicien_principal_id: 'tech_03', techniciens_participants: [],
      type: 'Curatif', statut: 'En attente piece',
      description: 'Defaut aspiration complexeuse - filtre colmate et remplacement necessaire',
      cause_id: 'cause_06', pieces_utilisees: [],
      duree_minutes: 0, duree_diagnostic_min: 20, duree_intervention_min: 0,
      panne_repetitive: false, operateur_id: 'op_02', chef_validation_id: null, workflow: {},
    },
    {
      id: 'int_06', ref: 'INT-2026-006', date: d(4, 9),
      machine_id: 'mach_05', pole_id: 'pole_oc', atelier_id: 'atl_oc1',
      technicien_principal_id: 'tech_05', techniciens_participants: ['tech_06'],
      type: 'Preventif', statut: 'Valide production',
      description: 'Revision trimestrielle margeur KBA - reglage prises, nettoyage capteurs',
      cause_id: null, pieces_utilisees: [],
      duree_minutes: 90, duree_diagnostic_min: 0, duree_intervention_min: 90,
      panne_repetitive: false, operateur_id: null, chef_validation_id: 'chef_03', workflow: {},
    },
  ];
  Store.set('interventions', interventions);

  // --- ACTIONS ---
  const actions: Action[] = [
    { id: 'act_01', intervention_id: 'int_01', description: 'Commander lot de racles ceramiques pour stock preventif', responsable: 'tech_03', echeance: d(15), statut: 'En cours', priorite: 'Haute', date_creation: d(2) },
    { id: 'act_02', intervention_id: 'int_02', description: 'Verifier tous les raccords hydrauliques de la Sacmi PH490', responsable: 'tech_08', echeance: d(8), statut: 'En retard', priorite: 'Critique', date_creation: d(4) },
    { id: 'act_03', intervention_id: 'int_04', description: 'Planifier remplacement complet circuit hydraulique zone haute pression', responsable: 'tech_07', echeance: d(20), statut: 'Ouverte', priorite: 'Haute', date_creation: d(7) },
    { id: 'act_04', intervention_id: null, description: 'Mettre a jour le plan de maintenance preventive Q2', responsable: 'tech_05', echeance: d(10), statut: 'En retard', priorite: 'Moyenne', date_creation: d(1) },
  ];
  Store.set('actions', actions);

  // --- MOUVEMENTS STOCK ---
  const mouvements: StockMovement[] = [
    { id: 'mvt_01', piece_id: 'pce_04', type: 'Sortie', quantite: 1, date: d(1), intervention_id: 'int_01', commentaire: 'Racle pour INT-001', operateur: 'Magasinier' },
    { id: 'mvt_02', piece_id: 'pce_07', type: 'Sortie', quantite: 2, date: d(3), intervention_id: 'int_02', commentaire: 'Joints pour INT-002', operateur: 'Magasinier' },
    { id: 'mvt_03', piece_id: 'pce_07', type: 'Sortie', quantite: 1, date: d(6), intervention_id: 'int_04', commentaire: 'Joint pour INT-004', operateur: 'Magasinier' },
    { id: 'mvt_04', piece_id: 'pce_05', type: 'Entree', quantite: 4, date: d(2), intervention_id: null, commentaire: 'Reception commande Trelleborg', operateur: 'Magasinier' },
  ];
  Store.set('stock_movements', mouvements);

  // --- DEMANDES D'ACHAT ---
  const das: DemandeAchat[] = [
    {
      id: 'da_01', ref: 'DA-2026-001', date: d(3), pole_id: 'pole_oe',
      type_achat: 'Piece', urgence: 'Haute',
      designation: 'Lampe UV 200W pour Gallus RCS330', quantite: 2,
      montant_estime: 640000, fournisseur_propose: 'Heraeus',
      date_souhaitee: d(20), machine_id: 'mach_01', intervention_id: '',
      piece_id: 'pce_03', st_id: '', demandeur: 'tech_01',
      justification: 'Stock a zero - risque arret machine critique',
      statut: 'Soumise',
    },
    {
      id: 'da_02', ref: 'DA-2026-002', date: d(5), pole_id: 'pole_hf',
      type_achat: 'Piece', urgence: 'Critique',
      designation: 'Filtre aspiration complexeuse Nordmeccanica', quantite: 3,
      montant_estime: 165000, fournisseur_propose: 'Nordmeccanica',
      date_souhaitee: d(12), machine_id: 'mach_04', intervention_id: 'int_05',
      piece_id: 'pce_08', st_id: '', demandeur: 'tech_03',
      justification: 'Machine en panne - attente piece pour intervention',
      statut: 'Validee',
    },
    {
      id: 'da_03', ref: 'DA-2026-003', date: d(7), pole_id: 'pole_bc',
      type_achat: 'Sous-traitance', urgence: 'Haute',
      designation: 'Expertise circuit hydraulique Sacmi PH490', quantite: 1,
      montant_estime: 1500000, fournisseur_propose: 'HydraForce Afrique',
      date_souhaitee: d(15), machine_id: 'mach_07', intervention_id: 'int_04',
      piece_id: '', st_id: '', demandeur: 'tech_07',
      justification: 'Panne repetitive - besoin expertise externe specialisee',
      statut: 'Brouillon',
    },
  ];
  Store.set('demandes_achat', das);

  // --- SOUS-TRAITANCES ---
  const sts: SousTraitance[] = [
    {
      id: 'st_01', ref: 'ST-2026-001', date: d(5), pole_id: 'pole_bc',
      prestataire: 'HydraForce Afrique', contact: '+237 699 445566',
      objet: 'Expertise et reconditionnement circuit hydraulique Sacmi PH490',
      machine_id: 'mach_07', intervention_id: 'int_04',
      montant: 1500000, date_debut_prevue: d(10), date_fin_prevue: d(17),
      bon_commande: 'BC-EXT-2026-015', statut: 'En cours',
      observations: 'Prestataire sur site depuis le 10',
    },
  ];
  Store.set('sous_traitances', sts);

  // --- TACHES PREVENTIVES ---
  const taches_prev: TachePreventive[] = [
    { id: 'tp_01', machine_id: 'mach_01', organe_id: 'org_01', piece_id: 'pce_01', tache: 'Controle roulements groupe imprimant', frequence: 'Mensuel', duree_std_min: 60, type_seuil: 'Periode', seuil_valeur: 30, alerte_avant_jours: 5 },
    { id: 'tp_02', machine_id: 'mach_01', organe_id: 'org_03', piece_id: 'pce_03', tache: 'Verification lampe UV et nettoyage reflecteur', frequence: 'Hebdomadaire', duree_std_min: 30, type_seuil: 'Periode', seuil_valeur: 7, alerte_avant_jours: 1 },
    { id: 'tp_03', machine_id: 'mach_03', organe_id: 'org_04', piece_id: 'pce_04', tache: 'Inspection racle et nettoyage cylindre trameur', frequence: 'Bi-mensuel', duree_std_min: 90, type_seuil: 'Periode', seuil_valeur: 15, alerte_avant_jours: 3 },
    { id: 'tp_04', machine_id: 'mach_05', organe_id: 'org_06', piece_id: 'pce_05', tache: 'Controle margeur et remplacement blanchet', frequence: 'Trimestriel', duree_std_min: 120, type_seuil: 'Periode', seuil_valeur: 90, alerte_avant_jours: 7 },
    { id: 'tp_05', machine_id: 'mach_07', organe_id: 'org_07', piece_id: 'pce_06', tache: 'Inspection moule et mesure usure insert', frequence: 'Mensuel', duree_std_min: 45, type_seuil: 'Tours', seuil_valeur: 500000, alerte_avant_jours: 5 },
    { id: 'tp_06', machine_id: 'mach_07', organe_id: 'org_08', piece_id: 'pce_07', tache: 'Controle pression et joints hydrauliques', frequence: 'Hebdomadaire', duree_std_min: 30, type_seuil: 'Periode', seuil_valeur: 7, alerte_avant_jours: 1 },
  ];
  Store.set('taches_preventives', taches_prev);

  // --- UTILISATEURS ---
  const users: User[] = [
    { id: 'usr_01', nom: 'Admin Systeme', email: 'admin@maintpro.cm', login: 'admin', role: 'admin', pole_id: null, actif: true },
    { id: 'usr_02', nom: 'Directeur General', email: 'dg@maintpro.cm', login: 'dg', role: 'direction', pole_id: null, actif: true },
    { id: 'usr_03', nom: 'Ekani Robert', email: 'rekani@maintpro.cm', login: 'rekani', role: 'resp_maintenance', pole_id: null, actif: true },
    { id: 'usr_04', nom: 'Abanda Louis', email: 'labanda@maintpro.cm', login: 'labanda', role: 'resp_pole', pole_id: 'pole_oe', actif: true },
    { id: 'usr_05', nom: 'Messi Roger', email: 'rmessi@maintpro.cm', login: 'rmessi', role: 'chef_atelier', pole_id: 'pole_oe', actif: true },
    { id: 'usr_06', nom: 'Mbarga Jean', email: 'jmbarga@maintpro.cm', login: 'jmbarga', role: 'technicien', pole_id: 'pole_oe', actif: true },
    { id: 'usr_07', nom: 'Ondoua Martin', email: 'mondoua@maintpro.cm', login: 'mondoua', role: 'operateur', pole_id: 'pole_oe', actif: true },
    { id: 'usr_08', nom: 'Ngo Biyick Anne', email: 'ango@maintpro.cm', login: 'ango', role: 'magasinier', pole_id: null, actif: true },
    { id: 'usr_09', nom: 'Fotso Albert', email: 'afotso@maintpro.cm', login: 'afotso', role: 'technicien', pole_id: 'pole_hf', actif: true },
    { id: 'usr_10', nom: 'Fouda Michel', email: 'mfouda@maintpro.cm', login: 'mfouda', role: 'chef_atelier', pole_id: 'pole_bc', actif: true },
  ];
  Store.set('users', users);

  // --- SIGNALEMENTS ---
  const signalements: Signalement[] = [
    {
      id: 'sig_01', ref: 'SIG-2026-001', date_signalement: d(3, 13),
      operateur_id: 'op_04', pole_id: 'pole_bc', atelier_id: 'atl_bc1', machine_id: 'mach_07',
      dysfonctionnement: 'Fuite hydraulique visible sous la presse, flaque d\'huile au sol',
      symptome: 'Perte de pression progressive, bruit anormal au niveau du verin principal',
      machine_arretee: 'oui', urgence_percue: 'Critique',
      statut: 'Intervention creee', intervention_id: 'int_02',
      qualification: { chef_id: 'chef_04', date: d(3, 14), impact_production: 'Arret total', constat_terrain: 'Fuite confirmee sur raccord haute pression, huile sous la machine', priorite_production: 'Urgente', commentaire: 'Arret immediat necessaire', completed: true },
    },
    {
      id: 'sig_02', ref: 'SIG-2026-002', date_signalement: d(6, 9),
      operateur_id: 'op_04', pole_id: 'pole_bc', atelier_id: 'atl_bc1', machine_id: 'mach_07',
      dysfonctionnement: 'Nouvelle fuite hydraulique meme zone que la derniere fois',
      symptome: 'Traces d\'huile, pression instable sur le manometre',
      machine_arretee: 'oui', urgence_percue: 'Haute',
      statut: 'Intervention creee', intervention_id: 'int_04',
      qualification: { chef_id: 'chef_04', date: d(6, 10), impact_production: 'Arret total', constat_terrain: 'Meme probleme que SIG-001, suspicion defaut raccord', priorite_production: 'Urgente', commentaire: 'Panne repetitive confirmee', completed: true },
    },
    {
      id: 'sig_03', ref: 'SIG-2026-003', date_signalement: d(7, 5),
      operateur_id: 'op_02', pole_id: 'pole_hf', atelier_id: 'atl_hf2', machine_id: 'mach_04',
      dysfonctionnement: 'Aspiration faible sur la complexeuse, film mal tendu',
      symptome: 'Bruit aspiration reduit, defaut de complexage visible sur produit',
      machine_arretee: 'non', urgence_percue: 'Haute',
      statut: 'Intervention creee', intervention_id: 'int_05',
      qualification: { chef_id: 'chef_02', date: d(7, 6), impact_production: 'Fort', constat_terrain: 'Filtre aspiration probablement colmate, debit reduit', priorite_production: 'Haute', commentaire: 'Production degradee, changement filtre necessaire', completed: true },
    },
    {
      id: 'sig_04', ref: 'SIG-2026-004', date_signalement: d(8, 7),
      operateur_id: 'op_01', pole_id: 'pole_oe', atelier_id: 'atl_oe1', machine_id: 'mach_01',
      dysfonctionnement: 'Vibration anormale sur le groupe imprimant 1',
      symptome: 'Bruit metallique en rotation, traces sur impression',
      machine_arretee: 'non', urgence_percue: 'Moyenne',
      statut: 'Qualifie', intervention_id: null,
      qualification: { chef_id: 'chef_01', date: d(8, 8), impact_production: 'Modere', constat_terrain: 'Vibration confirmee, possible roulement use', priorite_production: 'Haute', commentaire: 'A traiter rapidement avant aggravation', completed: true },
    },
    {
      id: 'sig_05', ref: 'SIG-2026-005', date_signalement: d(9, 6),
      operateur_id: 'op_03', pole_id: 'pole_oc', atelier_id: 'atl_oc1', machine_id: 'mach_05',
      dysfonctionnement: 'Bourrage papier frequent au niveau du margeur',
      symptome: 'Feuilles arrivent de travers, arret toutes les 10 minutes',
      machine_arretee: 'non', urgence_percue: 'Haute',
      statut: 'Nouveau', intervention_id: null,
      qualification: null,
    },
  ];
  Store.set('signalements', signalements);

  // --- COMPANY INFO ---
  if (!Store.get('company_info')) {
    Store.set('company_info', COMPANY_DEFAULT);
  }

  Store.set('bot_conversations', []);
  Store.set('demo_loaded', true);
}

export function resetDemoData(): void {
  Store.clearAll();
  initDemoData();
}

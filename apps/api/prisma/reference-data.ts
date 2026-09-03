/**
 * Donnees de reference nationales — contenu exact de la spec
 * « Fiche societe v7 » (onglets Ref - Formes juridiques / Banques / Jours feries).
 *
 * Maintenues par PLATFORM_ADMIN, lisibles par tous les comptes.
 * Pas d accountId.
 */

export const FORMES_JURIDIQUES = [
  { code: 'SARL', libelle: 'Société à responsabilité limitée' },
  { code: 'SARLAU', libelle: 'Société à responsabilité limitée à associé unique' },
  { code: 'SA', libelle: 'Société anonyme' },
  { code: 'SAS', libelle: 'Société par actions simplifiée' },
  { code: 'SNC', libelle: 'Société en nom collectif' },
  { code: 'SCS', libelle: 'Société en commandite simple' },
  { code: 'SCA', libelle: 'Société en commandite par actions' },
  { code: 'GIE', libelle: "Groupement d'intérêt économique" },
  { code: 'SEP', libelle: 'Société en participation' },
  { code: 'SUCC', libelle: 'Succursale de société étrangère' },
  { code: 'COOP', libelle: 'Coopérative' },
  { code: 'ASSO', libelle: 'Association' },
  { code: 'EP', libelle: 'Établissement public' },
  { code: 'EI', libelle: 'Entreprise individuelle' },
  { code: 'AE', libelle: 'Auto-entrepreneur' },
] as const;

export const BANQUES = [
  { nom: 'Al Akhdar Bank', ancienNom: null, couleur: '#7CB342' },
  { nom: 'Al Barid Bank', ancienNom: null, couleur: '#FFD100' },
  { nom: 'Arab Bank Maroc', ancienNom: null, couleur: '#003366' },
  { nom: 'Arreda', ancienNom: null, couleur: '#A0522D' },
  { nom: 'Attijariwafa Bank', ancienNom: null, couleur: '#f58220' },
  { nom: 'Bank Al Amal', ancienNom: null, couleur: '#0072BC' },
  { nom: 'Bank Al Yousr', ancienNom: null, couleur: '#00843D' },
  { nom: 'Bank Assafa', ancienNom: null, couleur: '#006747' },
  { nom: 'Bank of Africa (ex BMCE)', ancienNom: 'BMCE', couleur: '#005BAA' },
  { nom: 'Banque Populaire', ancienNom: 'BP', couleur: '#2563eb' },
  { nom: 'BMCI BNP Paribas', ancienNom: null, couleur: '#00965E' },
  { nom: 'BTI Bank', ancienNom: null, couleur: '#003DA5' },
  { nom: 'CFG Bank', ancienNom: null, couleur: '#1f2937' },
  { nom: 'CIH Bank', ancienNom: null, couleur: '#E30613' },
  { nom: 'Citibank Maghreb', ancienNom: null, couleur: '#056DAE' },
  { nom: 'Crédit Agricole du Maroc', ancienNom: null, couleur: '#006633' },
  { nom: 'Crédit du Maroc', ancienNom: null, couleur: '#004B87' },
  { nom: 'Dar Al Amane', ancienNom: null, couleur: '#00857D' },
  { nom: 'Najmah', ancienNom: null, couleur: '#B8860B' },
  { nom: 'Saham Bank (ex Société Générale)', ancienNom: 'SGMB', couleur: '#E2001A' },
  { nom: 'Umnia Bank', ancienNom: null, couleur: '#8B1D82' },
] as const;

export const JOURS_FERIES = [
  {
    code: 'JF_NOUVEL_AN',
    libelle: 'Nouvel An',
    referenceDate: '1er janvier',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_MANIFESTE_INDEP',
    libelle: "Manifeste de l'Indépendance",
    referenceDate: '11 janvier',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_NOUVEL_AN_AMAZIGH',
    libelle: 'Nouvel An amazigh',
    referenceDate: '14 janvier',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_FETE_TRAVAIL',
    libelle: 'Fête du Travail',
    referenceDate: '1er mai',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_FETE_TRONE',
    libelle: 'Fête du Trône',
    referenceDate: '30 juillet',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_OUED_EDDAHAB',
    libelle: "Allégeance de l'Oued Eddahab",
    referenceDate: '14 août',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_REVOLUTION_ROI_PEUPLE',
    libelle: 'Révolution du Roi et du Peuple',
    referenceDate: '20 août',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_FETE_JEUNESSE',
    libelle: 'Fête de la Jeunesse',
    referenceDate: '21 août',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_FETE_UNITE',
    libelle: "Fête de l'Unité",
    referenceDate: '31 octobre',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_MARCHE_VERTE',
    libelle: 'Anniversaire de la Marche Verte',
    referenceDate: '6 novembre',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_FETE_INDEPENDANCE',
    libelle: "Fête de l'Indépendance",
    referenceDate: '18 novembre',
    type: 'CIVIL' as const,
  },
  {
    code: 'JF_AID_FITR_J1',
    libelle: 'Aïd el-Fitr — 1er jour',
    referenceDate: '1er Chawal',
    type: 'RELIGIEUX' as const,
  },
  {
    code: 'JF_AID_FITR_J2',
    libelle: 'Aïd el-Fitr — 2e jour',
    referenceDate: '2 Chawal',
    type: 'RELIGIEUX' as const,
  },
  {
    code: 'JF_AID_ADHA_J1',
    libelle: 'Aïd al-Adha — 1er jour',
    referenceDate: '10 Dou Al-Hijja',
    type: 'RELIGIEUX' as const,
  },
  {
    code: 'JF_AID_ADHA_J2',
    libelle: 'Aïd al-Adha — 2e jour',
    referenceDate: '11 Dou Al-Hijja',
    type: 'RELIGIEUX' as const,
  },
  {
    code: 'JF_NOUVEL_AN_HEGIRE',
    libelle: 'Nouvel An hégirien',
    referenceDate: '1er Moharram',
    type: 'RELIGIEUX' as const,
  },
  {
    code: 'JF_AID_MAWLID_J1',
    libelle: 'Aïd Al Mawlid — 1er jour',
    referenceDate: '12 Rabia Al-Awal',
    type: 'RELIGIEUX' as const,
  },
  {
    code: 'JF_AID_MAWLID_J2',
    libelle: 'Aïd Al Mawlid — 2e jour',
    referenceDate: '13 Rabia Al-Awal',
    type: 'RELIGIEUX' as const,
  },
] as const;

/** Types d heure minimaux — les taux reels arriveront au module 5. */
export const TYPES_HEURE = [
  { code: 'NORMALE', libelle: 'Heures normales', ordre: 1 },
  { code: 'MAJOREE_25', libelle: 'Heures majorées 25 %', ordre: 2 },
  { code: 'MAJOREE_50', libelle: 'Heures majorées 50 %', ordre: 3 },
  { code: 'MAJOREE_100', libelle: 'Heures majorées 100 %', ordre: 4 },
] as const;

export const TYPES_EXONERATION = [{ code: 'TAHFIZ', libelle: 'Tahfiz' }] as const;

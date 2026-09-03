/**
 * Permissions nommees par operation — alignees sur l API (peutFaire).
 * Source unique partagee entre API et back-office.
 */
export const PERMISSIONS = [
  'societe.lire',
  'societe.creer',
  'societe.modifier',
  'societe.supprimer',
  'societe.changer-etat',
  'societe.forcer-regime-de-base',
  'etablissement.lire',
  'etablissement.creer',
  'etablissement.modifier',
  'etablissement.supprimer',
  'etablissement.designer-principal',
  'compte-bancaire.lire',
  'compte-bancaire.creer',
  'compte-bancaire.modifier',
  'compte-bancaire.cloturer',
  'compte-bancaire.supprimer',
  'referentiel.lire',
  'referentiel.gerer',
  'salarie.lire',
  'salarie.creer',
  'salarie.modifier',
  'salarie.supprimer',
  'emploi.creer',
  'emploi.modifier',
  'emploi.supprimer',
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

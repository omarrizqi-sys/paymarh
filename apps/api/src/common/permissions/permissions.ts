/**
 * Permissions nommees par operation — point de passage unique des droits.
 *
 * La vraie table des droits arrivera avec le module d authentification.
 * Jusque-la, la correspondance role → permissions vit dans
 * `role-permissions.provisoire.ts` (fichier clairement provisoire).
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Contexte minimal pour une decision de droit. */
export interface ContextePermission {
  /** Societe visee, quand l operation en concerne une. */
  readonly companyId?: string | null;
}

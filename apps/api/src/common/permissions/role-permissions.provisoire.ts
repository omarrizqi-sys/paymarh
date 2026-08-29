/**
 * PROVISOIRE — correspondance Role (module 0) → permissions.
 *
 * Ce fichier sera REMPLACE par la table des droits du module
 * d authentification (droits par operation et par societe, familles, etc.).
 * Ne pas etendre cette logique ailleurs : tout passe par `peutFaire`.
 */
import type { Role } from '@paymarh/shared-types';
import type { Permission } from './permissions.js';

const TOUTES_SAUF_ADMIN_PLATEFORME: readonly Permission[] = [
  'societe.lire',
  'societe.creer',
  'societe.modifier',
  'societe.supprimer',
  'societe.changer-etat',
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
];

const MANAGER: readonly Permission[] = [
  'societe.lire',
  'societe.creer',
  'societe.modifier',
  'etablissement.lire',
  'etablissement.creer',
  'etablissement.modifier',
  'compte-bancaire.lire',
  'compte-bancaire.creer',
  'compte-bancaire.modifier',
  'referentiel.lire',
];

const PLATFORM_ADMIN: readonly Permission[] = [
  'referentiel.lire',
  'referentiel.gerer',
  'societe.forcer-regime-de-base',
];

/**
 * Permissions accordees a un role (provisoire).
 * `referentiel.lire` est aussi accorde a tout utilisateur authentifie via
 * `peutFaire` (meme EMPLOYEE), en plus de cette table.
 */
export function permissionsProvisoiresDuRole(role: Role): readonly Permission[] {
  switch (role) {
    case 'ACCOUNT_ADMIN':
      return TOUTES_SAUF_ADMIN_PLATEFORME;
    case 'MANAGER':
      return MANAGER;
    case 'PLATFORM_ADMIN':
      return PLATFORM_ADMIN;
    case 'EMPLOYEE':
      return [];
    default: {
      const _exhaustif: never = role;
      return _exhaustif;
    }
  }
}

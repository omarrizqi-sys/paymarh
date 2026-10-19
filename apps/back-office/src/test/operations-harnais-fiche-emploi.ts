import type { EmploiFiche, Permission } from '@paymarh/shared-types';

/** Jeu operationsSalarie (apps/api/src/common/permissions/operations-ressource.ts L87-95). */
export const OPERATIONS_SALARIE_COMPLET: readonly Permission[] = [
  'salarie.lire',
  'salarie.modifier',
  'salarie.supprimer',
  'emploi.creer',
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
];

/** Jeu operationsEmploi (apps/api/src/common/permissions/operations-ressource.ts L98-105). */
export const OPERATIONS_EMPLOI_COMPLET: readonly Permission[] = [
  'emploi.modifier',
  'emploi.supprimer',
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
];

/** Écriture de la rémunération d'un emploi : les deux droits exigés par le serveur, sans emploi.supprimer. */
export const OPERATIONS_EMPLOI_REMUNERATION: readonly Permission[] = [
  'emploi.modifier',
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
];

/** salarie.remuneration.ecrire sans emploi.modifier : rémunération, primes et avantages en lecture seule. */
export const OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER: readonly Permission[] = [
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
];

export function avecOperationsEmploi(
  emploi: EmploiFiche,
  operations: readonly Permission[] = OPERATIONS_EMPLOI_COMPLET
): EmploiFiche {
  return { ...emploi, operations: [...operations] };
}

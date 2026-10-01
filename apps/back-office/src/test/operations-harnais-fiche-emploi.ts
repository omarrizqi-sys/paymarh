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

/** Droits emploi liés à la rémunération (sans emploi.modifier). */
export const OPERATIONS_EMPLOI_REMUNERATION: readonly Permission[] = [
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
];

export function avecOperationsEmploi(
  emploi: EmploiFiche,
  operations: readonly Permission[] = OPERATIONS_EMPLOI_COMPLET
): EmploiFiche {
  return { ...emploi, operations: [...operations] };
}

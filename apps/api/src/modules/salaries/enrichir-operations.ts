import type { Permission, RessourceAvecOperations } from '@paymarh/shared-types';

/** Fiche salarie enrichie des operations autorisees pour l appelant. */
export function enrichirFicheSalarie<T extends { emplois: readonly Record<string, unknown>[] }>(
  fiche: T,
  operations: readonly Permission[],
  operationsEmploi: readonly Permission[]
): RessourceAvecOperations<T> & {
  emplois: readonly (T['emplois'][number] & { operations: readonly Permission[] })[];
} {
  return {
    ...fiche,
    operations,
    emplois: fiche.emplois.map((emploi) => ({
      ...emploi,
      operations: operationsEmploi,
    })),
  };
}

/** Liste salariés avec operations au niveau collection. */
export function enrichirListeSalaries<T>(
  liste: T,
  operations: readonly Permission[]
): T & { operations: readonly Permission[] } {
  return { ...liste, operations };
}

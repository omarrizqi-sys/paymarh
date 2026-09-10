import type { AlerteApi } from '@paymarh/shared-types';

/**
 * Transport memoire des alertes de creation reussie vers la fiche.
 * Une seule lecture consomme le depot : pas d URL, pas de second GET.
 */
interface DepotAlertesCreation {
  readonly salarieId: string;
  readonly alertes: readonly AlerteApi[];
}

let depot: DepotAlertesCreation | null = null;

export function deposerAlertesCreationSalarie(
  salarieId: string,
  alertes: readonly AlerteApi[]
): void {
  depot = { salarieId, alertes };
}

export function consommerAlertesCreationSalarie(
  salarieId: string
): readonly AlerteApi[] | undefined {
  if (depot === null || depot.salarieId !== salarieId) {
    return undefined;
  }
  const { alertes } = depot;
  depot = null;
  return alertes;
}

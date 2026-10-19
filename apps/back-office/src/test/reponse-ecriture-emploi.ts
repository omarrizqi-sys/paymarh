import type { AlerteApi, EmploiFiche, ReponseEcriture } from '@paymarh/shared-types';

/**
 * Réponse d'un PATCH contrat, affectation ou rémunération telle que l'API la rend :
 * l'emploi relu, SANS `operations` (posé seulement sur GET /salaries/:id).
 */
export function reponseEcritureEmploi(
  emploi: EmploiFiche,
  surcharges: Partial<Omit<EmploiFiche, 'id' | 'operations'>> = {},
  alertes: readonly AlerteApi[] = []
): ReponseEcriture<EmploiFiche> {
  const { operations: _operations, ...donnees } = { ...emploi, ...surcharges };
  return { donnees, alertes };
}

import type { AlerteApi, ReponseEcriture } from '@paymarh/shared-types';

/** Enveloppe standard d une reponse d ecriture reussie. */
export function okEcriture<T>(
  donnees: T,
  alertes: readonly AlerteApi[] = []
): ReponseEcriture<T> {
  return { donnees, alertes };
}

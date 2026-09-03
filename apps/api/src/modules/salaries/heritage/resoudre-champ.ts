import type { NiveauHeritage, ResolutionChamp } from './niveaux-heritage.js';

export interface CandidatHeritage<T> {
  readonly valeur: T | null | undefined;
  readonly origine: NiveauHeritage;
  readonly libelleEntite: string | null;
}

/**
 * Premier niveau portant une valeur non nulle (D9). Absence totale → null (P6).
 * `false`, `0` et `[]` sont des valeurs metier, pas un heritage.
 */
export function premierNonNul<T>(
  candidats: readonly CandidatHeritage<T>[]
): ResolutionChamp<T> | null {
  for (const candidat of candidats) {
    if (candidat.valeur === null || candidat.valeur === undefined) {
      continue;
    }
    return {
      valeur: candidat.valeur,
      origine: candidat.origine,
      libelleEntite: candidat.origine === 'ETABLISSEMENT' ? candidat.libelleEntite : null,
    };
  }
  return null;
}

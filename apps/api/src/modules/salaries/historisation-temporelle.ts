/**
 * Resolution de lignes a validite temporelle (moisEffetDebut / moisEffetFin).
 * Utilise pour les blocs PERSONNES_A_CHARGE, RETENUES, avantages en nature, feries travailles.
 */
export interface LigneTemporelle {
  moisEffetDebut: string;
  moisEffetFin: string | null;
}

/**
 * Retourne la ligne applicable au mois demande, ou null si aucune ligne ne couvre ce mois.
 */
export function resoudreLigneTemporelle<T extends LigneTemporelle>(
  lignes: readonly T[],
  moisCible: string
): T | null {
  for (const ligne of lignes) {
    if (ligne.moisEffetDebut > moisCible) {
      continue;
    }
    if (ligne.moisEffetFin !== null && ligne.moisEffetFin < moisCible) {
      continue;
    }
    return ligne;
  }
  return null;
}

/**
 * Indique si une ligne close par moisEffetFin n est plus applicable au mois demande.
 */
export function ligneCloseAvantMois(ligne: LigneTemporelle, moisCible: string): boolean {
  return ligne.moisEffetFin !== null && ligne.moisEffetFin < moisCible;
}

/**
 * Indique si une ligne reste lisible pour un mois anterieur a sa cloture.
 */
export function ligneLisiblePourMois(ligne: LigneTemporelle, moisCible: string): boolean {
  if (ligne.moisEffetDebut > moisCible) {
    return false;
  }
  if (ligne.moisEffetFin !== null && ligne.moisEffetFin < moisCible) {
    return false;
  }
  return true;
}

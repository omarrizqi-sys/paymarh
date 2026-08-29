/**
 * Resolution d une ligne d historique parametree par moisEffet (AAAA-MM).
 *
 * Une ligne vaut a partir de son moisEffet jusqu au moisEffet strictement
 * superieur de la ligne suivante. On prend donc la ligne applicable la plus
 * recente dont moisEffet <= moisCible — pas la ligne la plus recente tout court.
 */
export interface LigneHistorisee {
  moisEffet: string;
}

/**
 * Retourne la ligne applicable au mois demande, ou `null` si aucune ligne
 * n a encore pris effet a cette date.
 */
export function resoudreLigneHistorique<T extends LigneHistorisee>(
  lignes: readonly T[],
  moisCible: string
): T | null {
  let applicable: T | null = null;

  for (const ligne of lignes) {
    if (ligne.moisEffet > moisCible) {
      continue;
    }
    if (applicable === null || ligne.moisEffet > applicable.moisEffet) {
      applicable = ligne;
    }
  }

  return applicable;
}

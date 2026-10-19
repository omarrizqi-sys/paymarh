import type { EmploiFiche } from '@paymarh/shared-types';

export type BlocRemonteeEmploi = 'contrat' | 'affectation' | 'remuneration';

/**
 * Ce que l'écran retient d'un PATCH contrat, affectation ou rémunération : version,
 * bloc(s) de la rubrique, résolutions d'héritage et, pour le contrat, les lignes de
 * statut propagées. Tout le reste vient de l'emploi courant (la réponse ne porte pas
 * `operations`).
 */
export function fusionnerReponseEmploi(
  courant: EmploiFiche,
  reponse: EmploiFiche,
  bloc: BlocRemonteeEmploi
): EmploiFiche {
  if (courant.id !== reponse.id) {
    return courant;
  }
  const commun: EmploiFiche = {
    ...courant,
    version: reponse.version,
    resolutions: reponse.resolutions,
  };
  if (bloc === 'affectation') {
    return { ...commun, affectation: reponse.affectation };
  }
  if (bloc === 'remuneration') {
    return { ...commun, remuneration: reponse.remuneration, paiement: reponse.paiement };
  }
  return {
    ...commun,
    contrat: reponse.contrat,
    statutsParticuliers: [
      ...reponse.statutsParticuliers.filter((ligne) => ligne.origine === 'PROPAGE_SOCIETE'),
      ...courant.statutsParticuliers.filter((ligne) => ligne.origine !== 'PROPAGE_SOCIETE'),
    ],
  };
}

import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import { CODES_REPONSE } from '../reponses/codes-reponse.js';
import type { LigneGrilleHoraireResolue } from './niveaux-heritage.js';

/**
 * C24 — alerte si le repos hebdomadaire tombe un jour ou la grille resolue
 * porte des heures. Sans grille resolue, aucune alerte (P6).
 */
export function collecterAlerteReposVsGrille(
  reposHebdomadaireResolu: string | null,
  grilleResolue: readonly LigneGrilleHoraireResolue[] | null
): AlerteApi | null {
  if (reposHebdomadaireResolu === null) return null;
  if (grilleResolue === null || grilleResolue.length === 0) return null;

  const heuresDuJour = grilleResolue
    .filter((ligne) => ligne.jourSemaine === reposHebdomadaireResolu)
    .reduce((acc, ligne) => acc.plus(ligne.nombreHeures), new Decimal(0));

  if (heuresDuJour.greaterThan(0)) {
    return {
      code: CODES_REPONSE.REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE.code,
      champ: 'reposHebdomadaire',
      message: CODES_REPONSE.REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE.message,
    };
  }

  return null;
}

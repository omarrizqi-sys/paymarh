import { Decimal } from 'decimal.js';
import { ValidationBloquanteError } from './validation-fiche.js';

export interface LigneGrilleHoraireDefaut {
  readonly jourSemaine: string;
  readonly typeHeureId: string;
  readonly nombreHeures: string;
}

/** Somme des heures de la grille — seule source de verite cote serveur. */
export function sommerGrilleHoraireDefaut(lignes: readonly LigneGrilleHoraireDefaut[]): Decimal {
  return lignes.reduce(
    (acc, ligne) => acc.plus(new Decimal(ligne.nombreHeures || '0')),
    new Decimal(0)
  );
}

/**
 * Verifie la coherence interne de la grille horaire hebdomadaire.
 * Le total de controle est recalcule cote serveur ; un total declare par le client
 * n est jamais accepte tel quel (ADR 0010).
 */
export function controlerCoherenceGrilleHoraireDefaut(
  lignes: readonly LigneGrilleHoraireDefaut[],
  totalControleDeclare?: string | null
): Decimal {
  const cles = new Set<string>();

  for (const ligne of lignes) {
    const cle = `${ligne.jourSemaine}-${ligne.typeHeureId}`;
    if (cles.has(cle)) {
      throw new ValidationBloquanteError(
        'GRILLE_DOUBLON',
        'La grille horaire contient des lignes en double.',
        'horaireDefautLignes'
      );
    }
    cles.add(cle);

    let heures: Decimal;
    try {
      heures = new Decimal(ligne.nombreHeures || '0');
    } catch {
      throw new ValidationBloquanteError(
        'GRILLE_HEURES_INVALIDES',
        'Une duree horaire n est pas un nombre valide.',
        'horaireDefautLignes'
      );
    }
    if (heures.isNegative()) {
      throw new ValidationBloquanteError(
        'GRILLE_HEURES_INVALIDES',
        'Les durees horaires ne peuvent pas etre negatives.',
        'horaireDefautLignes'
      );
    }
  }

  const totalCalcule = sommerGrilleHoraireDefaut(lignes);

  if (totalControleDeclare != null && totalControleDeclare !== '') {
    let totalDeclare: Decimal;
    try {
      totalDeclare = new Decimal(totalControleDeclare);
    } catch {
      throw new ValidationBloquanteError(
        'GRILLE_TOTAL_INCOHERENT',
        'Le total de controle declare n est pas un nombre valide.',
        'totalControle'
      );
    }
    if (!totalCalcule.equals(totalDeclare)) {
      throw new ValidationBloquanteError(
        'GRILLE_TOTAL_INCOHERENT',
        'Le total de controle ne correspond pas a la somme des heures saisies.',
        'horaireDefautLignes'
      );
    }
  }

  return totalCalcule;
}

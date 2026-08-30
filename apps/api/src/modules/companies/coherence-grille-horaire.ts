import { Decimal } from 'decimal.js';
import { ValidationBloquanteError } from './validation-fiche.js';

export interface LigneGrilleHoraireDefaut {
  readonly jourSemaine: string;
  readonly typeHeureId: string;
  readonly nombreHeures: string;
}

export interface OptionsCoherenceGrilleHoraire {
  readonly totalControleDeclare?: string | null;
  readonly dureeHebdomadaire?: string | null;
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
 * Le total est toujours recalcule ; la duree hebdomadaire declaree est comparee
 * des que la grille est fournie (ADR 0010).
 */
export function controlerCoherenceGrilleHoraireDefaut(
  lignes: readonly LigneGrilleHoraireDefaut[],
  options: OptionsCoherenceGrilleHoraire = {}
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

  const { dureeHebdomadaire, totalControleDeclare } = options;

  if (dureeHebdomadaire != null && dureeHebdomadaire !== '') {
    let duree: Decimal;
    try {
      duree = new Decimal(dureeHebdomadaire);
    } catch {
      throw new ValidationBloquanteError(
        'GRILLE_TOTAL_INCOHERENT',
        'La duree hebdomadaire declaree n est pas un nombre valide.',
        'dureeHebdomadaire'
      );
    }
    if (!totalCalcule.equals(duree)) {
      throw new ValidationBloquanteError(
        'GRILLE_TOTAL_INCOHERENT',
        'Le total de controle ne correspond pas a la duree hebdomadaire declaree.',
        'horaireDefautLignes'
      );
    }
  }

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

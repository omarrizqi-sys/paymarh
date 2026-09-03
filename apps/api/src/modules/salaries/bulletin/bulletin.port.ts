/**
 * Etats d un bulletin de paie (regles etape 2.1.b).
 * Seuls CALCULE (2), VALIDE (3) et EDITE (4) correspondent a une ligne en base.
 * NON_CALCULABLE (0) et CALCULABLE (1) se deduisent de l absence de ligne.
 */
export enum EtatBulletin {
  NON_CALCULABLE = 0,
  CALCULABLE = 1,
  CALCULE = 2,
  VALIDE = 3,
  EDITE = 4,
}

export interface MoisBulletin {
  readonly mois: string;
  readonly etat: EtatBulletin;
}

export const BULLETIN_PORT = Symbol('BULLETIN_PORT');

/** Port vers le module bulletins (module 2). Une seule operation a ce stade. */
export interface BulletinPort {
  listerBulletinsParSalarie(salarieId: string): Promise<readonly MoisBulletin[]>;
}

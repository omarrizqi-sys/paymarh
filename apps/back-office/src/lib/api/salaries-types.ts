import type { FicheSalarie, Permission, RessourceAvecOperations } from '@paymarh/shared-types';

/**
 * La forme de la fiche salarie n est PAS decrite ici : elle l est une seule
 * fois, dans @paymarh/shared-types, et le mapper de l API annote son retour
 * avec ce meme type. Une divergence entre l ecran et l API casse donc la
 * compilation au lieu de passer inapercue.
 */
export type { FicheSalarie };

export type FicheSalarieAvecOperations = RessourceAvecOperations<FicheSalarie>;

/** Ligne telle que renvoyee par GET /salaries. */
export interface LigneListeSalarie {
  readonly id: string;
  readonly matricule: string;
  readonly nom: string;
  readonly prenom: string;
  readonly etat: 'ACTIF' | 'INACTIF';
  readonly dateEntree: string;
  readonly poste: string | null;
  readonly nombreEmploisOuverts: number;
  readonly etablissement: { readonly id: string; readonly libelle: string } | null;
}

export interface ListeSalariesDonnees {
  readonly items: readonly LigneListeSalarie[];
  readonly prochainCurseur: string | null;
  readonly operations: readonly Permission[];
}

export interface ListerSalariesParams {
  readonly recherche?: string;
  readonly curseur?: string;
  readonly etat?: 'ACTIF' | 'INACTIF';
  readonly etablissementId?: string;
  readonly limite?: number;
}

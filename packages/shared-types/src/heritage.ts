/** Niveaux de la cascade SAL > ETB > SOC > NAT (D9). */
export type NiveauHeritage = 'SALARIE' | 'ETABLISSEMENT' | 'SOCIETE' | 'NATIONAL';

export interface ResolutionChamp<T> {
  readonly valeur: T;
  readonly origine: NiveauHeritage;
  /** Nom de l etablissement lorsque l origine est ETABLISSEMENT (A11, R27, Y5). */
  readonly libelleEntite: string | null;
}

export interface LigneGrilleHoraireResolue {
  readonly jourSemaine: string;
  readonly typeHeureId: string;
  readonly nombreHeures: string;
}

export interface ResolutionsEmploi {
  readonly dureeContractuelle: ResolutionChamp<string> | null;
  readonly reposHebdomadaire: ResolutionChamp<string> | null;
  readonly teletravailAutorise: ResolutionChamp<boolean> | null;
  readonly teletravailIndemniteVersee: ResolutionChamp<boolean> | null;
  readonly teletravailMontant: ResolutionChamp<string> | null;
  readonly grilleHoraire: ResolutionChamp<readonly LigneGrilleHoraireResolue[]> | null;
  readonly joursFeriesTravailles: ResolutionChamp<readonly string[]> | null;
}

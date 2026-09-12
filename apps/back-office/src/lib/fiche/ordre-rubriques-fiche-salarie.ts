/**
 * Ordre d enregistrement, sommaire et libellés des rubriques fiche salarie.
 * Source stable — ne depend pas de l ordre d inscription au registre.
 */

/** Huit rubriques du salarié, dans l ordre figé d envoi et d affichage sommaire. */
export const ORDRE_RUBRIQUES_SALARIE = [
  'identite',
  'identifiants-legaux',
  'coordonnees',
  'personnes-a-charge',
  'comptes-bancaires',
  'dates',
  'prets',
  'saisies-sur-salaire',
] as const;

/** Alias historique — même liste que les huit rubriques salarié. */
export const ORDRE_RUBRIQUES_FICHE_SALARIE = ORDRE_RUBRIQUES_SALARIE;

export type IdRubriqueSalarie = (typeof ORDRE_RUBRIQUES_SALARIE)[number];

export type IdRubriqueFicheSalarie = IdRubriqueSalarie;

/** Rubriques d un emploi, dans l ordre d envoi déclaré (écrans à venir). */
export const ORDRE_RUBRIQUES_EMPLOI = [
  'contrat',
  'remuneration',
  'affectation',
  'primes-contractuelles',
  'avantages-en-nature',
  'statuts-particuliers',
] as const;

export type IdRubriqueEmploi = (typeof ORDRE_RUBRIQUES_EMPLOI)[number];

export const LIBELLES_RUBRIQUES_EMPLOI: Record<IdRubriqueEmploi, string> = {
  contrat: 'Contrat',
  remuneration: 'Rémunération',
  affectation: 'Affectation',
  'primes-contractuelles': 'Primes contractuelles',
  'avantages-en-nature': 'Avantages en nature',
  'statuts-particuliers': 'Statuts particuliers',
};

export const ID_SOMMAIRE_EMPLOIS = 'emplois';

export const LIBELLE_SOMMAIRE_EMPLOIS = 'Emplois';

export interface EmploiPourOrdre {
  readonly id: string;
  readonly libellePoste: string;
  readonly version: number;
}

/** Identifiant stable d une rubrique d emploi — composé ici, jamais déduit ailleurs. */
export function idRubriqueEmploi(emploiId: string, rubrique: IdRubriqueEmploi): string {
  return `${emploiId}/${rubrique}`;
}

/** Libellé qualifié pour une rubrique d emploi — seul endroit de composition. */
export function libelleRubriqueEmploi(rubrique: IdRubriqueEmploi, libellePoste: string): string {
  return `${LIBELLES_RUBRIQUES_EMPLOI[rubrique]} — ${libellePoste}`;
}

/** Ordre complet d enregistrement : salarié d abord, puis chaque emploi dans l ordre d affichage. */
export function ordreEnregistrementFiche(emplois: readonly EmploiPourOrdre[]): readonly string[] {
  const ids: string[] = [...ORDRE_RUBRIQUES_SALARIE];
  for (const emploi of emplois) {
    for (const rubrique of ORDRE_RUBRIQUES_EMPLOI) {
      ids.push(idRubriqueEmploi(emploi.id, rubrique));
    }
  }
  return ids;
}

/** Entrées de navigation du sommaire : huit rubriques salarié + « Emplois » (sans rubrique enregistrable). */
export function idsSommaireNavigation(): readonly string[] {
  return [...ORDRE_RUBRIQUES_SALARIE, ID_SOMMAIRE_EMPLOIS];
}

export class RubriqueAbsenteDeLOrdreError extends Error {
  constructor(readonly idsAbsents: readonly string[]) {
    super(
      `Rubrique(s) inscrite(s) au registre mais absentes de l ordre d enregistrement : ${idsAbsents.join(', ')}`
    );
    this.name = 'RubriqueAbsenteDeLOrdreError';
  }
}

export function detecterRubriquesHorsOrdre(
  idsInscrits: Iterable<string>,
  ordre: readonly string[]
): string[] {
  const ordreSet = new Set(ordre);
  return [...idsInscrits].filter((id) => !ordreSet.has(id));
}

export function assertRubriquesDansOrdre(
  idsInscrits: Iterable<string>,
  ordre: readonly string[]
): void {
  const absents = detecterRubriquesHorsOrdre(idsInscrits, ordre);
  if (absents.length > 0) {
    throw new RubriqueAbsenteDeLOrdreError(absents);
  }
}

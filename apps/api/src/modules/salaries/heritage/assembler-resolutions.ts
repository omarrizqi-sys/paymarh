import type { Decimal } from 'decimal.js';
import { ligneLisiblePourMois } from '../historisation-temporelle.js';
import type {
  LigneGrilleHoraireResolue,
  ResolutionsEmploi,
} from './niveaux-heritage.js';
import { premierNonNul } from './resoudre-champ.js';

export interface SnapshotSalarieHeritage {
  readonly dureeContractuelle: Decimal | null;
  readonly reposHebdomadaire: string | null;
  readonly teletravailAutorise: boolean | null;
  readonly teletravailIndemniteVersee: boolean | null;
  readonly teletravailMontant: Decimal | null;
  readonly repartitionHoraireRef: string | null;
  readonly suivreJoursFeriesEtablissement: boolean;
  readonly joursFeriesPropres: readonly { jourFerieId: string; moisEffetDebut: string; moisEffetFin: string | null }[];
}

export interface SnapshotEtablissementHeritage {
  readonly nom: string;
  readonly dureeHebdomadaire: Decimal | null;
  readonly jourReposHebdomadaire: string | null;
  readonly teletravailAutorise: boolean | null;
  readonly indemniteTeletravailVersee: boolean | null;
  readonly montantIndemniteTeletravail: Decimal | null;
  readonly horaireDefautLignes: readonly {
    jourSemaine: string;
    typeHeureId: string;
    nombreHeures: Decimal;
  }[];
  readonly joursFeriesTravaillesIds: readonly string[];
}

export interface SnapshotNationalHeritage {
  readonly dureeLegaleTravail: Decimal | null;
}

function decimalOuNull(valeur: Decimal | null | undefined): string | null {
  if (valeur === null || valeur === undefined) return null;
  return valeur.toString();
}

function lignesGrille(
  lignes: SnapshotEtablissementHeritage['horaireDefautLignes']
): LigneGrilleHoraireResolue[] {
  return lignes.map((ligne) => ({
    jourSemaine: ligne.jourSemaine,
    typeHeureId: ligne.typeHeureId,
    nombreHeures: ligne.nombreHeures.toString(),
  }));
}

/**
 * Assemble les resolutions a partir de snapshots deja charges.
 * Aucune valeur n est inventee (P6). SOC n a aucun champ heritable correspondant (v7).
 */
export function assemblerResolutionsEmploi(
  salarie: SnapshotSalarieHeritage,
  etablissement: SnapshotEtablissementHeritage | null,
  national: SnapshotNationalHeritage,
  mois: string
): ResolutionsEmploi {
  const libelleEtab = etablissement?.nom ?? null;

  const dureeContractuelle = premierNonNul([
    { valeur: decimalOuNull(salarie.dureeContractuelle), origine: 'SALARIE', libelleEntite: null },
    {
      valeur: decimalOuNull(etablissement?.dureeHebdomadaire ?? null),
      origine: 'ETABLISSEMENT',
      libelleEntite: libelleEtab,
    },
    { valeur: null, origine: 'SOCIETE', libelleEntite: null },
    {
      valeur: decimalOuNull(national.dureeLegaleTravail),
      origine: 'NATIONAL',
      libelleEntite: null,
    },
  ]);

  const reposHebdomadaire = premierNonNul([
    { valeur: salarie.reposHebdomadaire, origine: 'SALARIE', libelleEntite: null },
    {
      valeur: etablissement?.jourReposHebdomadaire ?? null,
      origine: 'ETABLISSEMENT',
      libelleEntite: libelleEtab,
    },
    { valeur: null, origine: 'SOCIETE', libelleEntite: null },
    { valeur: null, origine: 'NATIONAL', libelleEntite: null },
  ]);

  const teletravailAutorise = premierNonNul([
    { valeur: salarie.teletravailAutorise, origine: 'SALARIE', libelleEntite: null },
    {
      valeur: etablissement?.teletravailAutorise ?? null,
      origine: 'ETABLISSEMENT',
      libelleEntite: libelleEtab,
    },
    { valeur: null, origine: 'SOCIETE', libelleEntite: null },
    { valeur: null, origine: 'NATIONAL', libelleEntite: null },
  ]);

  const teletravailIndemniteVersee = premierNonNul([
    { valeur: salarie.teletravailIndemniteVersee, origine: 'SALARIE', libelleEntite: null },
    {
      valeur: etablissement?.indemniteTeletravailVersee ?? null,
      origine: 'ETABLISSEMENT',
      libelleEntite: libelleEtab,
    },
    { valeur: null, origine: 'SOCIETE', libelleEntite: null },
    { valeur: null, origine: 'NATIONAL', libelleEntite: null },
  ]);

  const teletravailMontant = premierNonNul([
    { valeur: decimalOuNull(salarie.teletravailMontant), origine: 'SALARIE', libelleEntite: null },
    {
      valeur: decimalOuNull(etablissement?.montantIndemniteTeletravail ?? null),
      origine: 'ETABLISSEMENT',
      libelleEntite: libelleEtab,
    },
    { valeur: null, origine: 'SOCIETE', libelleEntite: null },
    { valeur: null, origine: 'NATIONAL', libelleEntite: null },
  ]);

  const grilleHoraire = resoudreGrilleHoraire(salarie, etablissement, libelleEtab);
  const joursFeriesTravailles = resoudreJoursFeries(salarie, etablissement, libelleEtab, mois);

  return {
    dureeContractuelle,
    reposHebdomadaire,
    teletravailAutorise,
    teletravailIndemniteVersee,
    teletravailMontant,
    grilleHoraire,
    joursFeriesTravailles,
  };
}

function resoudreGrilleHoraire(
  salarie: SnapshotSalarieHeritage,
  etablissement: SnapshotEtablissementHeritage | null,
  libelleEtab: string | null
): ResolutionsEmploi['grilleHoraire'] {
  if (salarie.repartitionHoraireRef !== null && salarie.repartitionHoraireRef.length > 0) {
    return null;
  }

  const lignes = etablissement?.horaireDefautLignes ?? [];
  if (lignes.length === 0) {
    return premierNonNul([
      { valeur: null, origine: 'SALARIE', libelleEntite: null },
      { valeur: null, origine: 'ETABLISSEMENT', libelleEntite: libelleEtab },
      { valeur: null, origine: 'SOCIETE', libelleEntite: null },
      { valeur: null, origine: 'NATIONAL', libelleEntite: null },
    ]);
  }

  return premierNonNul([
    { valeur: null, origine: 'SALARIE', libelleEntite: null },
    {
      valeur: lignesGrille(lignes),
      origine: 'ETABLISSEMENT',
      libelleEntite: libelleEtab,
    },
    { valeur: null, origine: 'SOCIETE', libelleEntite: null },
    { valeur: null, origine: 'NATIONAL', libelleEntite: null },
  ]);
}

/**
 * A15 / T2 : tant que le booleen de suivi est vrai, l emploi suit l etablissement.
 * A faux, la grille propre (y compris vide) n est jamais confondue avec un heritage.
 */
function resoudreJoursFeries(
  salarie: SnapshotSalarieHeritage,
  etablissement: SnapshotEtablissementHeritage | null,
  libelleEtab: string | null,
  mois: string
): ResolutionsEmploi['joursFeriesTravailles'] {
  if (!salarie.suivreJoursFeriesEtablissement) {
    const propres = salarie.joursFeriesPropres
      .filter((ligne) => ligneLisiblePourMois(ligne, mois))
      .map((ligne) => ligne.jourFerieId);
    return {
      valeur: propres,
      origine: 'SALARIE',
      libelleEntite: null,
    };
  }

  if (etablissement === null) {
    return null;
  }

  return {
    valeur: [...etablissement.joursFeriesTravaillesIds],
    origine: 'ETABLISSEMENT',
    libelleEntite: libelleEtab,
  };
}

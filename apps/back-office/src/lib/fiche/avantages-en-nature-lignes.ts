import type { AvantageEnNatureFiche } from '@paymarh/shared-types';
import {
  estModifieeContreReferenceTableau,
  extraireLigneReponseParId,
  genererIdLocal,
  libelleEtatLigneHistorise,
  type LigneTableauHistoriseBase,
} from './lignes-tableau-historise-commun';

export { genererIdLocal, reinitialiserCompteurIdLocal } from './lignes-tableau-historise-commun';

export const MOIS_APPLICATION = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const MOIS_ABREGE: readonly string[] = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
];

export interface LigneAvantageEnNatureLocale extends LigneTableauHistoriseBase {
  readonly natureRef: string;
  readonly montant: string;
  readonly moisApplication: readonly number[];
  readonly moisEffetDebut: string;
}

export function afficherMoisApplication(mois: readonly number[]): string {
  if (mois.length === 0) {
    return '';
  }
  if (mois.length === 12) {
    return 'Tous les mois';
  }
  const ordreCalendaire = [...mois].sort((a, b) => a - b);
  return ordreCalendaire.map((numero) => MOIS_ABREGE[numero - 1] ?? String(numero)).join(', ');
}

export function creerLigneVide(natureRef: string): LigneAvantageEnNatureLocale {
  return {
    id: genererIdLocal(),
    natureRef,
    montant: '',
    moisApplication: [],
    moisEffetDebut: '',
    etat: 'NON_ENREGISTREE',
    moisEffetFin: null,
  };
}

export function depuisServeur(ligne: AvantageEnNatureFiche): LigneAvantageEnNatureLocale {
  return {
    id: ligne.id,
    natureRef: ligne.natureRef,
    montant: ligne.montant,
    moisApplication: [...ligne.moisApplication],
    moisEffetDebut: ligne.moisEffetDebut,
    etat: ligne.etat,
    moisEffetFin: ligne.moisEffetFin,
  };
}

export function versServeur(ligne: LigneAvantageEnNatureLocale): AvantageEnNatureFiche {
  return {
    id: ligne.id,
    natureRef: ligne.natureRef,
    montant: ligne.montant,
    moisApplication: [...ligne.moisApplication],
    moisEffetDebut: ligne.moisEffetDebut,
    moisEffetFin: ligne.moisEffetFin,
    etat: ligne.etat === 'NON_ENREGISTREE' ? 'ACTIVE' : ligne.etat,
  };
}

/** Conserve l ordre serveur ; les non enregistrées passent en dernier. */
export function trierAffichage(
  lignes: readonly LigneAvantageEnNatureLocale[]
): LigneAvantageEnNatureLocale[] {
  const enregistrees = lignes.filter((l) => l.etat !== 'NON_ENREGISTREE');
  const nonEnregistrees = lignes.filter((l) => l.etat === 'NON_ENREGISTREE');
  return [...enregistrees, ...nonEnregistrees];
}

export function moisApplicationEgaux(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const triA = [...a].sort((x, y) => x - y);
  const triB = [...b].sort((x, y) => x - y);
  return triA.every((valeur, index) => valeur === triB[index]);
}

export function lignesEgales(
  a: LigneAvantageEnNatureLocale,
  b: LigneAvantageEnNatureLocale
): boolean {
  return (
    a.natureRef === b.natureRef &&
    a.montant === b.montant &&
    moisApplicationEgaux(a.moisApplication, b.moisApplication)
  );
}

export function estModifieeContreReference(
  courant: readonly LigneAvantageEnNatureLocale[],
  reference: readonly LigneAvantageEnNatureLocale[]
): boolean {
  return estModifieeContreReferenceTableau(courant, reference, lignesEgales);
}

export function libelleEtatLigne(ligne: LigneAvantageEnNatureLocale): string | null {
  return libelleEtatLigneHistorise(ligne);
}

export function extraireLigneReponse(
  avantagesEnNature: readonly AvantageEnNatureFiche[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): AvantageEnNatureFiche | undefined {
  return extraireLigneReponseParId(avantagesEnNature, ligneId, idsConnus);
}

export function versCorpsCreation(ligne: LigneAvantageEnNatureLocale) {
  return {
    natureRef: ligne.natureRef,
    montant: ligne.montant,
    moisApplication: [...ligne.moisApplication],
  };
}

export function versCorpsModification(
  ligne: LigneAvantageEnNatureLocale,
  reference: LigneAvantageEnNatureLocale
) {
  const corps: Record<string, unknown> = {};
  if (ligne.natureRef !== reference.natureRef) {
    corps.natureRef = ligne.natureRef;
  }
  if (ligne.montant !== reference.montant) {
    corps.montant = ligne.montant;
  }
  if (!moisApplicationEgaux(ligne.moisApplication, reference.moisApplication)) {
    corps.moisApplication = [...ligne.moisApplication];
  }
  return corps;
}

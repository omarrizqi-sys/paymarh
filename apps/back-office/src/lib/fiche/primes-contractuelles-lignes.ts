import type { PrimeContractuelleFiche } from '@paymarh/shared-types';
import { extraireLigneReponseParId, genererIdLocal } from './lignes-tableau-historise-commun';
import { moisApplicationEgaux } from './mois-application-commun';

export { genererIdLocal, reinitialiserCompteurIdLocal } from './lignes-tableau-historise-commun';

export type EtatPrimeContractuelleLocale = 'NON_ENREGISTREE' | 'ENREGISTREE';

export interface LignePrimeContractuelleLocale {
  readonly id: string;
  readonly primeRef: string;
  readonly moisApplication: readonly number[];
  readonly etat: EtatPrimeContractuelleLocale;
}

export function creerLigneVide(primeRef: string): LignePrimeContractuelleLocale {
  return {
    id: genererIdLocal(),
    primeRef,
    moisApplication: [],
    etat: 'NON_ENREGISTREE',
  };
}

export function depuisServeur(ligne: PrimeContractuelleFiche): LignePrimeContractuelleLocale {
  return {
    id: ligne.id,
    primeRef: ligne.primeRef,
    moisApplication: [...ligne.moisApplication],
    etat: 'ENREGISTREE',
  };
}

export function versServeur(ligne: LignePrimeContractuelleLocale): PrimeContractuelleFiche {
  return {
    id: ligne.id,
    primeRef: ligne.primeRef,
    moisApplication: [...ligne.moisApplication],
  };
}

/** Conserve l ordre serveur ; les non enregistrées passent en dernier. */
export function trierAffichage(
  lignes: readonly LignePrimeContractuelleLocale[]
): LignePrimeContractuelleLocale[] {
  const enregistrees = lignes.filter((l) => l.etat !== 'NON_ENREGISTREE');
  const nonEnregistrees = lignes.filter((l) => l.etat === 'NON_ENREGISTREE');
  return [...enregistrees, ...nonEnregistrees];
}

export function lignesEgales(
  a: LignePrimeContractuelleLocale,
  b: LignePrimeContractuelleLocale
): boolean {
  return a.primeRef === b.primeRef && moisApplicationEgaux(a.moisApplication, b.moisApplication);
}

export function estModifieeContreReference(
  courant: readonly LignePrimeContractuelleLocale[],
  reference: readonly LignePrimeContractuelleLocale[]
): boolean {
  const idsCourant = new Set(courant.map((l) => l.id));

  if (courant.some((l) => l.etat === 'NON_ENREGISTREE')) return true;
  if (reference.some((l) => !idsCourant.has(l.id))) return true;

  for (const ligne of courant) {
    if (ligne.etat === 'NON_ENREGISTREE') continue;
    const ref = reference.find((r) => r.id === ligne.id);
    if (ref === undefined) continue;
    if (!lignesEgales(ligne, ref)) return true;
  }

  return false;
}

export function extraireLigneReponse(
  primesContractuelles: readonly PrimeContractuelleFiche[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): PrimeContractuelleFiche | undefined {
  return extraireLigneReponseParId(primesContractuelles, ligneId, idsConnus);
}

export function versCorpsCreation(ligne: LignePrimeContractuelleLocale) {
  return {
    primeRef: ligne.primeRef,
    moisApplication: [...ligne.moisApplication],
  };
}

export function versCorpsModification(
  ligne: LignePrimeContractuelleLocale,
  reference: LignePrimeContractuelleLocale
) {
  const corps: Record<string, unknown> = {};
  if (ligne.primeRef !== reference.primeRef) {
    corps.primeRef = ligne.primeRef;
  }
  if (!moisApplicationEgaux(ligne.moisApplication, reference.moisApplication)) {
    corps.moisApplication = [...ligne.moisApplication];
  }
  return corps;
}

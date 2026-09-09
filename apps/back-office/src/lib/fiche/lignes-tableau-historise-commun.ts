import type { EtatLigneFiche } from '@paymarh/shared-types';

export type EtatLigneLocale = EtatLigneFiche | 'NON_ENREGISTREE';

export interface LigneTableauHistoriseBase {
  readonly id: string;
  readonly etat: EtatLigneLocale;
  readonly moisEffetFin: string | null;
}

let compteurIdLocal = 0;

export function genererIdLocal(): string {
  compteurIdLocal += 1;
  return `local-${compteurIdLocal}`;
}

/** Pour les tests : remet le compteur d ids locaux a zero. */
export function reinitialiserCompteurIdLocal(): void {
  compteurIdLocal = 0;
}

export function formaterMoisFin(moisEffetFin: string | null): string {
  if (moisEffetFin === null) return '';
  const [annee, mois] = moisEffetFin.split('-');
  return `${mois}/${annee}`;
}

/** Ligne terminee au mois en cours : plus modifiable, plus supprimable depuis l'ecran. */
export function estLigneTableauCloturee(ligne: LigneTableauHistoriseBase): boolean {
  return ligne.etat === 'CLOTUREE';
}

export function libelleEtatLigneHistorise(ligne: LigneTableauHistoriseBase): string | null {
  if (ligne.etat === 'NON_ENREGISTREE') return 'non enregistrée';
  if (estLigneTableauCloturee(ligne) && ligne.moisEffetFin !== null) {
    return `inactive depuis ${formaterMoisFin(ligne.moisEffetFin)}`;
  }
  return null;
}

export function trierAffichageTableauHistorise<T extends LigneTableauHistoriseBase>(
  lignes: readonly T[],
  comparateurEnregistrees: (a: T, b: T) => number
): T[] {
  const enregistrees = lignes.filter((l) => l.etat !== 'NON_ENREGISTREE');
  const nonEnregistrees = lignes.filter((l) => l.etat === 'NON_ENREGISTREE');
  const triees = [...enregistrees].sort(comparateurEnregistrees);
  return [...triees, ...nonEnregistrees];
}

export function estModifieeContreReferenceTableau<T extends LigneTableauHistoriseBase>(
  courant: readonly T[],
  reference: readonly T[],
  lignesEgales: (a: T, b: T) => boolean
): boolean {
  const idsCourant = new Set(courant.map((l) => l.id));

  if (courant.some((l) => l.etat === 'NON_ENREGISTREE')) return true;
  if (reference.some((l) => !idsCourant.has(l.id) && l.etat === 'ACTIVE')) return true;

  for (const ligne of courant) {
    if (ligne.etat === 'NON_ENREGISTREE') continue;
    const ref = reference.find((r) => r.id === ligne.id);
    if (ref === undefined) continue;
    if (!lignesEgales(ligne, ref)) return true;
  }

  return false;
}

export function extraireLigneReponseParId<T extends { readonly id: string }>(
  lignes: readonly T[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): T | undefined {
  const directe = lignes.find((l) => l.id === ligneId);
  if (directe !== undefined) return directe;
  return lignes.find((l) => !idsConnus.has(l.id));
}

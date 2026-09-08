import type { PretSalarie } from '@paymarh/shared-types';
import {
  estModifieeContreReferenceTableau,
  extraireLigneReponseParId,
  genererIdLocal,
  libelleEtatLigneHistorise,
  trierAffichageTableauHistorise,
  type EtatLigneLocale,
  type LigneTableauHistoriseBase,
} from './lignes-tableau-historise-commun';

export { genererIdLocal, reinitialiserCompteurIdLocal } from './lignes-tableau-historise-commun';

export interface LignePretLocale extends LigneTableauHistoriseBase {
  readonly libelleObjet: string;
  readonly libelleBulletin: string;
  readonly montantTotal: string;
  readonly moisDebut: string;
  readonly mensualite: string;
  readonly nombreEcheances: number;
  readonly soldeRestant: string;
}

export function creerLigneVide(): LignePretLocale {
  return {
    id: genererIdLocal(),
    libelleObjet: '',
    libelleBulletin: '',
    montantTotal: '',
    moisDebut: '',
    mensualite: '',
    nombreEcheances: 1,
    soldeRestant: '',
    etat: 'NON_ENREGISTREE',
    moisEffetFin: null,
  };
}

export function depuisServeur(ligne: PretSalarie): LignePretLocale {
  return {
    id: ligne.id,
    libelleObjet: ligne.libelleObjet,
    libelleBulletin: ligne.libelleBulletin,
    montantTotal: ligne.montantTotal,
    moisDebut: ligne.moisDebut,
    mensualite: ligne.mensualite,
    nombreEcheances: ligne.nombreEcheances,
    soldeRestant: ligne.soldeRestant,
    etat: ligne.etat,
    moisEffetFin: ligne.moisEffetFin,
  };
}

export function trierAffichage(lignes: readonly LignePretLocale[]): LignePretLocale[] {
  return trierAffichageTableauHistorise(lignes, (a, b) => a.moisDebut.localeCompare(b.moisDebut));
}

export function lignesEgales(a: LignePretLocale, b: LignePretLocale): boolean {
  return (
    a.libelleObjet === b.libelleObjet &&
    a.libelleBulletin === b.libelleBulletin &&
    a.montantTotal === b.montantTotal &&
    a.moisDebut === b.moisDebut &&
    a.mensualite === b.mensualite &&
    a.nombreEcheances === b.nombreEcheances
  );
}

export function estModifieeContreReference(
  courant: readonly LignePretLocale[],
  reference: readonly LignePretLocale[]
): boolean {
  return estModifieeContreReferenceTableau(courant, reference, lignesEgales);
}

export function libelleEtatLigne(ligne: LignePretLocale): string | null {
  return libelleEtatLigneHistorise(ligne);
}

export function extraireLigneReponse(
  prets: readonly PretSalarie[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): PretSalarie | undefined {
  return extraireLigneReponseParId(prets, ligneId, idsConnus);
}

export function afficherSoldeRestant(
  ligne: LignePretLocale,
  reference: LignePretLocale | undefined
): string {
  if (ligne.etat === 'NON_ENREGISTREE') return '';
  if (reference !== undefined && !lignesEgales(ligne, reference)) return '';
  return ligne.soldeRestant;
}

export function versCorpsCreation(ligne: LignePretLocale) {
  return {
    libelleObjet: ligne.libelleObjet,
    libelleBulletin: ligne.libelleBulletin,
    montantTotal: ligne.montantTotal,
    moisDebut: ligne.moisDebut,
    mensualite: ligne.mensualite,
    nombreEcheances: ligne.nombreEcheances,
  };
}

export function versCorpsModification(ligne: LignePretLocale, reference: LignePretLocale) {
  const corps: Record<string, unknown> = {};
  if (ligne.libelleObjet !== reference.libelleObjet) corps.libelleObjet = ligne.libelleObjet;
  if (ligne.libelleBulletin !== reference.libelleBulletin) {
    corps.libelleBulletin = ligne.libelleBulletin;
  }
  if (ligne.montantTotal !== reference.montantTotal) corps.montantTotal = ligne.montantTotal;
  if (ligne.moisDebut !== reference.moisDebut) corps.moisDebut = ligne.moisDebut;
  if (ligne.mensualite !== reference.mensualite) corps.mensualite = ligne.mensualite;
  if (ligne.nombreEcheances !== reference.nombreEcheances) {
    corps.nombreEcheances = ligne.nombreEcheances;
  }
  return corps;
}

export function estLigneEnregistree(ligne: LignePretLocale): boolean {
  return (ligne.etat as EtatLigneLocale) !== 'NON_ENREGISTREE';
}

import type { OrigineStatutParticulier, StatutParticulierFiche } from '@paymarh/shared-types';
import {
  estModifieeContreReferenceTableau,
  extraireLigneReponseParId,
  genererIdLocal,
  libelleEtatLigneHistorise,
  type LigneTableauHistoriseBase,
} from './lignes-tableau-historise-commun';

export { genererIdLocal, reinitialiserCompteurIdLocal } from './lignes-tableau-historise-commun';

export interface LigneStatutParticulierLocale extends LigneTableauHistoriseBase {
  readonly statutCode: string;
  readonly dateDebut: string;
  readonly dateFin: string | null;
  readonly origine: OrigineStatutParticulier;
}

/** Lignes propagées par la société : présentes en base et dans l’emploi parent, absentes de l’écran. */
export function estLigneStatutParticulierVisibleFiche(
  ligne: Pick<StatutParticulierFiche, 'origine'>
): boolean {
  return ligne.origine !== 'PROPAGE_SOCIETE';
}

export function filtrerLignesStatutsParticuliersVisibles<
  T extends Pick<StatutParticulierFiche, 'origine'>,
>(lignes: readonly T[]): T[] {
  return lignes.filter(estLigneStatutParticulierVisibleFiche);
}

/** Reformate AAAA-MM-JJ en JJ/MM/AAAA sans objet Date. */
export function afficherDateStatutParticulier(date: string): string {
  if (date === '') return '';
  const [annee, mois, jour] = date.split('-');
  return `${jour}/${mois}/${annee}`;
}

function moisEffetFinDepuisDateFin(dateFin: string | null): string | null {
  if (dateFin === null || dateFin === '') return null;
  return dateFin.slice(0, 7);
}

export function creerLigneVide(statutCode: string): LigneStatutParticulierLocale {
  return {
    id: genererIdLocal(),
    statutCode,
    dateDebut: '',
    dateFin: null,
    origine: 'SAISIE_MANUELLE',
    etat: 'NON_ENREGISTREE',
    moisEffetFin: null,
  };
}

export function depuisServeur(ligne: StatutParticulierFiche): LigneStatutParticulierLocale {
  return {
    id: ligne.id,
    statutCode: ligne.statutCode,
    dateDebut: ligne.dateDebut,
    dateFin: ligne.dateFin,
    origine: ligne.origine,
    etat: ligne.etat,
    moisEffetFin: moisEffetFinDepuisDateFin(ligne.dateFin),
  };
}

export function versServeur(ligne: LigneStatutParticulierLocale): StatutParticulierFiche {
  return {
    id: ligne.id,
    statutCode: ligne.statutCode,
    dateDebut: ligne.dateDebut,
    dateFin: ligne.dateFin,
    origine: ligne.origine,
    etat: ligne.etat === 'NON_ENREGISTREE' ? 'ACTIVE' : ligne.etat,
  };
}

/** Conserve l ordre serveur ; les non enregistrées passent en dernier. */
export function trierAffichage(
  lignes: readonly LigneStatutParticulierLocale[]
): LigneStatutParticulierLocale[] {
  const enregistrees = lignes.filter((l) => l.etat !== 'NON_ENREGISTREE');
  const nonEnregistrees = lignes.filter((l) => l.etat === 'NON_ENREGISTREE');
  return [...enregistrees, ...nonEnregistrees];
}

export function lignesEgales(
  a: LigneStatutParticulierLocale,
  b: LigneStatutParticulierLocale
): boolean {
  return a.statutCode === b.statutCode && a.dateDebut === b.dateDebut && a.dateFin === b.dateFin;
}

export function estModifieeContreReference(
  courant: readonly LigneStatutParticulierLocale[],
  reference: readonly LigneStatutParticulierLocale[]
): boolean {
  return estModifieeContreReferenceTableau(courant, reference, lignesEgales);
}

export function libelleEtatLigne(ligne: LigneStatutParticulierLocale): string | null {
  return libelleEtatLigneHistorise(ligne);
}

export function extraireLigneReponse(
  statutsParticuliers: readonly StatutParticulierFiche[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): StatutParticulierFiche | undefined {
  const visibles = filtrerLignesStatutsParticuliersVisibles(statutsParticuliers);
  return extraireLigneReponseParId(visibles, ligneId, idsConnus);
}

export function versCorpsCreation(ligne: LigneStatutParticulierLocale) {
  return {
    statutCode: ligne.statutCode,
    dateDebut: ligne.dateDebut,
    dateFin: ligne.dateFin,
  };
}

export function versCorpsModification(
  ligne: LigneStatutParticulierLocale,
  reference: LigneStatutParticulierLocale
) {
  const corps: Record<string, unknown> = {};
  if (ligne.statutCode !== reference.statutCode) {
    corps.statutCode = ligne.statutCode;
  }
  if (ligne.dateDebut !== reference.dateDebut) {
    corps.dateDebut = ligne.dateDebut;
  }
  if (ligne.dateFin !== reference.dateFin) {
    corps.dateFin = ligne.dateFin;
  }
  return corps;
}

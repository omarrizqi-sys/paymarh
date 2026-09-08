import type { PersonneACharge, SexePersonne } from '@paymarh/shared-types';
import {
  estModifieeContreReferenceTableau,
  extraireLigneReponseParId,
  genererIdLocal,
  libelleEtatLigneHistorise,
  trierAffichageTableauHistorise,
  type LigneTableauHistoriseBase,
} from './lignes-tableau-historise-commun';

export { genererIdLocal, reinitialiserCompteurIdLocal } from './lignes-tableau-historise-commun';

export interface LignePersonneAChargeLocale extends LigneTableauHistoriseBase {
  readonly lienParenteCode: string;
  readonly prenom: string;
  readonly nom: string;
  readonly sexe: SexePersonne;
  readonly dateNaissance: string;
  readonly situationHandicap: boolean;
  readonly aCharge: boolean;
}

export function creerLigneVide(): LignePersonneAChargeLocale {
  return {
    id: genererIdLocal(),
    lienParenteCode: 'ENFANT',
    prenom: '',
    nom: '',
    sexe: 'HOMME',
    dateNaissance: '',
    situationHandicap: false,
    aCharge: false,
    etat: 'NON_ENREGISTREE',
    moisEffetFin: null,
  };
}

export function depuisServeur(ligne: PersonneACharge): LignePersonneAChargeLocale {
  return {
    id: ligne.id,
    lienParenteCode: ligne.lienParenteCode,
    prenom: ligne.prenom,
    nom: ligne.nom,
    sexe: ligne.sexe,
    dateNaissance: ligne.dateNaissance.slice(0, 10),
    situationHandicap: ligne.situationHandicap ?? false,
    aCharge: ligne.aCharge,
    etat: ligne.etat,
    moisEffetFin: ligne.moisEffetFin,
  };
}

export function trierAffichage(
  lignes: readonly LignePersonneAChargeLocale[]
): LignePersonneAChargeLocale[] {
  return trierAffichageTableauHistorise(lignes, (a, b) =>
    a.dateNaissance.localeCompare(b.dateNaissance)
  );
}

export function lignesEgales(
  a: LignePersonneAChargeLocale,
  b: LignePersonneAChargeLocale
): boolean {
  return (
    a.lienParenteCode === b.lienParenteCode &&
    a.prenom === b.prenom &&
    a.nom === b.nom &&
    a.sexe === b.sexe &&
    a.dateNaissance === b.dateNaissance &&
    a.situationHandicap === b.situationHandicap &&
    a.aCharge === b.aCharge
  );
}

export function estModifieeContreReference(
  courant: readonly LignePersonneAChargeLocale[],
  reference: readonly LignePersonneAChargeLocale[]
): boolean {
  return estModifieeContreReferenceTableau(courant, reference, lignesEgales);
}

export function libelleEtatLigne(ligne: LignePersonneAChargeLocale): string | null {
  return libelleEtatLigneHistorise(ligne);
}

export function extraireLigneReponse(
  personnesACharge: readonly PersonneACharge[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): PersonneACharge | undefined {
  return extraireLigneReponseParId(personnesACharge, ligneId, idsConnus);
}

export function versCorpsCreation(ligne: LignePersonneAChargeLocale) {
  const corps = {
    lienParenteCode: ligne.lienParenteCode,
    prenom: ligne.prenom,
    nom: ligne.nom,
    sexe: ligne.sexe,
    dateNaissance: ligne.dateNaissance,
    aCharge: ligne.aCharge,
  };
  if (ligne.lienParenteCode === 'ENFANT') {
    return { ...corps, situationHandicap: ligne.situationHandicap };
  }
  return corps;
}

export function versCorpsModification(
  ligne: LignePersonneAChargeLocale,
  reference: LignePersonneAChargeLocale
) {
  const corps: Record<string, unknown> = {};
  if (ligne.lienParenteCode !== reference.lienParenteCode) {
    corps.lienParenteCode = ligne.lienParenteCode;
  }
  if (ligne.prenom !== reference.prenom) corps.prenom = ligne.prenom;
  if (ligne.nom !== reference.nom) corps.nom = ligne.nom;
  if (ligne.sexe !== reference.sexe) corps.sexe = ligne.sexe;
  if (ligne.dateNaissance !== reference.dateNaissance) corps.dateNaissance = ligne.dateNaissance;
  if (ligne.aCharge !== reference.aCharge) corps.aCharge = ligne.aCharge;
  if (
    ligne.lienParenteCode === 'ENFANT' &&
    ligne.situationHandicap !== reference.situationHandicap
  ) {
    corps.situationHandicap = ligne.situationHandicap;
  }
  return corps;
}

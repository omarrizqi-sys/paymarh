import type { SaisieSurSalaire } from '@paymarh/shared-types';
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

export interface LigneSaisieSurSalaireLocale extends LigneTableauHistoriseBase {
  readonly typeSaisieCode: string;
  readonly referenceDecision: string;
  readonly creancier: string;
  readonly libelleBulletin: string;
  readonly montantTotal: string;
  readonly montantMensuel: string;
  readonly moisDebut: string;
  readonly moisFin: string;
}

export function creerLigneVide(typeSaisieCodeParDefaut: string): LigneSaisieSurSalaireLocale {
  return {
    id: genererIdLocal(),
    typeSaisieCode: typeSaisieCodeParDefaut,
    referenceDecision: '',
    creancier: '',
    libelleBulletin: '',
    montantTotal: '',
    montantMensuel: '',
    moisDebut: '',
    moisFin: '',
    etat: 'NON_ENREGISTREE',
    moisEffetFin: null,
  };
}

export function depuisServeur(ligne: SaisieSurSalaire): LigneSaisieSurSalaireLocale {
  return {
    id: ligne.id,
    typeSaisieCode: ligne.typeSaisieCode,
    referenceDecision: ligne.referenceDecision,
    creancier: ligne.creancier,
    libelleBulletin: ligne.libelleBulletin,
    montantTotal: ligne.montantTotal ?? '',
    montantMensuel: ligne.montantMensuel ?? '',
    moisDebut: ligne.moisDebut,
    moisFin: ligne.moisFin ?? '',
    etat: ligne.etat,
    moisEffetFin: ligne.moisEffetFin,
  };
}

export function trierAffichage(
  lignes: readonly LigneSaisieSurSalaireLocale[]
): LigneSaisieSurSalaireLocale[] {
  return trierAffichageTableauHistorise(lignes, (a, b) => a.moisDebut.localeCompare(b.moisDebut));
}

export function lignesEgales(
  a: LigneSaisieSurSalaireLocale,
  b: LigneSaisieSurSalaireLocale
): boolean {
  return (
    a.typeSaisieCode === b.typeSaisieCode &&
    a.referenceDecision === b.referenceDecision &&
    a.creancier === b.creancier &&
    a.libelleBulletin === b.libelleBulletin &&
    a.montantTotal === b.montantTotal &&
    a.montantMensuel === b.montantMensuel &&
    a.moisDebut === b.moisDebut &&
    a.moisFin === b.moisFin
  );
}

export function estModifieeContreReference(
  courant: readonly LigneSaisieSurSalaireLocale[],
  reference: readonly LigneSaisieSurSalaireLocale[]
): boolean {
  return estModifieeContreReferenceTableau(courant, reference, lignesEgales);
}

export function libelleEtatLigne(ligne: LigneSaisieSurSalaireLocale): string | null {
  return libelleEtatLigneHistorise(ligne);
}

export function extraireLigneReponse(
  saisies: readonly SaisieSurSalaire[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): SaisieSurSalaire | undefined {
  return extraireLigneReponseParId(saisies, ligneId, idsConnus);
}

export function estPensionAlimentaire(typeSaisieCode: string): boolean {
  return typeSaisieCode === 'PENSION_ALIMENTAIRE';
}

export function estSaisieTiersDetenteur(typeSaisieCode: string): boolean {
  return typeSaisieCode === 'TIERS_DETENTEUR';
}

export function avertissementChangementType(
  ligne: LigneSaisieSurSalaireLocale,
  nouveauType: string
): string | null {
  if (nouveauType === ligne.typeSaisieCode) return null;

  if (
    estPensionAlimentaire(nouveauType) &&
    estSaisieTiersDetenteur(ligne.typeSaisieCode) &&
    ligne.montantTotal.trim() !== ''
  ) {
    return 'Le montant total saisi ne s’applique pas à une pension alimentaire et sera abandonné lors de l’enregistrement.';
  }

  if (
    estSaisieTiersDetenteur(nouveauType) &&
    estPensionAlimentaire(ligne.typeSaisieCode) &&
    (ligne.montantMensuel.trim() !== '' || ligne.moisFin.trim() !== '')
  ) {
    return 'Le montant mensuel et le mois de fin saisis ne s’appliquent pas à une saisie à tiers détenteur et seront abandonnés lors de l’enregistrement.';
  }

  return null;
}

export function versCorpsCreation(ligne: LigneSaisieSurSalaireLocale) {
  const commun = {
    typeSaisieCode: ligne.typeSaisieCode,
    referenceDecision: ligne.referenceDecision,
    creancier: ligne.creancier,
    libelleBulletin: ligne.libelleBulletin,
    moisDebut: ligne.moisDebut,
  };

  if (estPensionAlimentaire(ligne.typeSaisieCode)) {
    return {
      ...commun,
      montantMensuel: ligne.montantMensuel,
      ...(ligne.moisFin.trim() !== '' ? { moisFin: ligne.moisFin } : {}),
    };
  }

  return {
    ...commun,
    montantTotal: ligne.montantTotal,
  };
}

export function versCorpsModification(
  ligne: LigneSaisieSurSalaireLocale,
  reference: LigneSaisieSurSalaireLocale
) {
  const corps: Record<string, unknown> = {};
  if (ligne.typeSaisieCode !== reference.typeSaisieCode) {
    corps.typeSaisieCode = ligne.typeSaisieCode;
  }
  if (ligne.referenceDecision !== reference.referenceDecision) {
    corps.referenceDecision = ligne.referenceDecision;
  }
  if (ligne.creancier !== reference.creancier) corps.creancier = ligne.creancier;
  if (ligne.libelleBulletin !== reference.libelleBulletin) {
    corps.libelleBulletin = ligne.libelleBulletin;
  }
  if (ligne.moisDebut !== reference.moisDebut) corps.moisDebut = ligne.moisDebut;

  const typeEffectif = ligne.typeSaisieCode;
  if (estPensionAlimentaire(typeEffectif)) {
    if (ligne.montantMensuel !== reference.montantMensuel) {
      corps.montantMensuel = ligne.montantMensuel;
    }
    if (ligne.moisFin !== reference.moisFin) {
      corps.moisFin = ligne.moisFin.trim() === '' ? null : ligne.moisFin;
    }
  } else if (estSaisieTiersDetenteur(typeEffectif)) {
    if (ligne.montantTotal !== reference.montantTotal) {
      corps.montantTotal = ligne.montantTotal;
    }
  }

  return corps;
}

export function estLigneEnregistree(ligne: LigneSaisieSurSalaireLocale): boolean {
  return (ligne.etat as EtatLigneLocale) !== 'NON_ENREGISTREE';
}

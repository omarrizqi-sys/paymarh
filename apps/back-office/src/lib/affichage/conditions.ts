/**
 * Conditions d affichage du formulaire — reproduction de la structure spec,
 * pas de validation metier (cf. docs/adr/0009-front-sans-regle-metier.md).
 */

export function afficherDateInactivite(etatDossier: string): boolean {
  return etatDossier === 'INACTIVE';
}

export function afficherDatesExoneration(typeExonerationId: string | null | undefined): boolean {
  return typeExonerationId != null && typeExonerationId !== '';
}

export function afficherIndemniteTeletravailVersee(teletravailAutorise: boolean | null): boolean {
  return teletravailAutorise === true;
}

export function afficherMontantIndemniteTeletravail(
  teletravailAutorise: boolean | null,
  indemniteVersee: boolean | null
): boolean {
  return teletravailAutorise === true && indemniteVersee === true;
}

export function afficherUtiliseParCompte(nombreEtablissements: number): boolean {
  return nombreEtablissements > 1;
}

export function afficherFormatCodePostalMaroc(pays: string | null | undefined): boolean {
  return (pays ?? 'MA') === 'MA';
}

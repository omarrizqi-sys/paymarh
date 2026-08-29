/**
 * Controles de coherence de la fiche societe (purs, sans acces base).
 *
 * Les messages restent neutres : aucune information ne doit reveler
 * l existence d une donnee hors perimetre (regle d etancheite).
 *
 * Les controles d unicite (code dossier, IF, ICE) passent par la base
 * et seront exposes en 1.1.b ; ici on teste les regles temporelles.
 */

const MOTIF_AAAA_MM = /^\d{4}-(0[1-9]|1[0-2])$/;

export type ErreurCoherence =
  | 'MOIS_FORMAT_INVALIDE'
  | 'MONTAGE_APRES_PRODUCTION'
  | 'INACTIVITE_OBLIGATOIRE'
  | 'INACTIVITE_NON_POSTERIEURE'
  | 'CESSATION_AVANT_CREATION'
  | 'EXONERATION_DEBUT_OBLIGATOIRE'
  | 'EXONERATION_FIN_AVANT_DEBUT'
  | 'MOIS_CLOTURE_HORS_PLAGE';

export interface EtatDossierSaisi {
  etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  moisDebutMontage: string;
  moisDebutProduction: string;
  dateInactivite: string | null;
}

export function estMoisAAAA_MM(valeur: string): boolean {
  return MOTIF_AAAA_MM.test(valeur);
}

/**
 * Verifie la coherence des mois d etat du dossier.
 * - moisDebutMontage <= moisDebutProduction
 * - si INACTIVE : dateInactivite obligatoire et > moisDebutProduction
 */
export function controlerEtatDossier(saisie: EtatDossierSaisi): ErreurCoherence[] {
  const erreurs: ErreurCoherence[] = [];

  if (!estMoisAAAA_MM(saisie.moisDebutMontage) || !estMoisAAAA_MM(saisie.moisDebutProduction)) {
    erreurs.push('MOIS_FORMAT_INVALIDE');
    return erreurs;
  }

  if (saisie.moisDebutMontage > saisie.moisDebutProduction) {
    erreurs.push('MONTAGE_APRES_PRODUCTION');
  }

  if (saisie.etatDossier === 'INACTIVE') {
    if (saisie.dateInactivite === null || saisie.dateInactivite === '') {
      erreurs.push('INACTIVITE_OBLIGATOIRE');
    } else if (!estMoisAAAA_MM(saisie.dateInactivite)) {
      erreurs.push('MOIS_FORMAT_INVALIDE');
    } else if (saisie.dateInactivite <= saisie.moisDebutProduction) {
      erreurs.push('INACTIVITE_NON_POSTERIEURE');
    }
  }

  return erreurs;
}

/**
 * Date de cessation d activite >= date de creation (quand les deux sont saisies).
 * Comparaison sur des dates calendaires (objet Date a minuit UTC ou local).
 */
export function controlerDatesCreationCessation(
  dateCreation: Date | null,
  dateCessationActivite: Date | null
): ErreurCoherence[] {
  if (dateCreation === null || dateCessationActivite === null) {
    return [];
  }
  if (dateCessationActivite < dateCreation) {
    return ['CESSATION_AVANT_CREATION'];
  }
  return [];
}

/**
 * Exoneration : debut obligatoire si un type est choisi ; fin >= debut si presente.
 */
export function controlerExoneration(saisie: {
  typeExonerationId: string | null;
  exonerationDateDebut: string | null;
  exonerationDateFin: string | null;
}): ErreurCoherence[] {
  const erreurs: ErreurCoherence[] = [];

  if (saisie.typeExonerationId === null) {
    return erreurs;
  }

  if (saisie.exonerationDateDebut === null || saisie.exonerationDateDebut === '') {
    erreurs.push('EXONERATION_DEBUT_OBLIGATOIRE');
    return erreurs;
  }

  if (!estMoisAAAA_MM(saisie.exonerationDateDebut)) {
    erreurs.push('MOIS_FORMAT_INVALIDE');
    return erreurs;
  }

  if (saisie.exonerationDateFin !== null && saisie.exonerationDateFin !== '') {
    if (!estMoisAAAA_MM(saisie.exonerationDateFin)) {
      erreurs.push('MOIS_FORMAT_INVALIDE');
    } else if (saisie.exonerationDateFin < saisie.exonerationDateDebut) {
      erreurs.push('EXONERATION_FIN_AVANT_DEBUT');
    }
  }

  return erreurs;
}

export function controlerMoisClotureConges(mois: number): ErreurCoherence[] {
  if (!Number.isInteger(mois) || mois < 1 || mois > 12) {
    return ['MOIS_CLOTURE_HORS_PLAGE'];
  }
  return [];
}

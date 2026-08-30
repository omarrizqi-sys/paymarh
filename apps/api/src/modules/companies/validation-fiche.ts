import type { ApiWarning } from '@paymarh/shared-types';
import {
  controlerDatesCreationCessation,
  controlerEtatDossier,
  controlerExoneration,
  estMoisAAAA_MM,
} from './coherence-fiche-societe.js';

export class ValidationBloquanteError extends Error {
  readonly code: string;
  readonly champ?: string;

  constructor(code: string, message: string, champ?: string) {
    super(message);
    this.name = 'ValidationBloquanteError';
    this.code = code;
    this.champ = champ;
  }
}

const MOTIF_ALPHABETIQUE = /^[\p{L}\s'-]*$/u;
const MOTIF_CHIFFRES = /^\d*$/;

export function assertAlphabetique(valeur: string | null | undefined, champ: string): void {
  if (valeur === null || valeur === undefined || valeur === '') return;
  if (!MOTIF_ALPHABETIQUE.test(valeur)) {
    throw new ValidationBloquanteError(
      'CARACTERE_NON_CONFORME',
      'Ce champ n accepte que des lettres, espaces, tirets et apostrophes.',
      champ
    );
  }
}

export function assertChiffres(valeur: string | null | undefined, champ: string): void {
  if (valeur === null || valeur === undefined || valeur === '') return;
  if (!MOTIF_CHIFFRES.test(valeur)) {
    throw new ValidationBloquanteError(
      'CARACTERE_NON_CONFORME',
      'Ce champ n accepte que des chiffres.',
      champ
    );
  }
}

export function assertObligatoire(valeur: unknown, champ: string): void {
  if (valeur === null || valeur === undefined || valeur === '') {
    throw new ValidationBloquanteError('CHAMP_OBLIGATOIRE', 'Ce champ est obligatoire.', champ);
  }
}

/** Refuse null ou undefined, mais accepte false et 0. */
export function assertPresent<T>(valeur: T | null | undefined, champ: string): asserts valeur is T {
  if (valeur === null || valeur === undefined) {
    throw new ValidationBloquanteError('CHAMP_OBLIGATOIRE', 'Ce champ est obligatoire.', champ);
  }
}

export function assertMoisAAAA_MM(valeur: string, champ: string): void {
  if (!estMoisAAAA_MM(valeur)) {
    throw new ValidationBloquanteError(
      'MOIS_FORMAT_INVALIDE',
      'Le mois doit etre au format AAAA-MM.',
      champ
    );
  }
}

export function controlerCoherenceDossier(saisie: {
  etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  moisDebutMontage: string;
  moisDebutProduction: string;
  dateInactivite: string | null;
}): void {
  const erreurs = controlerEtatDossier(saisie);
  for (const erreur of erreurs) {
    switch (erreur) {
      case 'MONTAGE_APRES_PRODUCTION':
        throw new ValidationBloquanteError(
          'MONTAGE_APRES_PRODUCTION',
          'Le mois de debut de montage ne peut pas etre posterieur au mois de debut de production.',
          'moisDebutMontage'
        );
      case 'INACTIVITE_OBLIGATOIRE':
        throw new ValidationBloquanteError(
          'INACTIVITE_OBLIGATOIRE',
          'La date d inactivite est obligatoire lorsque le dossier est inactif.',
          'dateInactivite'
        );
      case 'INACTIVITE_NON_POSTERIEURE':
        throw new ValidationBloquanteError(
          'INACTIVITE_NON_POSTERIEURE',
          'La date d inactivite doit etre strictement posterieure au mois de debut de production.',
          'dateInactivite'
        );
      case 'MOIS_FORMAT_INVALIDE':
        throw new ValidationBloquanteError(
          'MOIS_FORMAT_INVALIDE',
          'Le mois doit etre au format AAAA-MM.'
        );
      default:
        throw new ValidationBloquanteError(erreur, 'Donnees incoherentes.');
    }
  }
}

export function controlerDatesSociete(
  dateCreation: Date | null,
  dateCessation: Date | null
): void {
  const erreurs = controlerDatesCreationCessation(dateCreation, dateCessation);
  if (erreurs.includes('CESSATION_AVANT_CREATION')) {
    throw new ValidationBloquanteError(
      'CESSATION_AVANT_CREATION',
      'La date de cessation d activite ne peut pas etre anterieure a la date de creation.',
      'dateCessationActivite'
    );
  }
}

export function controlerExonerationOuErreur(saisie: {
  typeExonerationId: string | null;
  exonerationDateDebut: string | null;
  exonerationDateFin: string | null;
}): void {
  const erreurs = controlerExoneration(saisie);
  for (const erreur of erreurs) {
    if (erreur === 'EXONERATION_DEBUT_OBLIGATOIRE') {
      throw new ValidationBloquanteError(
        'EXONERATION_DEBUT_OBLIGATOIRE',
        'La date de debut est obligatoire lorsqu une exoneration est choisie.',
        'exonerationDateDebut'
      );
    }
    if (erreur === 'EXONERATION_FIN_AVANT_DEBUT') {
      throw new ValidationBloquanteError(
        'EXONERATION_FIN_AVANT_DEBUT',
        'La date de fin d exoneration ne peut pas etre anterieure a la date de debut.',
        'exonerationDateFin'
      );
    }
    if (erreur === 'MOIS_FORMAT_INVALIDE') {
      throw new ValidationBloquanteError(
        'MOIS_FORMAT_INVALIDE',
        'Le mois doit etre au format AAAA-MM.'
      );
    }
  }
}

/** Message neutre d unicite — ne revele jamais quelle societe est en cause. */
export function erreurValeurIndisponible(champ: string): ValidationBloquanteError {
  return new ValidationBloquanteError(
    'VALEUR_INDISPONIBLE',
    "Cette valeur n'est pas disponible.",
    champ
  );
}

export function avertissementsIdentifiants(saisie: {
  rib?: string | null;
  iban?: string | null;
  bic?: string | null;
  ice?: string | null;
  codePostal?: string | null;
  pays?: string | null;
}): ApiWarning[] {
  const warnings: ApiWarning[] = [];

  if (saisie.rib && saisie.rib.length !== 24) {
    warnings.push({
      code: 'LONGUEUR_INATTENDUE',
      champ: 'rib',
      message: 'La longueur attendue d un RIB marocain est de 24 caracteres.',
    });
  }

  if (saisie.iban) {
    if (saisie.iban.length !== 28 || !saisie.iban.startsWith('MA')) {
      warnings.push({
        code: 'LONGUEUR_INATTENDUE',
        champ: 'iban',
        message: 'La longueur attendue d un IBAN marocain est de 28 caracteres, prefixe MA.',
      });
    }
  }

  if (saisie.bic && saisie.bic.length !== 8 && saisie.bic.length !== 11) {
    warnings.push({
      code: 'LONGUEUR_INATTENDUE',
      champ: 'bic',
      message: 'La longueur attendue d un BIC est de 8 ou 11 caracteres.',
    });
  }

  if (saisie.ice && saisie.ice.length !== 15) {
    warnings.push({
      code: 'LONGUEUR_INATTENDUE',
      champ: 'ice',
      message: 'La longueur attendue d un ICE est de 15 caracteres.',
    });
  }

  const pays = saisie.pays ?? 'MA';
  if (
    pays === 'MA' &&
    saisie.codePostal &&
    saisie.codePostal.length > 0 &&
    !/^\d{5}$/.test(saisie.codePostal)
  ) {
    warnings.push({
      code: 'CODE_POSTAL_INATTENDU',
      champ: 'codePostal',
      message: 'Un code postal marocain comporte generalement 5 chiffres.',
    });
  }

  return warnings;
}

export function avertissementRaisonSocialeDoublon(): ApiWarning {
  return {
    code: 'RAISON_SOCIALE_DEJA_UTILISEE',
    champ: 'raisonSociale',
    message: 'Cette raison sociale est deja utilisee dans le compte.',
  };
}

export function avertissementRetourMontage(): ApiWarning {
  return {
    code: 'RETOUR_EN_MONTAGE',
    message:
      'Le dossier repasse en montage. Les bulletins deja produits restent intacts ; aucun bulletin definitif ne pourra etre emis tant que le dossier est en montage.',
  };
}

export function avertissementAucunCompteSalaires(): ApiWarning {
  return {
    code: 'AUCUN_COMPTE_SALAIRES',
    message: 'Aucun compte bancaire ne porte actuellement l usage salaires.',
  };
}

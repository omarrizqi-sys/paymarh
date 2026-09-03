import type { AlerteApi } from '@paymarh/shared-types';
import { CODES_REPONSE } from './reponses/codes-reponse.js';

export class ValidationBloquanteSalarieError extends Error {
  readonly code: string;
  readonly champ?: string;

  constructor(code: string, message: string, champ?: string) {
    super(message);
    this.name = 'ValidationBloquanteSalarieError';
    this.code = code;
    this.champ = champ;
  }
}

const MOTIF_ALPHABETIQUE = /^[\p{L}\s'-]*$/u;
const MOTIF_CHIFFRES = /^\d*$/;
const MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOTIF_TELEPHONE = /^[+]?[\d\s()./-]{6,20}$/;

export function assertAlphabetiqueSalarie(
  valeur: string | null | undefined,
  champ: string
): void {
  if (valeur === null || valeur === undefined || valeur === '') return;
  if (!MOTIF_ALPHABETIQUE.test(valeur)) {
    throw new ValidationBloquanteSalarieError(
      CODES_REPONSE.CARACTERE_NON_CONFORME.code,
      CODES_REPONSE.CARACTERE_NON_CONFORME.message,
      champ
    );
  }
}

export function assertChiffresSalarie(
  valeur: string | null | undefined,
  champ: string
): void {
  if (valeur === null || valeur === undefined || valeur === '') return;
  if (!MOTIF_CHIFFRES.test(valeur)) {
    throw new ValidationBloquanteSalarieError(
      CODES_REPONSE.CARACTERE_NON_CONFORME.code,
      CODES_REPONSE.CARACTERE_NON_CONFORME.message,
      champ
    );
  }
}

export function erreurValeurIndisponible(champ: string): ValidationBloquanteSalarieError {
  return new ValidationBloquanteSalarieError(
    CODES_REPONSE.VALEUR_INDISPONIBLE.code,
    CODES_REPONSE.VALEUR_INDISPONIBLE.message,
    champ
  );
}

export interface SaisieControlesSalarie {
  readonly dateEntree?: Date | string | null;
  readonly dateAnciennete?: Date | string | null;
  readonly codePostal?: string | null;
  readonly paysId?: string | null;
  readonly paysResidenceEstMaroc?: boolean;
  readonly emailPersonnel?: string | null;
  readonly emailProfessionnel?: string | null;
  readonly telephonePersonnel?: string | null;
  readonly telephoneProfessionnel?: string | null;
  readonly urgenceEmail?: string | null;
  readonly urgenceTelephone?: string | null;
}

function versDate(valeur: Date | string | null | undefined): Date | null {
  if (valeur === null || valeur === undefined) return null;
  if (valeur instanceof Date) return valeur;
  return new Date(valeur);
}

export function collecterAlertesSalarie(saisie: SaisieControlesSalarie): AlerteApi[] {
  const alertes: AlerteApi[] = [];

  const entree = versDate(saisie.dateEntree);
  const anciennete = versDate(saisie.dateAnciennete);
  if (entree !== null && anciennete !== null && anciennete > entree) {
    alertes.push({
      code: CODES_REPONSE.ANCIENNETE_POSTERIEURE_ENTREE.code,
      champ: 'dateAnciennete',
      message: CODES_REPONSE.ANCIENNETE_POSTERIEURE_ENTREE.message,
    });
  }

  const champsContact: { champ: string; valeur: string | null | undefined }[] = [
    { champ: 'emailPersonnel', valeur: saisie.emailPersonnel },
    { champ: 'emailProfessionnel', valeur: saisie.emailProfessionnel },
    { champ: 'urgenceEmail', valeur: saisie.urgenceEmail },
    { champ: 'telephonePersonnel', valeur: saisie.telephonePersonnel },
    { champ: 'telephoneProfessionnel', valeur: saisie.telephoneProfessionnel },
    { champ: 'urgenceTelephone', valeur: saisie.urgenceTelephone },
  ];

  for (const { champ, valeur } of champsContact) {
    if (valeur === null || valeur === undefined || valeur.trim() === '') continue;
    const estEmail = champ.includes('mail');
    const valide = estEmail ? MOTIF_EMAIL.test(valeur) : MOTIF_TELEPHONE.test(valeur);
    if (!valide) {
      alertes.push({
        code: CODES_REPONSE.FORMAT_CONTACT_INVALIDE.code,
        champ,
        message: CODES_REPONSE.FORMAT_CONTACT_INVALIDE.message,
      });
    }
  }

  if (
    saisie.paysResidenceEstMaroc === true &&
    saisie.codePostal !== null &&
    saisie.codePostal !== undefined &&
    saisie.codePostal.length > 0 &&
    saisie.codePostal.length !== 5
  ) {
    alertes.push({
      code: CODES_REPONSE.CODE_POSTAL_MAROC_INATTENDU.code,
      champ: 'codePostal',
      message: CODES_REPONSE.CODE_POSTAL_MAROC_INATTENDU.message,
    });
  }

  return alertes;
}

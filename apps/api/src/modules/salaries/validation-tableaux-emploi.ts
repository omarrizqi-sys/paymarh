import type { AlerteApi } from '@paymarh/shared-types';
import { CODES_REPONSE } from './reponses/codes-reponse.js';

export class ValidationBloquanteTableauEmploiError extends Error {
  readonly code: string;
  readonly champ?: string;

  constructor(code: string, message: string, champ?: string) {
    super(message);
    this.name = 'ValidationBloquanteTableauEmploiError';
    this.code = code;
    this.champ = champ;
  }
}

interface IntervalleStatut {
  readonly id?: string;
  readonly dateDebut: Date;
  readonly dateFin: Date | null;
}

function datesSeChevauchent(a: IntervalleStatut, b: IntervalleStatut): boolean {
  const finA = a.dateFin ?? new Date('9999-12-31');
  const finB = b.dateFin ?? new Date('9999-12-31');
  return a.dateDebut <= finB && b.dateDebut <= finA;
}

export function assertPasChevauchementStatuts(
  lignes: readonly IntervalleStatut[],
  candidat: IntervalleStatut
): void {
  for (const ligne of lignes) {
    if (ligne.id !== undefined && ligne.id === candidat.id) continue;
    if (datesSeChevauchent(ligne, candidat)) {
      throw new ValidationBloquanteTableauEmploiError(
        CODES_REPONSE.CHEVAUCHEMENT_STATUTS.code,
        CODES_REPONSE.CHEVAUCHEMENT_STATUTS.message
      );
    }
  }
}

export function collecterAlerteStatutHorsEmploi(
  dateDebutEmploi: Date,
  dateFinEmploi: Date | null,
  dateDebutStatut: Date,
  dateFinStatut: Date | null
): AlerteApi | null {
  const finEmploi = dateFinEmploi ?? new Date('9999-12-31');
  const finStatut = dateFinStatut ?? new Date('9999-12-31');
  if (dateDebutStatut < dateDebutEmploi || finStatut > finEmploi) {
    return {
      code: CODES_REPONSE.STATUT_HORS_INTERVALLE_EMPLOI.code,
      message: CODES_REPONSE.STATUT_HORS_INTERVALLE_EMPLOI.message,
    };
  }
  return null;
}

export function refuserStatutNonSaisissable(statutCode: string | undefined): void {
  if (statutCode === 'TAHFIZ') {
    throw new ValidationBloquanteTableauEmploiError(
      CODES_REPONSE.CHAMP_INTERDIT.code,
      CODES_REPONSE.CHAMP_INTERDIT.message,
      'statutCode'
    );
  }
}

export function refuserModificationStatutPropage(origine: string): void {
  if (origine === 'PROPAGE_SOCIETE') {
    throw new ValidationBloquanteTableauEmploiError(
      CODES_REPONSE.STATUT_PROPAGE_LECTURE_SEULE.code,
      CODES_REPONSE.STATUT_PROPAGE_LECTURE_SEULE.message
    );
  }
}

export function refuserChampMoisEffetEmploi(dto: object): void {
  const interdit = ['moisEffet', 'moisEffetDebut', 'moisEffetFin'] as const;
  for (const cle of interdit) {
    if (cle in dto && (dto as Record<string, unknown>)[cle] !== undefined) {
      throw new ValidationBloquanteTableauEmploiError(
        CODES_REPONSE.CHAMP_INTERDIT.code,
        CODES_REPONSE.CHAMP_INTERDIT.message,
        cle
      );
    }
  }
}

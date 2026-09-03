import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { emploiEstOuvert } from './deductions-salarie.js';
import { resoudreLigneHistorique } from '../companies/historisation.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import {
  comparerDates,
  dateDansIntervalle,
  versDate,
} from './deductions-emploi.js';
import type { ReferentielNationalPort } from './referentiel-national/referentiel-national.port.js';

export class ValidationBloquanteEmploiError extends Error {
  readonly code: string;
  readonly champ?: string;

  constructor(code: string, message: string, champ?: string) {
    super(message);
    this.name = 'ValidationBloquanteEmploiError';
    this.code = code;
    this.champ = champ;
  }
}

export function assertDateFinApresDebut(dateDebut: Date, dateFin: Date | null | undefined): void {
  if (dateFin === null || dateFin === undefined) return;
  if (comparerDates(dateFin, dateDebut) < 0) {
    throw new ValidationBloquanteEmploiError(
      CODES_REPONSE.DATE_FIN_ANTERIEURE_DEBUT.code,
      CODES_REPONSE.DATE_FIN_ANTERIEURE_DEBUT.message,
      'dateFin'
    );
  }
}

export interface ContexteContratEmploi {
  dateDebut: Date;
  dateFin?: Date | null;
  dateSortie?: Date | null;
  periodeEssaiDateFin?: Date | null;
  renouvellementEssaiDateFin?: Date | null;
}

export function collecterAlertesContrat(contrat: ContexteContratEmploi): AlerteApi[] {
  const alertes: AlerteApi[] = [];
  const { dateDebut, dateFin } = contrat;

  if (
    contrat.dateSortie !== null &&
    contrat.dateSortie !== undefined &&
    !dateDansIntervalle(contrat.dateSortie, dateDebut, dateFin ?? null)
  ) {
    alertes.push({
      code: CODES_REPONSE.DATE_SORTIE_HORS_INTERVALLE.code,
      champ: 'dateSortie',
      message: CODES_REPONSE.DATE_SORTIE_HORS_INTERVALLE.message,
    });
  }

  if (
    contrat.periodeEssaiDateFin !== null &&
    contrat.periodeEssaiDateFin !== undefined &&
    !dateDansIntervalle(contrat.periodeEssaiDateFin, dateDebut, dateFin ?? null)
  ) {
    alertes.push({
      code: CODES_REPONSE.FIN_ESSAI_HORS_INTERVALLE.code,
      champ: 'periodeEssaiDateFin',
      message: CODES_REPONSE.FIN_ESSAI_HORS_INTERVALLE.message,
    });
  }

  if (
    contrat.renouvellementEssaiDateFin !== null &&
    contrat.renouvellementEssaiDateFin !== undefined &&
    contrat.periodeEssaiDateFin !== null &&
    contrat.periodeEssaiDateFin !== undefined &&
    comparerDates(contrat.renouvellementEssaiDateFin, contrat.periodeEssaiDateFin) < 0
  ) {
    alertes.push({
      code: CODES_REPONSE.RENOUVELLEMENT_ESSAI_ANTERIEUR.code,
      champ: 'renouvellementEssaiDateFin',
      message: CODES_REPONSE.RENOUVELLEMENT_ESSAI_ANTERIEUR.message,
    });
  }

  return alertes;
}

export async function collecterAlerteSalaireSmig(
  referentiel: ReferentielNationalPort,
  mois: string,
  montant: Decimal
): Promise<AlerteApi | null> {
  const smig = await referentiel.lireValeur('SMIG', mois);
  if (smig === null) return null;
  if (montant.lessThan(smig)) {
    return {
      code: CODES_REPONSE.SALAIRE_INFERIEUR_SMIG.code,
      champ: 'montant',
      message: CODES_REPONSE.SALAIRE_INFERIEUR_SMIG.message,
    };
  }
  return null;
}

export async function collecterAlerteDureeContractuelleTotale(
  prisma: PrismaClient,
  referentiel: ReferentielNationalPort,
  salarieId: string,
  mois: string,
  dureeEmploiCourant: Decimal | null | undefined,
  exclureEmploiId?: string
): Promise<AlerteApi | null> {
  const seuil = await referentiel.lireValeur('DUREE_LEGALE_TRAVAIL', mois);
  if (seuil === null) return null;

  const emplois = await prisma.emploi.findMany({
    where: {
      salarieId,
      ...(exclureEmploiId !== undefined ? { id: { not: exclureEmploiId } } : {}),
    },
    select: {
      id: true,
      affectationVersions: { select: { moisEffet: true, dureeContractuelle: true } },
      contratVersions: {
        orderBy: { moisEffet: 'desc' },
        take: 1,
        select: { dateSortie: true },
      },
    },
  });

  let total = new Decimal(0);
  if (dureeEmploiCourant !== null && dureeEmploiCourant !== undefined) {
    total = total.plus(dureeEmploiCourant);
  }

  for (const emploi of emplois) {
    const contrat = emploi.contratVersions[0];
    if (contrat === undefined || !emploiEstOuvert(contrat.dateSortie)) continue;

    const affectation = resoudreLigneHistorique(emploi.affectationVersions, mois);
    if (affectation?.dureeContractuelle !== null && affectation?.dureeContractuelle !== undefined) {
      total = total.plus(affectation.dureeContractuelle);
    }
  }

  if (total.greaterThan(seuil)) {
    return {
      code: CODES_REPONSE.DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE.code,
      message: CODES_REPONSE.DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE.message,
    };
  }
  return null;
}

export function refuserChampMoisEffet(dto: object): void {
  if ('moisEffet' in dto && (dto as { moisEffet?: unknown }).moisEffet !== undefined) {
    throw new ValidationBloquanteEmploiError(
      CODES_REPONSE.CHAMP_INTERDIT.code,
      CODES_REPONSE.CHAMP_INTERDIT.message,
      'moisEffet'
    );
  }
}

export function parseDateOptionnelle(valeur: string | undefined): Date | undefined {
  if (valeur === undefined) return undefined;
  return versDate(valeur);
}

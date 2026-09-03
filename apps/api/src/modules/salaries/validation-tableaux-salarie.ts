import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  avertissementsIdentifiants,
  assertChiffres,
} from '../companies/validation-fiche.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import { sommePartsVirement } from './deductions-tableaux.js';
import type { ReferentielNationalPort } from './referentiel-national/referentiel-national.port.js';
import { assertAlphabetiqueSalarie } from './validation-salarie.js';

export class ValidationBloquanteTableauError extends Error {
  readonly code: string;
  readonly champ?: string;

  constructor(code: string, message: string, champ?: string) {
    super(message);
    this.name = 'ValidationBloquanteTableauError';
    this.code = code;
    this.champ = champ;
  }
}

export function refuserChampMoisEffet(dto: object): void {
  const interdit = ['moisEffet', 'moisEffetDebut', 'moisEffetFin'] as const;
  for (const cle of interdit) {
    if (cle in dto && (dto as Record<string, unknown>)[cle] !== undefined) {
      throw new ValidationBloquanteTableauError(
        CODES_REPONSE.CHAMP_INTERDIT.code,
        CODES_REPONSE.CHAMP_INTERDIT.message,
        cle
      );
    }
  }
}

export function refuserSituationHandicapConjoint(
  lienParenteCode: string,
  situationHandicap: boolean | undefined
): void {
  if (lienParenteCode === 'CONJOINT' && situationHandicap !== undefined) {
    throw new ValidationBloquanteTableauError(
      CODES_REPONSE.CHAMP_INTERDIT.code,
      CODES_REPONSE.CHAMP_INTERDIT.message,
      'situationHandicap'
    );
  }
}

export function assertPartVirement(
  comptes: readonly { partVirement?: string | null }[]
): void {
  if (comptes.length <= 1) return;
  const parts = comptes.map((c) =>
    c.partVirement !== null && c.partVirement !== undefined
      ? new Decimal(c.partVirement)
      : new Decimal(0)
  );
  if (!sommePartsVirement(parts).equals(100)) {
    throw new ValidationBloquanteTableauError(
      CODES_REPONSE.PART_VIREMENT_INVALIDE.code,
      CODES_REPONSE.PART_VIREMENT_INVALIDE.message
    );
  }
}

export function assertMontantMensuelSaisie(
  montantMensuel: Decimal,
  montantTotal: Decimal
): void {
  if (montantMensuel.gt(montantTotal)) {
    throw new ValidationBloquanteTableauError(
      CODES_REPONSE.MONTANT_MENSUEL_SUPERIEUR_TOTAL.code,
      CODES_REPONSE.MONTANT_MENSUEL_SUPERIEUR_TOTAL.message,
      'montantMensuel'
    );
  }
}

export function collecterAlertesIdentifiantsBancaires(saisie: {
  rib?: string | null;
  iban?: string | null;
  bic?: string | null;
}): AlerteApi[] {
  return avertissementsIdentifiants(saisie).map((w) => ({
    code: CODES_REPONSE.FORMAT_IDENTIFIANT_BANCAIRE.code,
    champ: w.champ,
    message: w.message,
  }));
}

export async function collecterAlerteBanqueIncoherente(
  prisma: PrismaService,
  banqueId: string | null | undefined,
  rib: string | null | undefined
): Promise<AlerteApi | null> {
  if (banqueId === null || banqueId === undefined || rib === null || rib === undefined || rib.length < 3) {
    return null;
  }
  const codeRib = rib.slice(0, 3);
  const banque = await prisma.banque.findUnique({
    where: { id: banqueId },
    select: { codeBanque: true },
  });
  if (banque?.codeBanque !== null && banque?.codeBanque !== undefined && banque.codeBanque !== codeRib) {
    return {
      code: CODES_REPONSE.BANQUE_INCOHERENTE.code,
      champ: 'banqueId',
      message: CODES_REPONSE.BANQUE_INCOHERENTE.message,
    };
  }
  return null;
}

export async function resoudreBanqueDepuisRib(
  prisma: PrismaService,
  rib: string | null | undefined,
  banqueId: string | null | undefined
): Promise<string | null> {
  if (banqueId !== null && banqueId !== undefined) return banqueId;
  if (rib === null || rib === undefined || rib.length < 3) return null;
  const codeRib = rib.slice(0, 3);
  const banque = await prisma.banque.findFirst({
    where: { codeBanque: codeRib },
    select: { id: true },
  });
  return banque?.id ?? null;
}

export async function collecterAlerteRibDejaUtilise(
  prisma: PrismaService,
  companyId: string,
  rib: string | null | undefined,
  exclureCompteSalarieId?: string
): Promise<AlerteApi | null> {
  if (rib === null || rib === undefined || rib.trim().length === 0) return null;

  const compteSociete = await prisma.compteBancaire.findFirst({
    where: { companyId, rib },
    select: { id: true },
  });
  if (compteSociete !== null) {
    return {
      code: CODES_REPONSE.RIB_DEJA_UTILISE.code,
      champ: 'rib',
      message: CODES_REPONSE.RIB_DEJA_UTILISE.message,
    };
  }

  const compteSalarie = await prisma.compteBancaireSalarie.findFirst({
    where: {
      rib,
      salarie: { companyId },
      ...(exclureCompteSalarieId !== undefined ? { id: { not: exclureCompteSalarieId } } : {}),
    },
    select: { id: true },
  });
  if (compteSalarie !== null) {
    return {
      code: CODES_REPONSE.RIB_DEJA_UTILISE.code,
      champ: 'rib',
      message: CODES_REPONSE.RIB_DEJA_UTILISE.message,
    };
  }

  return null;
}

export function collecterAlertePersonneDoublon(
  lignes: readonly {
    id?: string;
    nom: string;
    prenom: string;
    dateNaissance: Date;
  }[],
  candidat: { id?: string; nom: string; prenom: string; dateNaissance: Date }
): AlerteApi | null {
  const doublon = lignes.find(
    (ligne) =>
      ligne.id !== candidat.id &&
      ligne.nom.toLowerCase() === candidat.nom.toLowerCase() &&
      ligne.prenom.toLowerCase() === candidat.prenom.toLowerCase() &&
      ligne.dateNaissance.toISOString().slice(0, 10) ===
        candidat.dateNaissance.toISOString().slice(0, 10)
  );
  if (doublon === undefined) return null;
  return {
    code: CODES_REPONSE.PERSONNE_A_CHARGE_DOUBLON.code,
    message: CODES_REPONSE.PERSONNE_A_CHARGE_DOUBLON.message,
  };
}

export async function collecterAlerteEnfantAge(
  referentiel: ReferentielNationalPort,
  moisEnCours: string,
  dateNaissance: Date,
  situationHandicap: boolean
): Promise<AlerteApi | null> {
  if (situationHandicap) return null;

  const ageMax = await referentiel.lireValeur('AGE_MAX_ENFANT_CHARGE', moisEnCours);
  if (ageMax === null) return null;

  const [anneeMois] = moisEnCours.split('-');
  const anneeRef = Number(anneeMois);
  const anneeNaissance = dateNaissance.getUTCFullYear();
  const age = anneeRef - anneeNaissance;
  if (age > ageMax.toNumber()) {
    return {
      code: CODES_REPONSE.ENFANT_AGE_DEPASSE.code,
      message: CODES_REPONSE.ENFANT_AGE_DEPASSE.message,
    };
  }
  return null;
}

export function collecterAlertePretIncoherent(
  montantTotal: Decimal,
  mensualite: Decimal,
  nombreEcheances: number
): AlerteApi | null {
  const attendu = mensualite.mul(nombreEcheances);
  if (!attendu.equals(montantTotal)) {
    return {
      code: CODES_REPONSE.MENSUALITE_ECHEANCES_INCOHERENTE.code,
      message: CODES_REPONSE.MENSUALITE_ECHEANCES_INCOHERENTE.message,
    };
  }
  return null;
}

export function validerAlphabetiquePersonne(prenom: string, nom: string): void {
  assertAlphabetiqueSalarie(prenom, 'prenom');
  assertAlphabetiqueSalarie(nom, 'nom');
}

export function validerRibCompte(rib: string | null | undefined): void {
  if (rib !== null && rib !== undefined && rib.length > 0) {
    assertChiffres(rib, 'rib');
  }
}

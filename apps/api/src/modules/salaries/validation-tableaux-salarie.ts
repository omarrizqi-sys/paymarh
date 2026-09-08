import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import { estMoisAAAA_MM } from '../companies/coherence-fiche-societe.js';
import { avertissementsIdentifiants, assertChiffres } from '../companies/validation-fiche.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import { sommePartsVirement } from './deductions-tableaux.js';
import type { ReferentielNationalPort } from './referentiel-national/referentiel-national.port.js';
import { assertAlphabetiqueSalarie } from './validation-salarie.js';

export const CODE_TYPE_PENSION_ALIMENTAIRE = 'PENSION_ALIMENTAIRE' as const;
export const CODE_TYPE_TIERS_DETENTEUR = 'TIERS_DETENTEUR' as const;

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

export function assertPartVirement(comptes: readonly { partVirement?: string | null }[]): void {
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

function champEnvoye(dto: object, cle: string): boolean {
  return cle in dto && (dto as Record<string, unknown>)[cle] !== undefined;
}

function assertChampObligatoire(valeur: unknown, champ: string): void {
  if (valeur === null || valeur === undefined || valeur === '') {
    throw new ValidationBloquanteTableauError(
      CODES_REPONSE.CHAMP_OBLIGATOIRE.code,
      CODES_REPONSE.CHAMP_OBLIGATOIRE.message,
      champ
    );
  }
}

function assertChampInterdit(champ: string): never {
  throw new ValidationBloquanteTableauError(
    CODES_REPONSE.CHAMP_INTERDIT.code,
    CODES_REPONSE.CHAMP_INTERDIT.message,
    champ
  );
}

function assertMoisAAAA_MM(valeur: string, champ: string): void {
  if (!estMoisAAAA_MM(valeur)) {
    throw new ValidationBloquanteTableauError(
      CODES_REPONSE.MOIS_FORMAT_INVALIDE.code,
      CODES_REPONSE.MOIS_FORMAT_INVALIDE.message,
      champ
    );
  }
}

export interface EtatSaisieSurSalaire {
  readonly typeSaisieCode: string;
  readonly referenceDecision: string;
  readonly creancier: string;
  readonly libelleBulletin: string;
  readonly moisDebut: string;
  readonly montantTotal: string | null;
  readonly montantMensuel: string | null;
  readonly moisFin: string | null;
}

export function fusionnerEtatSaisieSurSalaire(
  dto: {
    typeSaisieCode?: string;
    referenceDecision?: string;
    creancier?: string;
    libelleBulletin?: string;
    moisDebut?: string;
    montantTotal?: string | null;
    montantMensuel?: string | null;
    moisFin?: string | null;
  },
  existant: {
    typeSaisieCode: string;
    referenceDecision: string;
    creancier: string;
    libelleBulletin: string;
    moisDebut: string;
    montantTotal: Decimal | null;
    montantMensuel: Decimal | null;
    moisFin: string | null;
  } | null
): EtatSaisieSurSalaire {
  const montantTotal =
    existant === null || champEnvoye(dto, 'montantTotal')
      ? (dto.montantTotal ?? null)
      : existant.montantTotal !== null
        ? existant.montantTotal.toString()
        : null;
  const montantMensuel =
    existant === null || champEnvoye(dto, 'montantMensuel')
      ? (dto.montantMensuel ?? null)
      : existant.montantMensuel !== null
        ? existant.montantMensuel.toString()
        : null;
  const moisFin =
    existant === null || champEnvoye(dto, 'moisFin') ? (dto.moisFin ?? null) : existant.moisFin;

  return {
    typeSaisieCode: dto.typeSaisieCode ?? existant?.typeSaisieCode ?? '',
    referenceDecision: dto.referenceDecision ?? existant?.referenceDecision ?? '',
    creancier: dto.creancier ?? existant?.creancier ?? '',
    libelleBulletin: dto.libelleBulletin ?? existant?.libelleBulletin ?? '',
    moisDebut: dto.moisDebut ?? existant?.moisDebut ?? '',
    montantTotal,
    montantMensuel,
    moisFin,
  };
}

export async function validerSaisieSurSalaire(
  prisma: PrismaService,
  dto: {
    typeSaisieCode?: string;
    referenceDecision?: string;
    creancier?: string;
    libelleBulletin?: string;
    moisDebut?: string;
    montantTotal?: string | null;
    montantMensuel?: string | null;
    moisFin?: string | null;
  },
  mode: 'creation' | 'modification',
  existant: Parameters<typeof fusionnerEtatSaisieSurSalaire>[1]
): Promise<EtatSaisieSurSalaire> {
  if (mode === 'creation') {
    assertChampObligatoire(dto.typeSaisieCode, 'typeSaisieCode');
    assertChampObligatoire(dto.referenceDecision, 'referenceDecision');
    assertChampObligatoire(dto.creancier, 'creancier');
    assertChampObligatoire(dto.libelleBulletin, 'libelleBulletin');
    assertChampObligatoire(dto.moisDebut, 'moisDebut');
  }

  const etat = fusionnerEtatSaisieSurSalaire(dto, existant);

  if (mode === 'modification' && dto.typeSaisieCode === undefined && existant === null) {
    assertChampObligatoire(undefined, 'typeSaisieCode');
  }

  assertChampObligatoire(etat.typeSaisieCode, 'typeSaisieCode');
  assertChampObligatoire(etat.referenceDecision, 'referenceDecision');
  assertChampObligatoire(etat.creancier, 'creancier');
  assertChampObligatoire(etat.libelleBulletin, 'libelleBulletin');
  assertChampObligatoire(etat.moisDebut, 'moisDebut');
  assertMoisAAAA_MM(etat.moisDebut, 'moisDebut');

  const typeConnu = await prisma.typeSaisieSurSalaire.findUnique({
    where: { code: etat.typeSaisieCode },
    select: { code: true },
  });
  if (typeConnu === null) {
    throw new ValidationBloquanteTableauError(
      CODES_REPONSE.VALEUR_INDISPONIBLE.code,
      CODES_REPONSE.VALEUR_INDISPONIBLE.message,
      'typeSaisieCode'
    );
  }

  if (etat.typeSaisieCode === CODE_TYPE_PENSION_ALIMENTAIRE) {
    if (champEnvoye(dto, 'montantTotal')) assertChampInterdit('montantTotal');
    if (champEnvoye(dto, 'moisFin') && etat.moisFin !== null && etat.moisFin !== '') {
      assertMoisAAAA_MM(etat.moisFin, 'moisFin');
    }
    assertChampObligatoire(etat.montantMensuel, 'montantMensuel');
  } else if (etat.typeSaisieCode === CODE_TYPE_TIERS_DETENTEUR) {
    if (champEnvoye(dto, 'montantMensuel')) assertChampInterdit('montantMensuel');
    if (champEnvoye(dto, 'moisFin')) assertChampInterdit('moisFin');
    assertChampObligatoire(etat.montantTotal, 'montantTotal');
  }

  return {
    ...etat,
    montantTotal: etat.typeSaisieCode === CODE_TYPE_PENSION_ALIMENTAIRE ? null : etat.montantTotal,
    montantMensuel: etat.typeSaisieCode === CODE_TYPE_TIERS_DETENTEUR ? null : etat.montantMensuel,
    moisFin: etat.typeSaisieCode === CODE_TYPE_TIERS_DETENTEUR ? null : etat.moisFin,
  };
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

/**
 * Rattache des alertes a la ligne qui les a produites, pour le seul cas du
 * remplacement global des comptes bancaires : le client envoie la liste
 * entiere, donc deux comptes mal saisis renverraient sinon deux alertes
 * identiques que l ecran ne saurait pas placer.
 *
 * L index est celui du TABLEAU ENVOYE PAR LE CLIENT, pas un identifiant en
 * base : au moment de la validation, un compte nouveau n en a pas encore.
 */
export function rattacherIndexLigne(
  alertes: readonly AlerteApi[],
  indexLigne: number
): AlerteApi[] {
  return alertes.map((alerte) => ({ ...alerte, indexLigne }));
}

export async function collecterAlerteBanqueIncoherente(
  prisma: PrismaService,
  banqueId: string | null | undefined,
  rib: string | null | undefined
): Promise<AlerteApi | null> {
  if (
    banqueId === null ||
    banqueId === undefined ||
    rib === null ||
    rib === undefined ||
    rib.length < 3
  ) {
    return null;
  }
  const codeRib = rib.slice(0, 3);
  const banque = await prisma.banque.findUnique({
    where: { id: banqueId },
    select: { codeBanque: true },
  });
  if (
    banque?.codeBanque !== null &&
    banque?.codeBanque !== undefined &&
    banque.codeBanque !== codeRib
  ) {
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
  const banque = await prisma.banque.findUnique({
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
      champ: 'mensualite',
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

/**
 * Allocation de matricules et numeros d ordre via compteurs persistants.
 * Les compteurs ne sont jamais decrements ; la suppression ne les affecte pas.
 * L increment est atomique en base (upsert + increment Prisma).
 */
import type { PrismaClient } from '../../generated/prisma/client.js';
import {
  deduireDernierNumeroMatricule,
  formaterMatriculeAuto,
  type ParametresMatricule,
} from './prochain-matricule.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

export interface DonneesSalarieCreation {
  companyId: string;
  nom: string;
  prenom: string;
  sexe: 'HOMME' | 'FEMME';
  dateNaissance: Date;
  dateEntree: Date;
  dateAnciennete: Date;
}

/**
 * Incremente atomiquement le compteur matricule et retourne le matricule formate suivant.
 * A la creation concurrente de la ligne, l upsert PostgreSQL evite les doublons de compteur.
 */
export async function incrementerCompteurMatricule(
  tx: TransactionClient,
  companyId: string,
  prefixe: string,
  longueur: number
): Promise<{ numero: number; matricule: string }> {
  const parametres: ParametresMatricule = { prefixe, longueur };
  const cle = { companyId_prefixe: { companyId, prefixe } };

  const existant = await tx.compteurMatricule.findUnique({ where: cle });

  if (existant) {
    const compteur = await tx.compteurMatricule.update({
      where: cle,
      data: { dernierNumero: { increment: 1 } },
    });
    return {
      numero: compteur.dernierNumero,
      matricule: formaterMatriculeAuto(parametres, compteur.dernierNumero),
    };
  }

  const matricules = await tx.salarie.findMany({
    where: { companyId },
    select: { matricule: true },
  });
  const initial = deduireDernierNumeroMatricule(
    parametres,
    matricules.map((ligne) => ligne.matricule)
  );

  const compteur = await tx.compteurMatricule.upsert({
    where: cle,
    create: { companyId, prefixe, dernierNumero: initial + 1 },
    update: { dernierNumero: { increment: 1 } },
  });

  return {
    numero: compteur.dernierNumero,
    matricule: formaterMatriculeAuto(parametres, compteur.dernierNumero),
  };
}

/**
 * Cree un salarie avec matricule auto-genere ; compteur et salarie dans la meme transaction.
 */
export async function creerSalarieMatriculeAuto(
  prisma: PrismaClient,
  parametres: ParametresMatricule,
  donnees: DonneesSalarieCreation
) {
  return prisma.$transaction(async (tx) => {
    const { matricule } = await incrementerCompteurMatricule(
      tx,
      donnees.companyId,
      parametres.prefixe,
      parametres.longueur
    );
    return tx.salarie.create({
      data: {
        ...donnees,
        matricule,
      },
    });
  });
}

/**
 * Incremente atomiquement le compteur numero d ordre d un salarie.
 */
export async function incrementerCompteurNumeroOrdre(
  tx: TransactionClient,
  salarieId: string
): Promise<number> {
  const existant = await tx.compteurNumeroOrdreEmploi.findUnique({
    where: { salarieId },
  });

  if (existant) {
    const compteur = await tx.compteurNumeroOrdreEmploi.update({
      where: { salarieId },
      data: { dernierNumero: { increment: 1 } },
    });
    return compteur.dernierNumero;
  }

  const emplois = await tx.emploi.findMany({
    where: { salarieId },
    select: { numeroOrdre: true },
  });
  const initial = emplois.reduce((max, emploi) => Math.max(max, emploi.numeroOrdre), 0);

  const compteur = await tx.compteurNumeroOrdreEmploi.upsert({
    where: { salarieId },
    create: { salarieId, dernierNumero: initial + 1 },
    update: { dernierNumero: { increment: 1 } },
  });

  return compteur.dernierNumero;
}

/**
 * Cree un emploi avec numero d ordre auto-alloue ; compteur et emploi dans la meme transaction.
 */
export async function creerEmploiNumeroOrdreAuto(
  prisma: PrismaClient,
  salarieId: string
) {
  return prisma.$transaction(async (tx) => {
    const numeroOrdre = await incrementerCompteurNumeroOrdre(tx, salarieId);
    return tx.emploi.create({
      data: { salarieId, numeroOrdre },
    });
  });
}

/**
 * Initialise un compteur matricule depuis les matricules deja presents (reprise de dossier).
 */
export async function initialiserCompteurMatriculeDepuisExistants(
  prisma: PrismaClient,
  companyId: string,
  parametres: ParametresMatricule
): Promise<number> {
  const matricules = await prisma.salarie.findMany({
    where: { companyId },
    select: { matricule: true },
  });
  const dernier = deduireDernierNumeroMatricule(
    parametres,
    matricules.map((ligne) => ligne.matricule)
  );
  await prisma.compteurMatricule.upsert({
    where: { companyId_prefixe: { companyId, prefixe: parametres.prefixe } },
    create: { companyId, prefixe: parametres.prefixe, dernierNumero: dernier },
    update: { dernierNumero: dernier },
  });
  return dernier;
}

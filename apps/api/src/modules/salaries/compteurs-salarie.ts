/**
 * Allocation de matricules et numeros d ordre via compteurs persistants.
 * Les compteurs ne sont jamais decrements ; la suppression ne les affecte pas.
 * L increment est atomique en base (upsert + increment Prisma).
 *
 * Une valeur de matricule attribuee est marquee consommee dans la meme
 * transaction que la creation. Elle n est jamais reattribuee dans la societe.
 */
import type { PrismaClient } from '../../generated/prisma/client.js';
import {
  calculerProchainMatricule,
  deduireDernierNumeroMatricule,
  formaterMatriculeAuto,
  type ParametresMatricule,
} from './prochain-matricule.js';

export type TransactionClient = Omit<
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
 * Marque une valeur de matricule comme consommee dans la societe.
 * Idempotent : une valeur deja marquee le reste.
 */
export async function marquerMatriculeConsomme(
  tx: TransactionClient,
  companyId: string,
  valeur: string
): Promise<void> {
  await tx.matriculeConsomme.upsert({
    where: { companyId_valeur: { companyId, valeur } },
    create: { companyId, valeur },
    update: {},
  });
}

/**
 * Liste les valeurs de matricule deja consommees dans la societe.
 */
export async function listerMatriculesConsommes(
  tx: Pick<TransactionClient, 'matriculeConsomme'>,
  companyId: string
): Promise<string[]> {
  const lignes = await tx.matriculeConsomme.findMany({
    where: { companyId },
    select: { valeur: true },
  });
  return lignes.map((ligne) => ligne.valeur);
}

async function avancerCompteurVers(
  tx: TransactionClient,
  cle: { companyId_prefixe: { companyId: string; prefixe: string } },
  actuel: number,
  numeroCalcule: number
): Promise<number> {
  if (actuel >= numeroCalcule) {
    return actuel;
  }
  const ajuste = await tx.compteurMatricule.update({
    where: cle,
    data: { dernierNumero: numeroCalcule },
  });
  return ajuste.dernierNumero;
}

/**
 * Incremente atomiquement le compteur matricule et retourne le matricule formate suivant.
 * Le prochain numero est calcule par calculerProchainMatricule a partir des valeurs consommees.
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

  const valeursConsommees = await listerMatriculesConsommes(tx, companyId);
  const prochainCalcule = calculerProchainMatricule(parametres, valeursConsommees);
  const numeroCalcule = deduireDernierNumeroMatricule(parametres, [prochainCalcule]);

  const existant = await tx.compteurMatricule.findUnique({ where: cle });

  if (existant) {
    const compteur = await tx.compteurMatricule.update({
      where: cle,
      data: { dernierNumero: { increment: 1 } },
    });
    const numero = await avancerCompteurVers(tx, cle, compteur.dernierNumero, numeroCalcule);
    return {
      numero,
      matricule: formaterMatriculeAuto(parametres, numero),
    };
  }

  const compteur = await tx.compteurMatricule.upsert({
    where: cle,
    create: { companyId, prefixe, dernierNumero: numeroCalcule },
    update: { dernierNumero: { increment: 1 } },
  });
  const numero = await avancerCompteurVers(tx, cle, compteur.dernierNumero, numeroCalcule);

  return {
    numero,
    matricule: formaterMatriculeAuto(parametres, numero),
  };
}

/**
 * Cree un salarie avec matricule auto-genere ; compteur, marquage et salarie dans la meme transaction.
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
    await marquerMatriculeConsomme(tx, donnees.companyId, matricule);
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
 * Initialise un compteur matricule depuis les valeurs deja consommees (reprise de dossier).
 * L historique d avant la reprise n existe pas : seules les valeurs presentes
 * dans la persistance sont prises en compte.
 */
export async function initialiserCompteurMatriculeDepuisExistants(
  prisma: PrismaClient,
  companyId: string,
  parametres: ParametresMatricule
): Promise<number> {
  const valeursConsommees = await listerMatriculesConsommes(prisma, companyId);
  const dernier = deduireDernierNumeroMatricule(parametres, valeursConsommees);
  await prisma.compteurMatricule.upsert({
    where: { companyId_prefixe: { companyId, prefixe: parametres.prefixe } },
    create: { companyId, prefixe: parametres.prefixe, dernierNumero: dernier },
    update: { dernierNumero: dernier },
  });
  return dernier;
}

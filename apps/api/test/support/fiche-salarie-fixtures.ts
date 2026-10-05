import { Decimal } from 'decimal.js';
import { TYPES_CONTRAT } from '../../prisma/reference-data-fiche-salarie.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';

export interface SocieteTest {
  companyId: string;
  accountId: string;
  etablissementPrincipalId: string;
  etablissementSecondaireId: string;
}

export async function creerSocieteTest(
  prisma: PrismaClient,
  formeJuridiqueId: string,
  accountId: string,
  suffixe: string,
  matriculePrefixe = 'EMP'
): Promise<SocieteTest> {
  const company = await prisma.company.create({
    data: {
      accountId,
      codeDossier: `CD-${suffixe}`,
      raisonSociale: `Societe ${suffixe}`,
      formeJuridiqueId,
      etatDossier: 'EN_PRODUCTION',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      moisEnCours: '2025-07',
      matriculePrefixe,
      matriculeLongueur: 5,
    },
  });

  const siege = await prisma.etablissement.create({
    data: {
      companyId: company.id,
      accountId,
      nom: `Siege ${suffixe}`,
      estPrincipal: true,
      adresse: '1 rue Test',
      ville: 'Casablanca',
    },
  });

  const secondaire = await prisma.etablissement.create({
    data: {
      companyId: company.id,
      accountId,
      nom: `Atelier ${suffixe}`,
      estPrincipal: false,
      adresse: '2 rue Test',
      ville: 'Rabat',
    },
  });

  return {
    companyId: company.id,
    accountId,
    etablissementPrincipalId: siege.id,
    etablissementSecondaireId: secondaire.id,
  };
}

export interface DonneesSalarieMin {
  matricule: string;
  nom?: string;
  prenom?: string;
  dateNaissance?: Date | null;
  numeroPiece?: string | null;
  numeroCnss?: string | null;
  codePostal?: string | null;
}

export async function creerSalarieMin(
  prisma: PrismaClient,
  companyId: string,
  donnees: DonneesSalarieMin
) {
  return prisma.$transaction(async (tx) => {
    await tx.matriculeConsomme.upsert({
      where: { companyId_valeur: { companyId, valeur: donnees.matricule } },
      create: { companyId, valeur: donnees.matricule },
      update: {},
    });
    return tx.salarie.create({
      data: {
        companyId,
        matricule: donnees.matricule,
        nom: donnees.nom ?? 'Alami',
        prenom: donnees.prenom ?? 'Said',
        sexe: 'HOMME',
        dateNaissance:
          donnees.dateNaissance !== undefined ? donnees.dateNaissance : new Date('1990-05-15'),
        numeroPiece: donnees.numeroPiece ?? null,
        numeroCnss: donnees.numeroCnss ?? null,
        codePostal: donnees.codePostal ?? null,
        dateEntree: new Date('2025-01-01'),
        dateAnciennete: new Date('2025-01-01'),
      },
    });
  });
}

/** Charge les types de contrat du referentiel (cle etrangere), au cas ou la base n a pas ete re-semee. */
export async function assurerTypesContrat(prisma: PrismaClient): Promise<void> {
  for (const type of TYPES_CONTRAT) {
    await prisma.typeContrat.upsert({
      where: { code: type.code },
      update: { ordre: type.ordre, libelle: type.libelle },
      create: { ordre: type.ordre, code: type.code, libelle: type.libelle },
    });
  }
}

export async function creerEmploiOuvert(
  prisma: PrismaClient,
  salarieId: string,
  etablissementId: string,
  numeroOrdre: number,
  moisEffet = '2025-01',
  dateDebut = new Date('2025-01-01')
) {
  return creerEmploiAvecTypeContrat(prisma, salarieId, etablissementId, numeroOrdre, 'CDI', {
    moisEffet,
    dateDebut,
  });
}

/** Emploi en contrat d insertion : seul type sur lequel IDMAJ peut etre saisi. */
export async function creerEmploiInsertion(
  prisma: PrismaClient,
  salarieId: string,
  etablissementId: string,
  numeroOrdre: number,
  moisEffet = '2025-01',
  dateDebut = new Date('2025-01-01')
) {
  await assurerTypesContrat(prisma);
  return creerEmploiAvecTypeContrat(prisma, salarieId, etablissementId, numeroOrdre, 'INSERTION', {
    moisEffet,
    dateDebut,
  });
}

export async function creerEmploiAvecTypeContrat(
  prisma: PrismaClient,
  salarieId: string,
  etablissementId: string,
  numeroOrdre: number,
  typeContratCode: string,
  options: { moisEffet?: string; dateDebut?: Date; dateSortie?: Date | null } = {}
) {
  const moisEffet = options.moisEffet ?? '2025-01';
  const dateDebut = options.dateDebut ?? new Date('2025-01-01');
  const emploi = await prisma.emploi.create({
    data: { salarieId, numeroOrdre },
  });

  await prisma.emploiContratVersion.create({
    data: {
      emploiId: emploi.id,
      moisEffet,
      libellePoste: 'Comptable',
      dateDebut,
      dateSortie: options.dateSortie ?? null,
      typeContratCode,
    },
  });

  await prisma.emploiRemunerationVersion.create({
    data: {
      emploiId: emploi.id,
      moisEffet,
      modeDeterminationSalaire: 'BRUT_MENSUEL',
      montant: new Decimal('12000.50'),
    },
  });

  await prisma.emploiAffectationVersion.create({
    data: {
      emploiId: emploi.id,
      moisEffet,
      etablissementId,
      baseSaisieDuree: 'HEBDOMADAIRE',
      dureeContractuelle: null,
      teletravailAutorise: null,
    },
  });

  return emploi;
}

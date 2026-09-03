import { Decimal } from 'decimal.js';
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
  dateNaissance?: Date;
  numeroPiece?: string | null;
  numeroCnss?: string | null;
  codePostal?: string | null;
}

export async function creerSalarieMin(
  prisma: PrismaClient,
  companyId: string,
  donnees: DonneesSalarieMin
) {
  return prisma.salarie.create({
    data: {
      companyId,
      matricule: donnees.matricule,
      nom: donnees.nom ?? 'Alami',
      prenom: donnees.prenom ?? 'Said',
      sexe: 'HOMME',
      dateNaissance: donnees.dateNaissance ?? new Date('1990-05-15'),
      numeroPiece: donnees.numeroPiece ?? null,
      numeroCnss: donnees.numeroCnss ?? null,
      codePostal: donnees.codePostal ?? null,
      dateEntree: new Date('2025-01-01'),
      dateAnciennete: new Date('2025-01-01'),
    },
  });
}

export async function creerEmploiOuvert(
  prisma: PrismaClient,
  salarieId: string,
  etablissementId: string,
  numeroOrdre: number,
  moisEffet = '2025-01',
  dateDebut = new Date('2025-01-01')
) {
  const emploi = await prisma.emploi.create({
    data: { salarieId, numeroOrdre },
  });

  await prisma.emploiContratVersion.create({
    data: {
      emploiId: emploi.id,
      moisEffet,
      libellePoste: 'Comptable',
      dateDebut,
      typeContratCode: 'CDI',
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

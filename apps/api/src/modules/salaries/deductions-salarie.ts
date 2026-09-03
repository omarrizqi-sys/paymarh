import type { PrismaClient } from '../../generated/prisma/client.js';

export type EtatSalarie = 'ACTIF' | 'INACTIF';

/** Emploi ouvert : pas de date de sortie ou sortie future ou egale a aujourd hui. */
export function emploiEstOuvert(dateSortie: Date | null, reference = new Date()): boolean {
  if (dateSortie === null) return true;
  const ref = new Date(reference);
  ref.setUTCHours(0, 0, 0, 0);
  const sortie = new Date(dateSortie);
  sortie.setUTCHours(0, 0, 0, 0);
  return sortie >= ref;
}

export async function deduireEtatSalarie(
  prisma: PrismaClient,
  salarieId: string
): Promise<EtatSalarie> {
  const emplois = await prisma.emploi.findMany({
    where: { salarieId },
    select: {
      contratVersions: {
        orderBy: { moisEffet: 'desc' },
        take: 1,
        select: { dateSortie: true },
      },
    },
  });

  for (const emploi of emplois) {
    const version = emploi.contratVersions[0];
    if (version !== undefined && emploiEstOuvert(version.dateSortie)) {
      return 'ACTIF';
    }
  }

  return 'INACTIF';
}

export function deduireTypePieceIdentite(codeNationalite: string | null | undefined): string | null {
  if (codeNationalite === null || codeNationalite === undefined) return null;
  return codeNationalite === 'MA' ? 'CIN' : 'carte de séjour';
}

export function deduireLibelleSituationFamiliale(
  sexe: 'HOMME' | 'FEMME',
  libelleMasculin: string,
  libelleFeminin: string
): string {
  return sexe === 'FEMME' ? libelleFeminin : libelleMasculin;
}

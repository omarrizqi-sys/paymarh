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

export interface EmploiPourDeductionListe {
  readonly dateSortie: Date | null;
  readonly libellePoste: string;
  readonly etablissementNom: string | null;
}

export interface LigneListeSalarieDeduite {
  readonly etat: EtatSalarie;
  readonly poste: string | null;
  readonly etablissement: string | null;
}

/** Regle unique de deduction pour la liste — etat, poste et etablissement. */
export function deduireLigneListeSalarie(
  emplois: readonly EmploiPourDeductionListe[]
): LigneListeSalarieDeduite {
  const ouverts = emplois.filter((emploi) => emploiEstOuvert(emploi.dateSortie));

  if (ouverts.length === 1) {
    const emploi = ouverts[0];
    if (emploi === undefined) {
      return { etat: 'INACTIF', poste: null, etablissement: null };
    }
    return {
      etat: 'ACTIF',
      poste: emploi.libellePoste,
      etablissement: emploi.etablissementNom,
    };
  }

  if (ouverts.length > 1) {
    return {
      etat: 'ACTIF',
      poste: `${ouverts.length} emplois`,
      etablissement: null,
    };
  }

  if (emplois.length === 0) {
    return { etat: 'INACTIF', poste: null, etablissement: null };
  }

  const clos = emplois.filter((emploi) => !emploiEstOuvert(emploi.dateSortie));
  const dernierClos = clos.reduce((courant, candidat) => {
    if (courant.dateSortie === null) return candidat;
    if (candidat.dateSortie === null) return courant;
    return candidat.dateSortie >= courant.dateSortie ? candidat : courant;
  });

  return {
    etat: 'INACTIF',
    poste: dernierClos.libellePoste,
    etablissement: dernierClos.etablissementNom,
  };
}

function formaterEmploiPourDeduction(emploi: {
  contratVersions: { dateSortie: Date | null; libellePoste: string }[];
  affectationVersions: { etablissement: { nom: string } | null }[];
}): EmploiPourDeductionListe | null {
  const contrat = emploi.contratVersions[0];
  if (contrat === undefined) return null;

  const affectation = emploi.affectationVersions[0];

  return {
    dateSortie: contrat.dateSortie,
    libellePoste: contrat.libellePoste,
    etablissementNom: affectation?.etablissement?.nom ?? null,
  };
}

/** Deduction groupée : une requête emploi pour tous les identifiants. */
export async function deduireLignesListeSalaries(
  prisma: PrismaClient,
  salarieIds: readonly string[]
): Promise<Map<string, LigneListeSalarieDeduite>> {
  const resultat = new Map<string, LigneListeSalarieDeduite>();
  if (salarieIds.length === 0) return resultat;

  for (const salarieId of salarieIds) {
    resultat.set(salarieId, { etat: 'INACTIF', poste: null, etablissement: null });
  }

  const emplois = await prisma.emploi.findMany({
    where: { salarieId: { in: [...salarieIds] } },
    select: {
      salarieId: true,
      contratVersions: {
        orderBy: { moisEffet: 'desc' },
        take: 1,
        select: { dateSortie: true, libellePoste: true },
      },
      affectationVersions: {
        orderBy: { moisEffet: 'desc' },
        take: 1,
        select: {
          etablissement: { select: { nom: true } },
        },
      },
    },
  });

  const parSalarie = new Map<string, EmploiPourDeductionListe[]>();
  for (const salarieId of salarieIds) {
    parSalarie.set(salarieId, []);
  }

  for (const emploi of emplois) {
    const formate = formaterEmploiPourDeduction(emploi);
    if (formate === null) continue;
    parSalarie.get(emploi.salarieId)?.push(formate);
  }

  for (const salarieId of salarieIds) {
    resultat.set(salarieId, deduireLigneListeSalarie(parSalarie.get(salarieId) ?? []));
  }

  return resultat;
}

export async function deduireEtatSalarie(
  prisma: PrismaClient,
  salarieId: string
): Promise<EtatSalarie> {
  const lignes = await deduireLignesListeSalaries(prisma, [salarieId]);
  return lignes.get(salarieId)?.etat ?? 'INACTIF';
}

export function deduireTypePieceIdentite(
  codeNationalite: string | null | undefined
): string | null {
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

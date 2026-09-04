import type { PrismaClient } from '../../generated/prisma/client.js';

export type EtatSalarie = 'ACTIF' | 'INACTIF';

export interface EtablissementListe {
  readonly id: string;
  readonly libelle: string;
}

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
  readonly etablissement: EtablissementListe | null;
}

export interface LigneListeSalarieDeduite {
  readonly etat: EtatSalarie;
  readonly poste: string | null;
  readonly nombreEmploisOuverts: number;
  readonly etablissement: EtablissementListe | null;
  /**
   * Sortie DU SALARIE, tous emplois confondus : la plus recente des dates de
   * sortie une fois tous ses emplois clos, null tant qu il en reste un ouvert
   * et null quand il n a aucun emploi.
   *
   * Deduite ici, et nulle part ailleurs, pour qu elle repose sur le meme
   * predicat « emploi ouvert » que l etat : deux implementations divergeraient
   * un jour, et un salarie apparaitrait ACTIF avec une date de sortie.
   */
  readonly dateSortie: Date | null;
}

/** Regle unique de deduction pour la liste — etat, poste, nombre d emplois ouverts, etablissement. */
export function deduireLigneListeSalarie(
  emplois: readonly EmploiPourDeductionListe[]
): LigneListeSalarieDeduite {
  const ouverts = emplois.filter((emploi) => emploiEstOuvert(emploi.dateSortie));

  if (ouverts.length === 1) {
    const emploi = ouverts[0];
    if (emploi === undefined) {
      return {
        etat: 'INACTIF',
        poste: null,
        nombreEmploisOuverts: 0,
        etablissement: null,
        dateSortie: null,
      };
    }
    return {
      etat: 'ACTIF',
      poste: emploi.libellePoste,
      nombreEmploisOuverts: 1,
      etablissement: emploi.etablissement,
      dateSortie: null,
    };
  }

  if (ouverts.length > 1) {
    return {
      etat: 'ACTIF',
      poste: null,
      nombreEmploisOuverts: ouverts.length,
      etablissement: null,
      dateSortie: null,
    };
  }

  if (emplois.length === 0) {
    return {
      etat: 'INACTIF',
      poste: null,
      nombreEmploisOuverts: 0,
      etablissement: null,
      dateSortie: null,
    };
  }

  const clos = emplois.filter((emploi) => !emploiEstOuvert(emploi.dateSortie));
  // Gardes dateSortie === null inatteignables ici : sans date de sortie, emploiEstOuvert
  // renvoie true, donc l emploi est ouvert et absent de clos. Conservees telles quelles
  // (heritage du reduce du poste).
  const dernierClos = clos.reduce((courant, candidat) => {
    if (courant.dateSortie === null) return candidat;
    if (candidat.dateSortie === null) return courant;
    return candidat.dateSortie >= courant.dateSortie ? candidat : courant;
  });

  return {
    etat: 'INACTIF',
    poste: dernierClos.libellePoste,
    nombreEmploisOuverts: 0,
    etablissement: dernierClos.etablissement,
    dateSortie: dernierClos.dateSortie,
  };
}

function formaterEmploiPourDeduction(emploi: {
  contratVersions: { dateSortie: Date | null; libellePoste: string }[];
  affectationVersions: { etablissement: { id: string; nom: string } | null }[];
}): EmploiPourDeductionListe | null {
  const contrat = emploi.contratVersions[0];
  if (contrat === undefined) return null;

  const affectation = emploi.affectationVersions[0];
  const etablissement =
    affectation?.etablissement !== null && affectation?.etablissement !== undefined
      ? { id: affectation.etablissement.id, libelle: affectation.etablissement.nom }
      : null;

  return {
    dateSortie: contrat.dateSortie,
    libellePoste: contrat.libellePoste,
    etablissement,
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
    resultat.set(salarieId, {
      etat: 'INACTIF',
      poste: null,
      nombreEmploisOuverts: 0,
      etablissement: null,
      dateSortie: null,
    });
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
          etablissement: { select: { id: true, nom: true } },
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

/**
 * Deduction complete pour un salarie — une seule requete, celle qui sert deja
 * a l etat. La fiche y prend son etat ET sa date de sortie : les deux sortent
 * du meme jeu d emplois et du meme predicat, donc ne peuvent pas se
 * contredire.
 */
export async function deduireLigneSalarie(
  prisma: PrismaClient,
  salarieId: string
): Promise<LigneListeSalarieDeduite> {
  const lignes = await deduireLignesListeSalaries(prisma, [salarieId]);
  return (
    lignes.get(salarieId) ?? {
      etat: 'INACTIF',
      poste: null,
      nombreEmploisOuverts: 0,
      etablissement: null,
      dateSortie: null,
    }
  );
}

export async function deduireEtatSalarie(
  prisma: PrismaClient,
  salarieId: string
): Promise<EtatSalarie> {
  return (await deduireLigneSalarie(prisma, salarieId)).etat;
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

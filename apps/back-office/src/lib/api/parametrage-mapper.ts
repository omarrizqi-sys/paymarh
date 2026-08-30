import type { ParametrageEtablissement, ParametrageSociete } from '@paymarh/shared-types';

/** Normalise une ligne de parametrage etablissement renvoyee par l API (Decimal → string). */
export function normaliserParametrageEtablissement(
  brut: Record<string, unknown> | null
): ParametrageEtablissement | null {
  if (!brut) return null;

  const duree = brut.dureeHebdomadaire;
  const montant = brut.montantIndemniteTeletravail;

  return {
    id: typeof brut.id === 'string' ? brut.id : undefined,
    moisEffet: typeof brut.moisEffet === 'string' ? brut.moisEffet : undefined,
    dureeHebdomadaire: duree != null ? String(duree) : '44',
    jourReposHebdomadaire:
      (brut.jourReposHebdomadaire as ParametrageEtablissement['jourReposHebdomadaire']) ?? 'DIMANCHE',
    teletravailAutorise:
      typeof brut.teletravailAutorise === 'boolean' ? brut.teletravailAutorise : null,
    indemniteTeletravailVersee:
      typeof brut.indemniteTeletravailVersee === 'boolean' ? brut.indemniteTeletravailVersee : null,
    montantIndemniteTeletravail: montant != null ? String(montant) : null,
    horaireDefautLignes: (
      (brut.horaireDefautLignes as Record<string, unknown>[] | undefined) ?? []
    ).map((l) => ({
      id: typeof l.id === 'string' ? l.id : undefined,
      jourSemaine: l.jourSemaine as ParametrageEtablissement['horaireDefautLignes'][number]['jourSemaine'],
      typeHeureId: String(l.typeHeureId),
      nombreHeures: String(l.nombreHeures),
    })),
    horaireMensuelLignes: (
      (brut.horaireMensuelLignes as Record<string, unknown>[] | undefined) ?? []
    ).map((l) => ({
      id: typeof l.id === 'string' ? l.id : undefined,
      typeHeureId: String(l.typeHeureId),
      nombreHeures: String(l.nombreHeures),
    })),
    joursFeriesTravailles: (
      (brut.joursFeriesTravailles as Record<string, unknown>[] | undefined) ?? []
    ).map((j) => ({ jourFerieId: String(j.jourFerieId) })),
  };
}

export function normaliserParametrageSociete(
  brut: Record<string, unknown> | null
): ParametrageSociete | null {
  if (!brut) return null;
  return {
    id: typeof brut.id === 'string' ? brut.id : undefined,
    moisEffet: typeof brut.moisEffet === 'string' ? brut.moisEffet : undefined,
    moisClotureConges: typeof brut.moisClotureConges === 'number' ? brut.moisClotureConges : 12,
    typeExonerationId: typeof brut.typeExonerationId === 'string' ? brut.typeExonerationId : null,
    exonerationDateDebut:
      typeof brut.exonerationDateDebut === 'string' ? brut.exonerationDateDebut : null,
    exonerationDateFin: typeof brut.exonerationDateFin === 'string' ? brut.exonerationDateFin : null,
  };
}

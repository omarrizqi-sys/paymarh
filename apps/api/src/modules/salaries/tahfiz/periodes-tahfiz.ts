import { CODE_TYPE_CONTRAT_CDI } from '../codes-type-contrat.js';

/**
 * Calcul des lignes TAHFIZ d un emploi (ADR 0033). Fonction pure, sans Prisma
 * ni Nest : le seed l importe directement, la propagation l utilise en
 * transaction. Aucune autre ecriture de date TAHFIZ ne doit exister.
 */

export interface VersionContratPourTahfiz {
  readonly moisEffet: string;
  readonly typeContratCode: string;
  readonly dateDebut: Date;
  readonly dateSortie: Date | null;
}

/** Periode TAHFIZ de la societe, en mois AAAA-MM ; fin absente = sans fin. */
export interface PeriodeTahfizSociete {
  readonly moisDebut: string;
  readonly moisFin: string | null;
}

export interface LigneTahfizCalculee {
  readonly dateDebut: Date;
  readonly dateFin: Date | null;
}

const UN_JOUR_MS = 24 * 60 * 60 * 1000;

function premierJourDuMois(mois: string): Date {
  return new Date(`${mois}-01T00:00:00.000Z`);
}

function dernierJourDuMois(mois: string): Date {
  const [anneeStr, moisStr] = mois.split('-');
  return new Date(Date.UTC(Number(anneeStr), Number(moisStr), 0));
}

function veille(date: Date): Date {
  return new Date(date.getTime() - UN_JOUR_MS);
}

function plusTardive(dates: readonly (Date | null)[]): Date | null {
  let retenue: Date | null = null;
  for (const date of dates) {
    if (date !== null && (retenue === null || date.getTime() > retenue.getTime())) retenue = date;
  }
  return retenue;
}

function plusPrecoce(dates: readonly (Date | null)[]): Date | null {
  let retenue: Date | null = null;
  for (const date of dates) {
    if (date !== null && (retenue === null || date.getTime() < retenue.getTime())) retenue = date;
  }
  return retenue;
}

/**
 * Une ligne par periode continue en CDI qui croise la periode TAHFIZ.
 *
 * Debut : la plus tardive de (1er jour du mois d activation, debut de l emploi,
 * 1er jour du mois d effet de la version ou le type devient CDI).
 * Fin : la plus precoce de (dernier jour du mois de fin TAHFIZ, sortie de
 * l emploi, veille du mois d effet de la version ou le type cesse d etre CDI).
 *
 * Le debut et la sortie de l emploi sont lus sur la version de plus grand mois
 * d effet. La premiere version ne « devient » pas CDI : seul le debut de
 * l emploi borne alors la ligne.
 */
export function calculerLignesTahfiz(
  versions: readonly VersionContratPourTahfiz[],
  periode: PeriodeTahfizSociete | null
): LigneTahfizCalculee[] {
  if (periode === null) return [];

  const triees = [...versions].sort((a, b) => a.moisEffet.localeCompare(b.moisEffet));
  const derniere = triees.at(-1);
  if (derniere === undefined) return [];

  const debutSociete = premierJourDuMois(periode.moisDebut);
  const finSociete =
    periode.moisFin !== null && periode.moisFin.length > 0
      ? dernierJourDuMois(periode.moisFin)
      : null;

  const lignes: LigneTahfizCalculee[] = [];
  for (let i = 0; i < triees.length; i += 1) {
    const version = triees[i];
    const precedente = triees[i - 1];
    if (version === undefined || version.typeContratCode !== CODE_TYPE_CONTRAT_CDI) continue;
    if (precedente !== undefined && precedente.typeContratCode === CODE_TYPE_CONTRAT_CDI) continue;

    let fin = i;
    while (triees[fin + 1]?.typeContratCode === CODE_TYPE_CONTRAT_CDI) fin += 1;
    const suivante = triees[fin + 1];

    const devientCdi = precedente !== undefined ? premierJourDuMois(version.moisEffet) : null;
    const cesseCdi = suivante !== undefined ? veille(premierJourDuMois(suivante.moisEffet)) : null;

    const dateDebut = plusTardive([debutSociete, derniere.dateDebut, devientCdi]) ?? debutSociete;
    const dateFin = plusPrecoce([finSociete, derniere.dateSortie, cesseCdi]);
    if (dateFin !== null && dateFin.getTime() < dateDebut.getTime()) continue;

    lignes.push({ dateDebut, dateFin });
  }
  return lignes;
}

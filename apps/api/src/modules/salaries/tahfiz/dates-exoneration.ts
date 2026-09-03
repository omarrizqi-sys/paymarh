import { moisDepuisDate } from '../mois-en-cours/mois-en-cours.service.js';

export function dateDebutDepuisMois(mois: string): Date {
  return new Date(`${mois}-01T00:00:00.000Z`);
}

/** Dernier jour civil du mois (UTC), ou null si le mois de fin est absent. */
export function dateFinDepuisMois(mois: string | null | undefined): Date | null {
  if (mois === null || mois === undefined || mois.length === 0) {
    return null;
  }
  const [anneeStr, moisStr] = mois.split('-');
  const annee = Number(anneeStr);
  const numMois = Number(moisStr);
  return new Date(Date.UTC(annee, numMois, 0));
}

export function ligneStatutVersMois(ligne: { dateDebut: Date; dateFin: Date | null }): {
  moisEffetDebut: string;
  moisEffetFin: string | null;
} {
  return {
    moisEffetDebut: moisDepuisDate(ligne.dateDebut),
    moisEffetFin: ligne.dateFin !== null ? moisDepuisDate(ligne.dateFin) : null,
  };
}

/**
 * Une ligne propagee suit les nouvelles dates de l exoneration, sans jamais se
 * retracter en deca d un bulletin deja produit : le debut ne peut pas devenir
 * posterieur au premier mois couvert, la fin ne peut pas devenir anterieure au
 * dernier.
 */
export function ajusterDatesLignePropagee(params: {
  readonly dateDebutDesiree: Date;
  readonly dateFinDesiree: Date | null;
  readonly moisPremierBulletin: string | undefined;
  readonly moisDernierBulletin: string | undefined;
}): { dateDebut: Date; dateFin: Date | null } {
  let dateDebut = params.dateDebutDesiree;
  if (
    params.moisPremierBulletin !== undefined &&
    moisDepuisDate(params.dateDebutDesiree) > params.moisPremierBulletin
  ) {
    dateDebut = dateDebutDepuisMois(params.moisPremierBulletin);
  }

  let dateFin = params.dateFinDesiree;
  if (
    params.dateFinDesiree !== null &&
    params.moisDernierBulletin !== undefined &&
    moisDepuisDate(params.dateFinDesiree) < params.moisDernierBulletin
  ) {
    dateFin = dateFinDepuisMois(params.moisDernierBulletin);
  }

  return { dateDebut, dateFin };
}

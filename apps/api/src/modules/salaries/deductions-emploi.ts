import { Decimal } from 'decimal.js';
import { COEFFICIENT_HEBDO_VERS_MENSUEL } from '../companies/heures-mensuelles.js';

/** Conversion hebdomadaire → mensuelle en decimal exact (A9, R7, P4). */
export function convertirDureeAutreBase(
  duree: Decimal,
  baseSaisie: 'HEBDOMADAIRE' | 'MENSUELLE'
): Decimal {
  if (baseSaisie === 'MENSUELLE') {
    return duree;
  }
  return duree.times(COEFFICIENT_HEBDO_VERS_MENSUEL);
}

/** Nombre de jours civils entre deux dates (fin incluse si > debut). */
export function dureePeriodeEssaiEnJours(dateDebut: Date, dateFinEssai: Date): number {
  const debut = new Date(dateDebut);
  debut.setUTCHours(0, 0, 0, 0);
  const fin = new Date(dateFinEssai);
  fin.setUTCHours(0, 0, 0, 0);
  const diffMs = fin.getTime() - debut.getTime();
  return diffMs / 86_400_000;
}

export function formaterDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function versDate(valeur: string): Date {
  return new Date(valeur);
}

export function comparerDates(a: Date, b: Date): number {
  const da = new Date(a);
  da.setUTCHours(0, 0, 0, 0);
  const db = new Date(b);
  db.setUTCHours(0, 0, 0, 0);
  return da.getTime() - db.getTime();
}

export function dateDansIntervalle(date: Date, debut: Date, fin: Date | null): boolean {
  if (comparerDates(date, debut) < 0) return false;
  if (fin === null) return true;
  return comparerDates(date, fin) <= 0;
}

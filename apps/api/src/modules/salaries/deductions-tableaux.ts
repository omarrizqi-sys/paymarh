import { Decimal } from 'decimal.js';
import { EtatBulletin, type MoisBulletin } from './bulletin/bulletin.port.js';
import { ligneLisiblePourMois, type LigneTemporelle } from './historisation-temporelle.js';
import { moisSuivant } from './mois-en-cours/mois-en-cours.service.js';

export type EtatLigneTableau = 'ACTIVE' | 'INACTIVE';

export function deduireEtatLigne(ligne: LigneTemporelle, moisEnCours: string): EtatLigneTableau {
  if (ligne.moisEffetDebut > moisEnCours) {
    return 'INACTIVE';
  }
  if (ligne.moisEffetFin !== null && ligne.moisEffetFin <= moisEnCours) {
    return 'INACTIVE';
  }
  return 'ACTIVE';
}

export function compterPersonnesACharge(
  lignes: readonly { aCharge: boolean; moisEffetDebut: string; moisEffetFin: string | null }[],
  moisEnCours: string
): number {
  return lignes.filter(
    (ligne) => ligne.aCharge && ligneLisiblePourMois(ligne, moisEnCours)
  ).length;
}

function compterEcheancesPrelevees(
  pret: { moisDebut: string; nombreEcheances: number },
  bulletins: readonly MoisBulletin[]
): number {
  const moisPreleves = bulletins.filter(
    (b) => b.etat >= EtatBulletin.CALCULE && b.mois >= pret.moisDebut
  );
  moisPreleves.sort((a, b) => a.mois.localeCompare(b.mois));

  let compteur = 0;
  let moisAttendu = pret.moisDebut;
  for (const bulletin of moisPreleves) {
    if (compteur >= pret.nombreEcheances) break;
    if (bulletin.mois === moisAttendu) {
      compteur += 1;
      moisAttendu = moisSuivant(moisAttendu);
    }
  }
  return compteur;
}

export function deduireSoldeRestantPret(
  pret: {
    montantTotal: Decimal;
    mensualite: Decimal;
    nombreEcheances: number;
    moisDebut: string;
  },
  bulletins: readonly MoisBulletin[]
): string {
  const prelevees = compterEcheancesPrelevees(pret, bulletins);
  const preleve = pret.mensualite.mul(Math.min(prelevees, pret.nombreEcheances));
  const solde = Decimal.max(pret.montantTotal.minus(preleve), 0);
  return solde.toFixed(2);
}

export function ligneUtiliseeParBulletin(
  bulletins: readonly MoisBulletin[],
  ligne: LigneTemporelle
): boolean {
  return bulletins.some((bulletin) => {
    if (bulletin.etat < EtatBulletin.CALCULE) return false;
    if (bulletin.mois < ligne.moisEffetDebut) return false;
    if (ligne.moisEffetFin !== null && bulletin.mois > ligne.moisEffetFin) return false;
    return true;
  });
}

export function sommePartsVirement(parts: readonly Decimal[]): Decimal {
  return parts.reduce((acc, part) => acc.plus(part), new Decimal(0));
}

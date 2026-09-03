import type { Decimal } from 'decimal.js';
import type { MoisBulletin } from '../bulletin/bulletin.port.js';
import {
  compterPersonnesACharge,
  deduireEtatLigne,
  deduireSoldeRestantPret,
} from '../deductions-tableaux.js';
import { moisDepuisDate } from '../mois-en-cours/mois-en-cours.service.js';

function formaterDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface PersonneAChargeRow {
  id: string;
  lienParenteCode: string;
  prenom: string;
  nom: string;
  sexe: 'HOMME' | 'FEMME';
  dateNaissance: Date;
  aCharge: boolean;
  situationHandicap: boolean;
  moisEffetDebut: string;
  moisEffetFin: string | null;
  createdAt: Date;
}

export function trierPersonnesACharge<T extends { dateNaissance: Date | string }>(
  lignes: readonly T[]
): T[] {
  return [...lignes].sort((a, b) => {
    const da = typeof a.dateNaissance === 'string' ? a.dateNaissance : formaterDate(a.dateNaissance);
    const db = typeof b.dateNaissance === 'string' ? b.dateNaissance : formaterDate(b.dateNaissance);
    return da.localeCompare(db);
  });
}

export function trierParMoisDebut<T extends { moisDebut: string; createdAt: Date }>(
  lignes: readonly T[]
): T[] {
  return [...lignes].sort((a, b) => {
    const cmp = a.moisDebut.localeCompare(b.moisDebut);
    if (cmp !== 0) return cmp;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export function trierParDateDebut<T extends { dateDebut: Date; createdAt: Date }>(
  lignes: readonly T[]
): T[] {
  return [...lignes].sort((a, b) => {
    const cmp = formaterDate(a.dateDebut).localeCompare(formaterDate(b.dateDebut));
    if (cmp !== 0) return cmp;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export function trierParOrdreSaisie<T extends { createdAt: Date }>(lignes: readonly T[]): T[] {
  return [...lignes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function versPersonneACharge(ligne: PersonneAChargeRow, moisEnCours: string) {
  const base = {
    id: ligne.id,
    lienParenteCode: ligne.lienParenteCode,
    prenom: ligne.prenom,
    nom: ligne.nom,
    sexe: ligne.sexe,
    dateNaissance: formaterDate(ligne.dateNaissance),
    aCharge: ligne.aCharge,
    moisEffetDebut: ligne.moisEffetDebut,
    moisEffetFin: ligne.moisEffetFin,
    etat: deduireEtatLigne(ligne, moisEnCours),
  };

  if (ligne.lienParenteCode === 'ENFANT') {
    return { ...base, situationHandicap: ligne.situationHandicap };
  }

  return base;
}

export function versCompteBancaireSalarie(compte: {
  id: string;
  banqueId: string | null;
  banqueLibreSaisie: string | null;
  rib: string | null;
  iban: string | null;
  bic: string | null;
  titulaire: string | null;
  partVirement: Decimal | null;
}) {
  return {
    id: compte.id,
    banqueId: compte.banqueId,
    banqueLibreSaisie: compte.banqueLibreSaisie,
    rib: compte.rib,
    iban: compte.iban,
    bic: compte.bic,
    titulaire: compte.titulaire,
    partVirement: compte.partVirement !== null ? compte.partVirement.toString() : null,
  };
}

export function versPret(
  pret: {
    id: string;
    libelleObjet: string;
    libelleBulletin: string;
    montantTotal: Decimal;
    moisDebut: string;
    mensualite: Decimal;
    nombreEcheances: number;
    moisEffetDebut: string;
    moisEffetFin: string | null;
  },
  moisEnCours: string,
  bulletins: readonly MoisBulletin[]
) {
  return {
    id: pret.id,
    libelleObjet: pret.libelleObjet,
    libelleBulletin: pret.libelleBulletin,
    montantTotal: pret.montantTotal.toString(),
    moisDebut: pret.moisDebut,
    mensualite: pret.mensualite.toString(),
    nombreEcheances: pret.nombreEcheances,
    soldeRestant: deduireSoldeRestantPret(pret, bulletins),
    moisEffetDebut: pret.moisEffetDebut,
    moisEffetFin: pret.moisEffetFin,
    etat: deduireEtatLigne(pret, moisEnCours),
  };
}

export function versSaisieSurSalaire(
  saisie: {
    id: string;
    referenceDecision: string;
    creancier: string;
    libelleBulletin: string;
    montantTotal: Decimal;
    montantMensuel: Decimal;
    moisDebut: string;
    moisEffetDebut: string;
    moisEffetFin: string | null;
  },
  moisEnCours: string
) {
  return {
    id: saisie.id,
    referenceDecision: saisie.referenceDecision,
    creancier: saisie.creancier,
    libelleBulletin: saisie.libelleBulletin,
    montantTotal: saisie.montantTotal.toString(),
    montantMensuel: saisie.montantMensuel.toString(),
    moisDebut: saisie.moisDebut,
    moisEffetDebut: saisie.moisEffetDebut,
    moisEffetFin: saisie.moisEffetFin,
    etat: deduireEtatLigne(saisie, moisEnCours),
  };
}

export function versPrimeContractuelle(prime: {
  id: string;
  primeRef: string;
  moisApplication: number[];
}) {
  return {
    id: prime.id,
    primeRef: prime.primeRef,
    moisApplication: prime.moisApplication,
  };
}

export function versAvantageEnNature(
  avantage: {
    id: string;
    natureRef: string;
    montant: Decimal;
    moisApplication: number[];
    moisEffetDebut: string;
    moisEffetFin: string | null;
  },
  moisEnCours: string
) {
  return {
    id: avantage.id,
    natureRef: avantage.natureRef,
    montant: avantage.montant.toString(),
    moisApplication: avantage.moisApplication,
    moisEffetDebut: avantage.moisEffetDebut,
    moisEffetFin: avantage.moisEffetFin,
    etat: deduireEtatLigne(avantage, moisEnCours),
  };
}

export function versStatutParticulier(
  statut: {
    id: string;
    statutCode: string;
    dateDebut: Date;
    dateFin: Date | null;
    origine: 'SAISIE_MANUELLE' | 'PROPAGE_SOCIETE';
  },
  moisEnCours: string
) {
  return {
    id: statut.id,
    statutCode: statut.statutCode,
    dateDebut: formaterDate(statut.dateDebut),
    dateFin: statut.dateFin !== null ? formaterDate(statut.dateFin) : null,
    origine: statut.origine,
    etat: deduireEtatLigne(
      {
        moisEffetDebut: moisDepuisDate(statut.dateDebut),
        moisEffetFin: statut.dateFin !== null ? moisDepuisDate(statut.dateFin) : null,
      },
      moisEnCours
    ),
  };
}

export function calculerNombrePersonnesACharge(
  lignes: readonly {
    aCharge: boolean;
    moisEffetDebut: string;
    moisEffetFin: string | null;
  }[],
  moisEnCours: string
): number {
  return compterPersonnesACharge(lignes, moisEnCours);
}

export const INCLUDE_COLLECTIONS_SALARIE = {
  personnesACharge: { orderBy: { createdAt: 'asc' as const } },
  comptesBancaires: { orderBy: { createdAt: 'asc' as const } },
  prets: { orderBy: { createdAt: 'asc' as const } },
  saisiesSurSalaire: { orderBy: { createdAt: 'asc' as const } },
} as const;

export const INCLUDE_COLLECTIONS_EMPLOI = {
  primesContractuelles: { orderBy: { id: 'asc' as const } },
  avantagesEnNature: { orderBy: { createdAt: 'asc' as const } },
  statutsParticuliers: { orderBy: { createdAt: 'asc' as const } },
} as const;

export function mapperCollectionsSalarie(
  salarie: {
    personnesACharge: PersonneAChargeRow[];
    comptesBancaires: (Parameters<typeof versCompteBancaireSalarie>[0] & { createdAt: Date })[];
    prets: (Parameters<typeof versPret>[0] & { createdAt: Date })[];
    saisiesSurSalaire: (Parameters<typeof versSaisieSurSalaire>[0] & { createdAt: Date })[];
  },
  moisEnCours: string,
  bulletins: readonly MoisBulletin[]
) {
  return {
    nombrePersonnesACharge: calculerNombrePersonnesACharge(salarie.personnesACharge, moisEnCours),
    personnesACharge: trierPersonnesACharge(salarie.personnesACharge).map((l) =>
      versPersonneACharge(l, moisEnCours)
    ),
    comptesBancaires: trierParOrdreSaisie(salarie.comptesBancaires).map(versCompteBancaireSalarie),
    prets: trierParMoisDebut(salarie.prets).map((p) => versPret(p, moisEnCours, bulletins)),
    saisiesSurSalaire: trierParMoisDebut(salarie.saisiesSurSalaire).map((s) =>
      versSaisieSurSalaire(s, moisEnCours)
    ),
  };
}

export function mapperCollectionsEmploi(
  emploi: {
    primesContractuelles: Parameters<typeof versPrimeContractuelle>[0][];
    avantagesEnNature: (Parameters<typeof versAvantageEnNature>[0] & { createdAt: Date })[];
    statutsParticuliers: (Parameters<typeof versStatutParticulier>[0] & { createdAt: Date })[];
  },
  moisEnCours: string
) {
  return {
    primesContractuelles: emploi.primesContractuelles.map(versPrimeContractuelle),
    avantagesEnNature: trierParOrdreSaisie(emploi.avantagesEnNature).map((a) =>
      versAvantageEnNature(a, moisEnCours)
    ),
    statutsParticuliers: trierParDateDebut(emploi.statutsParticuliers).map((s) =>
      versStatutParticulier(s, moisEnCours)
    ),
  };
}

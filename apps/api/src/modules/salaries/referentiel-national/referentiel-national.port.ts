import { Decimal } from 'decimal.js';

/** Cles du referentiel national (modules 4 et 5 — aucune table en phase 2). */
export type CleReferentielNational = 'SMIG' | 'DUREE_LEGALE_TRAVAIL' | 'AGE_MAX_ENFANT_CHARGE';

export const REFERENTIEL_NATIONAL_PORT = Symbol('REFERENTIEL_NATIONAL_PORT');

/**
 * Port de lecture du referentiel national pour un mois donne (AAAA-MM).
 * Valeur absente → aucune alerte dependante (P6).
 */
export interface ReferentielNationalPort {
  lireValeur(cle: CleReferentielNational, mois: string): Promise<Decimal | null>;
}

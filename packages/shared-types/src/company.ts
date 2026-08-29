import type { Timestamps, Uuid } from './common';

/**
 * Company = la societe dont on produira la paie.
 *
 * Deuxieme niveau d isolation. Toute Company appartient obligatoirement a un
 * Account : `accountId` n est jamais nul.
 *
 * Le libelle legal est `raisonSociale` (le champ `name` du module 0 a ete
 * retire a l etape 1.1.b).
 */
export interface Company extends Timestamps {
  readonly id: Uuid;
  readonly accountId: Uuid;
  readonly codeDossier: string;
  readonly raisonSociale: string;
  readonly nomCommercial: string | null;
  readonly formeJuridiqueId: Uuid;
  readonly etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  readonly regimeDeBase: 'NON_AGRICOLE';
  readonly periodicitePaie: 'MENSUEL';
  readonly moisDebutMontage: string;
  readonly moisDebutProduction: string;
  readonly dateInactivite: string | null;
  /** Mois de paie en cours (AAAA-MM). Lecture seule cote API fiche. */
  readonly moisEnCours: string;
}

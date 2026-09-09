/**
 * Etat deduit d une ligne de tableau historise au mois en cours du salarie.
 * Jamais stocke : voir deduireEtatLigne (API).
 */
export type EtatLigneFiche = 'ACTIVE' | 'PAS_ENCORE_EFFECTIVE' | 'CLOTUREE';

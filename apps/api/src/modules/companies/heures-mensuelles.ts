/**
 * Conversion hebdomadaire → mensuel pour la grille horaire.
 *
 * Coefficient reglementaire retenu : 52 / 12.
 * Arrondi a l unite superieure via Decimal.ceil() — jamais Math.round
 * (interdit par ESLint, cf. packages/config/eslint/base.js).
 */
import { Decimal } from 'decimal.js';

/** Coefficient 52 semaines / 12 mois. */
export const COEFFICIENT_HEBDO_VERS_MENSUEL = new Decimal(52).dividedBy(12);

/**
 * Deduit les heures mensuelles a partir d un total hebdomadaire.
 * Le resultat reste modifiable par l utilisateur cote saisie (etape 1.1.b).
 */
export function heuresHebdomadairesVersMensuelles(heuresHebdomadaires: Decimal): Decimal {
  return heuresHebdomadaires.times(COEFFICIENT_HEBDO_VERS_MENSUEL).ceil();
}

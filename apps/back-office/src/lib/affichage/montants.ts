import Decimal from 'decimal.js';

const formateurMontant = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Affiche un montant serialise (decimal.js cote API).
 * Case vide en entree → case vide en sortie (pas de zero par defaut).
 */
export function afficherMontant(valeur: string | null | undefined): string {
  if (valeur == null || valeur === '') {
    return '';
  }
  return formateurMontant.format(new Decimal(valeur).toNumber());
}

import Decimal from 'decimal.js';

/** Affiche une duree ou un montant serialise en chaine (decimal.js, jamais parseFloat). */
export function afficherNombreDecimal(valeur: string | null | undefined): string {
  if (valeur == null || valeur === '') return '0';
  return new Decimal(valeur).toString();
}

/** Somme de durees pour affichage de controle (pas une regle metier). */
export function sommerDurees(valeurs: readonly string[]): Decimal {
  return valeurs.reduce((acc, v) => acc.plus(new Decimal(v || '0')), new Decimal(0));
}

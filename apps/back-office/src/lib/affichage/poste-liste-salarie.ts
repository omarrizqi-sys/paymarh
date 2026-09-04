/** Affichage colonne poste — composition ecran, pas de regle metier. */
export function afficherPosteListe(ligne: {
  readonly poste: string | null;
  readonly nombreEmploisOuverts: number;
}): string {
  if (ligne.nombreEmploisOuverts >= 2) {
    return `${ligne.nombreEmploisOuverts} emplois`;
  }
  return ligne.poste ?? '';
}

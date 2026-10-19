const DATE_AAAA_MM_JJ = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Reformate le texte AAAA-MM-JJ (éventuellement suivi d'une heure) en JJ/MM/AAAA,
 * sans objet Date. Une date absente s'affiche vide ; un texte non conforme est
 * rendu tel quel.
 */
export function afficherDate(date: string | null | undefined): string {
  if (date === null || date === undefined || date === '') {
    return '';
  }
  const morceaux = DATE_AAAA_MM_JJ.exec(date);
  if (morceaux === null) {
    return date;
  }
  const [, annee, mois, jour] = morceaux;
  return `${jour}/${mois}/${annee}`;
}

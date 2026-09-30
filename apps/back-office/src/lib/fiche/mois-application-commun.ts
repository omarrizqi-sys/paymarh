export const MOIS_APPLICATION = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const MOIS_ABREGE: readonly string[] = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
];

export function afficherMoisApplication(mois: readonly number[]): string {
  if (mois.length === 0) {
    return '';
  }
  if (mois.length === 12) {
    return 'Tous les mois';
  }
  const ordreCalendaire = [...mois].sort((a, b) => a - b);
  return ordreCalendaire.map((numero) => MOIS_ABREGE[numero - 1] ?? String(numero)).join(', ');
}

export function moisApplicationEgaux(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const triA = [...a].sort((x, y) => x - y);
  const triB = [...b].sort((x, y) => x - y);
  return triA.every((valeur, index) => valeur === triB[index]);
}

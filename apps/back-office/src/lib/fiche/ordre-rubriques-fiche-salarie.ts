/**
 * Ordre d'affichage, sommaire et enregistrement des rubriques fiche salarie.
 * Source stable — ne depend pas de l'ordre d'inscription au registre.
 */
export const ORDRE_RUBRIQUES_FICHE_SALARIE = [
  'identite',
  'identifiants-legaux',
  'coordonnees',
  'personnes-a-charge',
  'comptes-bancaires',
  'dates',
] as const;

export type IdRubriqueFicheSalarie = (typeof ORDRE_RUBRIQUES_FICHE_SALARIE)[number];

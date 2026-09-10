import { ORDRE_RUBRIQUES_FICHE_SALARIE } from './ordre-rubriques-fiche-salarie';

/**
 * Les quatre blocs d identite, dans l ordre de la fiche (tableaux exclus).
 */
export const ORDRE_RUBRIQUES_CREATION_SALARIE = ORDRE_RUBRIQUES_FICHE_SALARIE.filter(
  (id): id is 'identite' | 'identifiants-legaux' | 'coordonnees' | 'dates' =>
    id === 'identite' || id === 'identifiants-legaux' || id === 'coordonnees' || id === 'dates'
);

export type IdRubriqueCreationSalarie = (typeof ORDRE_RUBRIQUES_CREATION_SALARIE)[number];

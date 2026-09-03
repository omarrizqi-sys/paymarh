/** Codes de blocage, d alerte et de confirmation — registre unique fiche salarie. */
export const CODES_REPONSE = {
  EN_TETE_IF_MATCH_REQUIS: {
    code: 'EN_TETE_IF_MATCH_REQUIS',
    message: 'La version lue doit etre fournie dans l en-tete If-Match.',
  },
  CONFLIT_VERSION: {
    code: 'CONFLIT_VERSION',
    message: 'La fiche a ete modifiee entre-temps. Rechargez-la avant de reessayer.',
  },
  VALEUR_INDISPONIBLE: {
    code: 'VALEUR_INDISPONIBLE',
    message: "Cette valeur n'est pas disponible.",
  },
  CHAMP_INTERDIT: {
    code: 'CHAMP_INTERDIT',
    message: 'Ce champ ne peut pas etre fourni par le client.',
  },
  CONFIRMATION_REQUISE: {
    code: 'CONFIRMATION_REQUISE',
    message: 'Cette operation exige une confirmation explicite.',
  },
  CONFIRMATION_OBSOLETE: {
    code: 'CONFIRMATION_OBSOLETE',
    message: 'Le contexte a change depuis l apercu. Relancez l apercu puis confirmez.',
  },
} as const;

export type CodeReponse = keyof typeof CODES_REPONSE;

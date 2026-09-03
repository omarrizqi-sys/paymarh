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
  CARACTERE_NON_CONFORME: {
    code: 'CARACTERE_NON_CONFORME',
    message: 'Ce champ contient un caractere non conforme a son type.',
  },
  ANCIENNETE_POSTERIEURE_ENTREE: {
    code: 'ANCIENNETE_POSTERIEURE_ENTREE',
    message: "La date d anciennete est posterieure a la date d entree.",
  },
  FORMAT_CONTACT_INVALIDE: {
    code: 'FORMAT_CONTACT_INVALIDE',
    message: 'Le format de l adresse mail ou du numero de telephone est incorrect.',
  },
  CODE_POSTAL_MAROC_INATTENDU: {
    code: 'CODE_POSTAL_MAROC_INATTENDU',
    message: 'Un code postal marocain comporte 5 chiffres.',
  },
  HOMONYME: {
    code: 'HOMONYME',
    message: 'Un salarie actif porte deja ce nom et ce prenom dans la societe.',
  },
  REEMBAUCHE: {
    code: 'REEMBAUCHE',
    message: 'Un salarie inactif correspond deja dans la societe.',
  },
  SUPPRESSION_INTERDITE: {
    code: 'SUPPRESSION_INTERDITE',
    message: 'Cette fiche ne peut pas etre supprimee.',
  },
} as const;

export type CodeReponse = keyof typeof CODES_REPONSE;

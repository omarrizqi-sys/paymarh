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
    message: 'La date d anciennete est posterieure a la date d entree.',
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
  DATE_FIN_ANTERIEURE_DEBUT: {
    code: 'DATE_FIN_ANTERIEURE_DEBUT',
    message: 'La date de fin ne peut pas etre anterieure a la date de debut.',
  },
  DATE_SORTIE_HORS_INTERVALLE: {
    code: 'DATE_SORTIE_HORS_INTERVALLE',
    message: 'La date de sortie est hors de l intervalle de l emploi.',
  },
  FIN_ESSAI_HORS_INTERVALLE: {
    code: 'FIN_ESSAI_HORS_INTERVALLE',
    message: 'La fin de periode d essai est hors de l intervalle de l emploi.',
  },
  RENOUVELLEMENT_ESSAI_ANTERIEUR: {
    code: 'RENOUVELLEMENT_ESSAI_ANTERIEUR',
    message: 'Le renouvellement de l essai est anterieur a la fin de la periode d essai initiale.',
  },
  SALAIRE_INFERIEUR_SMIG: {
    code: 'SALAIRE_INFERIEUR_SMIG',
    message: 'Le salaire est inferieur au SMIG en vigueur.',
  },
  DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE: {
    code: 'DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE',
    message: 'La somme des durees contractuelles des emplois actifs depasse le seuil legal.',
  },
  PART_VIREMENT_INVALIDE: {
    code: 'PART_VIREMENT_INVALIDE',
    message: 'La somme des parts de virement doit etre exactement 100 %.',
  },
  MONTANT_MENSUEL_SUPERIEUR_TOTAL: {
    code: 'MONTANT_MENSUEL_SUPERIEUR_TOTAL',
    message: 'Le montant mensuel ne peut pas depasser le montant total.',
  },
  CHEVAUCHEMENT_STATUTS: {
    code: 'CHEVAUCHEMENT_STATUTS',
    message: 'Deux statuts particuliers ont des periodes qui se chevauchent.',
  },
  STATUT_PROPAGE_LECTURE_SEULE: {
    code: 'STATUT_PROPAGE_LECTURE_SEULE',
    message: 'Ce statut particulier ne peut pas etre modifie depuis la fiche salarie.',
  },
  RIB_DEJA_UTILISE: {
    code: 'RIB_DEJA_UTILISE',
    message: 'Ce RIB est deja utilise dans la societe.',
  },
  FORMAT_IDENTIFIANT_BANCAIRE: {
    code: 'FORMAT_IDENTIFIANT_BANCAIRE',
    message: 'Le format du RIB, de l IBAN ou du BIC est inattendu.',
  },
  BANQUE_INCOHERENTE: {
    code: 'BANQUE_INCOHERENTE',
    message: 'La banque selectionnee ne correspond pas aux premiers chiffres du RIB.',
  },
  PERSONNE_A_CHARGE_DOUBLON: {
    code: 'PERSONNE_A_CHARGE_DOUBLON',
    message: 'Une personne a charge porte deja ce nom, prenom et date de naissance.',
  },
  ENFANT_AGE_DEPASSE: {
    code: 'ENFANT_AGE_DEPASSE',
    message: 'L enfant a charge depasse l age maximal prevu.',
  },
  MENSUALITE_ECHEANCES_INCOHERENTE: {
    code: 'MENSUALITE_ECHEANCES_INCOHERENTE',
    message:
      'La mensualite multipliee par le nombre d echeances ne correspond pas au montant total.',
  },
  STATUT_HORS_INTERVALLE_EMPLOI: {
    code: 'STATUT_HORS_INTERVALLE_EMPLOI',
    message: 'Les dates du statut particulier sont hors de l intervalle de l emploi.',
  },
  REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE: {
    code: 'REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE',
    message:
      'Le repos hebdomadaire est positionne sur un jour ou la grille horaire resolue porte des heures.',
  },
} as const;

export type CodeReponse = keyof typeof CODES_REPONSE;

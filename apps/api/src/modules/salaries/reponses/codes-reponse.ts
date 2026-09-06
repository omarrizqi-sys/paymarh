/** Codes de blocage, d alerte et de confirmation — registre unique fiche salarie. */
export const CODES_REPONSE = {
  EN_TETE_IF_MATCH_REQUIS: {
    code: 'EN_TETE_IF_MATCH_REQUIS',
    message: 'La version lue doit être fournie dans l’en-tête If-Match.',
  },
  CONFLIT_VERSION: {
    code: 'CONFLIT_VERSION',
    message: 'La fiche a été modifiée entre-temps. Rechargez-la avant de réessayer.',
  },
  VALEUR_INDISPONIBLE: {
    code: 'VALEUR_INDISPONIBLE',
    message: 'Cette valeur n’est pas disponible.',
  },
  CHAMP_INTERDIT: {
    code: 'CHAMP_INTERDIT',
    message: 'Ce champ ne peut pas être fourni par le client.',
  },
  CONFIRMATION_REQUISE: {
    code: 'CONFIRMATION_REQUISE',
    message: 'Cette opération exige une confirmation explicite.',
  },
  CONFIRMATION_OBSOLETE: {
    code: 'CONFIRMATION_OBSOLETE',
    message: 'Le contexte a changé depuis l’aperçu. Relancez l’aperçu puis confirmez.',
  },
  CARACTERE_NON_CONFORME: {
    code: 'CARACTERE_NON_CONFORME',
    message: 'Ce champ contient un caractère non conforme à son type.',
  },
  ANCIENNETE_POSTERIEURE_ENTREE: {
    code: 'ANCIENNETE_POSTERIEURE_ENTREE',
    message: 'La date d’ancienneté est postérieure à la date d’entrée.',
  },
  FORMAT_CONTACT_INVALIDE: {
    code: 'FORMAT_CONTACT_INVALIDE',
    message: 'Le format de l’adresse mail ou du numéro de téléphone est incorrect.',
  },
  CODE_POSTAL_MAROC_INATTENDU: {
    code: 'CODE_POSTAL_MAROC_INATTENDU',
    message: 'Un code postal marocain comporte 5 chiffres.',
  },
  HOMONYME: {
    code: 'HOMONYME',
    message: 'Un salarié actif porte déjà ce nom et ce prénom dans la société.',
  },
  REEMBAUCHE: {
    code: 'REEMBAUCHE',
    message: 'Un salarié inactif correspond déjà dans la société.',
  },
  SUPPRESSION_INTERDITE: {
    code: 'SUPPRESSION_INTERDITE',
    message: 'Cette fiche ne peut pas être supprimée.',
  },
  DATE_FIN_ANTERIEURE_DEBUT: {
    code: 'DATE_FIN_ANTERIEURE_DEBUT',
    message: 'La date de fin ne peut pas être antérieure à la date de début.',
  },
  DATE_SORTIE_HORS_INTERVALLE: {
    code: 'DATE_SORTIE_HORS_INTERVALLE',
    message: 'La date de sortie est hors de l’intervalle de l’emploi.',
  },
  FIN_ESSAI_HORS_INTERVALLE: {
    code: 'FIN_ESSAI_HORS_INTERVALLE',
    message: 'La fin de période d’essai est hors de l’intervalle de l’emploi.',
  },
  RENOUVELLEMENT_ESSAI_ANTERIEUR: {
    code: 'RENOUVELLEMENT_ESSAI_ANTERIEUR',
    message: 'Le renouvellement de l’essai est antérieur à la fin de la période d’essai initiale.',
  },
  SALAIRE_INFERIEUR_SMIG: {
    code: 'SALAIRE_INFERIEUR_SMIG',
    message: 'Le salaire est inférieur au SMIG en vigueur.',
  },
  DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE: {
    code: 'DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE',
    message: 'La somme des durées contractuelles des emplois actifs dépasse le seuil légal.',
  },
  PART_VIREMENT_INVALIDE: {
    code: 'PART_VIREMENT_INVALIDE',
    message: 'La somme des parts de virement doit être exactement 100 %.',
  },
  MONTANT_MENSUEL_SUPERIEUR_TOTAL: {
    code: 'MONTANT_MENSUEL_SUPERIEUR_TOTAL',
    message: 'Le montant mensuel ne peut pas dépasser le montant total.',
  },
  CHEVAUCHEMENT_STATUTS: {
    code: 'CHEVAUCHEMENT_STATUTS',
    message: 'Deux statuts particuliers ont des périodes qui se chevauchent.',
  },
  STATUT_PROPAGE_LECTURE_SEULE: {
    code: 'STATUT_PROPAGE_LECTURE_SEULE',
    message: 'Ce statut particulier ne peut pas être modifié depuis la fiche salarié.',
  },
  RIB_DEJA_UTILISE: {
    code: 'RIB_DEJA_UTILISE',
    message: 'Ce RIB est déjà utilisé dans la société.',
  },
  FORMAT_IDENTIFIANT_BANCAIRE: {
    code: 'FORMAT_IDENTIFIANT_BANCAIRE',
    message: 'Le format du RIB, de l’IBAN ou du BIC est inattendu.',
  },
  BANQUE_INCOHERENTE: {
    code: 'BANQUE_INCOHERENTE',
    message: 'La banque sélectionnée ne correspond pas aux premiers chiffres du RIB.',
  },
  PERSONNE_A_CHARGE_DOUBLON: {
    code: 'PERSONNE_A_CHARGE_DOUBLON',
    message: 'Une personne à charge porte déjà ce nom, prénom et date de naissance.',
  },
  ENFANT_AGE_DEPASSE: {
    code: 'ENFANT_AGE_DEPASSE',
    message: 'L’enfant à charge dépasse l’âge maximal prévu.',
  },
  MENSUALITE_ECHEANCES_INCOHERENTE: {
    code: 'MENSUALITE_ECHEANCES_INCOHERENTE',
    message:
      'La mensualité multipliée par le nombre d’échéances ne correspond pas au montant total.',
  },
  STATUT_HORS_INTERVALLE_EMPLOI: {
    code: 'STATUT_HORS_INTERVALLE_EMPLOI',
    message: 'Les dates du statut particulier sont hors de l’intervalle de l’emploi.',
  },
  REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE: {
    code: 'REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE',
    message:
      'Le repos hebdomadaire est positionné sur un jour où la grille horaire résolue porte des heures.',
  },
} as const;

export type CodeReponse = keyof typeof CODES_REPONSE;

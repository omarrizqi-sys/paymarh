export type VarianteDialogueSuppression = 'historise' | 'differee' | 'fiche';

export interface TextesConfirmationSuppression {
  readonly variante: VarianteDialogueSuppression;
  readonly titre: string;
  readonly corps?: string;
  readonly messageServeur?: string;
  readonly rubriqueModifiee?: boolean;
  readonly libelleConfirmer: string;
  readonly libelleAnnuler: string;
}

export const MENTION_SUPPRESSION_IMMEDIATE =
  'Cette suppression part tout de suite. Le bouton Annuler de la fiche ne reviendra pas dessus.';

export const MENTION_MODIFS_NON_ENREGISTREES =
  'Vos autres modifications de cette rubrique restent à enregistrer.';

export const MENTION_MODIFS_FICHE_NON_ENREGISTREES =
  'Vos modifications non enregistrées seront perdues.';

export const PREAMBULE_SITUATION_CHANGEE = 'La situation a changé depuis l’affichage.';

export function textesSuppressionHistorisee(options: {
  readonly titre: string;
  readonly messageServeur: string;
  readonly rubriqueModifiee: boolean;
}): TextesConfirmationSuppression {
  return {
    variante: 'historise',
    titre: options.titre,
    messageServeur: options.messageServeur,
    rubriqueModifiee: options.rubriqueModifiee,
    libelleConfirmer: 'Supprimer',
    libelleAnnuler: 'Garder la ligne',
  };
}

export function textesSuppressionFiche(options: {
  readonly messageServeur: string;
  readonly modificationsNonEnregistrees: boolean;
}): TextesConfirmationSuppression {
  return {
    variante: 'fiche',
    titre: 'Supprimer ce salarié ?',
    messageServeur: options.messageServeur,
    rubriqueModifiee: options.modificationsNonEnregistrees,
    libelleConfirmer: 'Supprimer',
    libelleAnnuler: 'Garder le salarié',
  };
}

export function textesSuppressionDiffereeCompteBancaire(): TextesConfirmationSuppression {
  return {
    variante: 'differee',
    titre: 'Supprimer ce compte bancaire ?',
    corps:
      'Cette ligne sera supprimée lors du prochain enregistrement. Le bouton Annuler de la fiche revient dessus.',
    libelleConfirmer: 'Supprimer',
    libelleAnnuler: 'Garder la ligne',
  };
}

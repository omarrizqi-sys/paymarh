/**
 * Inventaires d impact avant suppression + jeton de confirmation.
 *
 * Le client appelle GET .../impact-suppression, affiche les quantites, puis
 * renvoie le `jetonConfirmation` au DELETE. Si l inventaire a change entre
 * temps, le jeton ne correspond plus et la suppression est refusee.
 */

export interface ImpactSuppressionSociete {
  readonly etablissements: number;
  readonly comptesBancaires: number;
  readonly parametragesHistoriquesSociete: number;
  readonly parametragesHistoriquesEtablissement: number;
  readonly jetonConfirmation: string;
}

export interface ImpactSuppressionEtablissement {
  readonly estPrincipal: boolean;
  readonly comptesBancairesRattaches: readonly {
    readonly id: string;
    readonly libelle: string | null;
  }[];
  readonly parametragesHistoriques: number;
  readonly jetonConfirmation: string;
}

export interface ImpactSuppressionCompteBancaire {
  readonly etablissementsRattaches: number;
  readonly utiliseParBulletin: boolean;
  readonly jetonConfirmation: string;
}

export interface ResultatSuppression {
  readonly id: string;
  readonly quantitesSupprimees: Readonly<Record<string, number>>;
}

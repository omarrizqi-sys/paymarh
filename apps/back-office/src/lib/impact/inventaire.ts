import type {
  ImpactSuppressionCompteBancaire,
  ImpactSuppressionEtablissement,
  ImpactSuppressionSociete,
} from '@paymarh/shared-types';
import type { LigneImpact } from '@/components/impact-suppression/dialogue-impact-suppression';

export function inventaireImpactSociete(data: ImpactSuppressionSociete): readonly LigneImpact[] {
  return [
    { libelle: 'Établissements', quantite: data.etablissements },
    { libelle: 'Comptes bancaires', quantite: data.comptesBancaires },
    {
      libelle: 'Historiques de paramétrage société',
      quantite: data.parametragesHistoriquesSociete,
    },
    {
      libelle: 'Historiques de paramétrage établissement',
      quantite: data.parametragesHistoriquesEtablissement,
    },
  ];
}

export function inventaireImpactEtablissement(
  data: ImpactSuppressionEtablissement
): readonly LigneImpact[] {
  const lignes: LigneImpact[] = [
    { libelle: 'Comptes bancaires détachés', quantite: data.comptesBancairesRattaches.length },
    { libelle: 'Historiques de paramétrage', quantite: data.parametragesHistoriques },
  ];
  if (data.estPrincipal) {
    lignes.unshift({ libelle: 'Établissement principal (non supprimable)', quantite: 1 });
  }
  return lignes;
}

export function inventaireImpactCompteBancaire(
  data: ImpactSuppressionCompteBancaire
): readonly LigneImpact[] {
  return [
    { libelle: 'Établissements rattachés', quantite: data.etablissementsRattaches },
    { libelle: 'Utilisé par un bulletin', quantite: data.utiliseParBulletin ? 1 : 0 },
  ];
}

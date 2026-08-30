import type { ImpactSuppressionCompteBancaire, ImpactSuppressionEtablissement, ImpactSuppressionSociete } from '@paymarh/shared-types';
import type { LigneImpact } from '@/components/impact-suppression/dialogue-impact-suppression';

export function inventaireImpactSociete(data: ImpactSuppressionSociete): readonly LigneImpact[] {
  return [
    { libelle: 'Etablissements', quantite: data.etablissements },
    { libelle: 'Comptes bancaires', quantite: data.comptesBancaires },
    { libelle: 'Historiques de parametrage societe', quantite: data.parametragesHistoriquesSociete },
    {
      libelle: 'Historiques de parametrage etablissement',
      quantite: data.parametragesHistoriquesEtablissement,
    },
  ];
}

export function inventaireImpactEtablissement(
  data: ImpactSuppressionEtablissement
): readonly LigneImpact[] {
  const lignes: LigneImpact[] = [
    { libelle: 'Comptes bancaires detaches', quantite: data.comptesBancairesRattaches.length },
    { libelle: 'Historiques de parametrage', quantite: data.parametragesHistoriques },
  ];
  if (data.estPrincipal) {
    lignes.unshift({ libelle: 'Etablissement principal (non supprimable)', quantite: 1 });
  }
  return lignes;
}

export function inventaireImpactCompteBancaire(
  data: ImpactSuppressionCompteBancaire
): readonly LigneImpact[] {
  return [
    { libelle: 'Etablissements rattaches', quantite: data.etablissementsRattaches },
    { libelle: 'Utilise par un bulletin', quantite: data.utiliseParBulletin ? 1 : 0 },
  ];
}

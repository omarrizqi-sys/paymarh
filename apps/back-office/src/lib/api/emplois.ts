import type { EmploiFiche, Permission, ReponseEcriture } from '@paymarh/shared-types';
import { appelerSalarieDelete, appelerSalarieGet } from './client-salarie';

export interface EmploiFicheAvecOperations extends EmploiFiche {
  readonly operations: readonly Permission[];
}

export interface ImpactSuppressionEmploi {
  readonly message: string;
  readonly jetonConfirmation: string;
}

export interface ImpactSuppressionLigneEmploi {
  readonly emploiId: string;
  readonly ligneId: string;
  readonly mode: 'supprimer' | 'inactiver';
  readonly message: string;
  readonly jetonConfirmation: string;
}

export async function impactSuppressionEmploi(
  companyId: string,
  emploiId: string
): Promise<{ donnees: ImpactSuppressionEmploi }> {
  return appelerSalarieGet<ImpactSuppressionEmploi>(
    companyId,
    `/emplois/${emploiId}/impact-suppression`
  );
}

export async function supprimerEmploi(
  companyId: string,
  emploiId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<{ readonly id: string }>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(companyId, `/emplois/${emploiId}?${query.toString()}`, version);
}

export async function impactSuppressionAvantageEnNature(
  companyId: string,
  emploiId: string,
  ligneId: string
): Promise<{ donnees: ImpactSuppressionLigneEmploi }> {
  return appelerSalarieGet<ImpactSuppressionLigneEmploi>(
    companyId,
    `/emplois/${emploiId}/avantages-en-nature/${ligneId}/impact-suppression`
  );
}

export async function supprimerAvantageEnNature(
  companyId: string,
  emploiId: string,
  ligneId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<EmploiFiche>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(
    companyId,
    `/emplois/${emploiId}/avantages-en-nature/${ligneId}?${query.toString()}`,
    version
  );
}

export async function impactSuppressionStatutParticulier(
  companyId: string,
  emploiId: string,
  ligneId: string
): Promise<{ donnees: ImpactSuppressionLigneEmploi }> {
  return appelerSalarieGet<ImpactSuppressionLigneEmploi>(
    companyId,
    `/emplois/${emploiId}/statuts-particuliers/${ligneId}/impact-suppression`
  );
}

export async function supprimerStatutParticulier(
  companyId: string,
  emploiId: string,
  ligneId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<EmploiFiche>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(
    companyId,
    `/emplois/${emploiId}/statuts-particuliers/${ligneId}?${query.toString()}`,
    version
  );
}

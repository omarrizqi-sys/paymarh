import type {
  CompteBancaire,
  ImpactSuppressionCompteBancaire,
  ListResponseAvecOperations,
  ResultatSuppression,
  RessourceAvecOperations,
} from '@paymarh/shared-types';
import { appelerApiGet, appelerApiMutation } from './client';

export async function listerComptesBancaires(societeId: string) {
  return appelerApiGet<ListResponseAvecOperations<CompteBancaire>>(
    `/societes/${societeId}/comptes-bancaires`
  );
}

export async function creerCompteBancaire(societeId: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<CompteBancaire>>(
    'POST',
    `/societes/${societeId}/comptes-bancaires`,
    donnees
  );
}

export async function modifierCompteBancaire(id: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<CompteBancaire>>(
    'PATCH',
    `/comptes-bancaires/${id}`,
    donnees
  );
}

export async function cloturerCompteBancaire(id: string) {
  return appelerApiMutation<RessourceAvecOperations<CompteBancaire>>(
    'POST',
    `/comptes-bancaires/${id}/cloturer`
  );
}

export async function impactSuppressionCompteBancaire(id: string) {
  return appelerApiGet<ImpactSuppressionCompteBancaire>(
    `/comptes-bancaires/${id}/impact-suppression`
  );
}

export async function supprimerCompteBancaire(id: string, jeton: string) {
  return appelerApiMutation<ResultatSuppression>(
    'DELETE',
    `/comptes-bancaires/${id}?confirmationJeton=${encodeURIComponent(jeton)}`
  );
}

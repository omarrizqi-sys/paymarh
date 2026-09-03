import type {
  Etablissement,
  ImpactSuppressionEtablissement,
  ListResponseAvecOperations,
  ParametrageEtablissement,
  ResultatSuppression,
  RessourceAvecOperations,
} from '@paymarh/shared-types';
import { appelerApiGet, appelerApiMutation } from './client';

export async function listerEtablissements(societeId: string) {
  return appelerApiGet<ListResponseAvecOperations<Etablissement>>(
    `/societes/${societeId}/etablissements`
  );
}

export async function lireEtablissement(id: string) {
  return appelerApiGet<RessourceAvecOperations<Etablissement>>(`/etablissements/${id}`);
}

export async function creerEtablissement(societeId: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<Etablissement>>(
    'POST',
    `/societes/${societeId}/etablissements`,
    donnees
  );
}

export async function modifierEtablissement(id: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<Etablissement>>(
    'PATCH',
    `/etablissements/${id}`,
    donnees
  );
}

export async function designerPrincipal(id: string) {
  return appelerApiMutation<RessourceAvecOperations<Etablissement>>(
    'POST',
    `/etablissements/${id}/designer-principal`
  );
}

export async function lireParametrageEtablissement(id: string, mois: string) {
  return appelerApiGet<ParametrageEtablissement | null>(
    `/etablissements/${id}/parametrage?mois=${mois}`
  );
}

export async function deduireHeuresMensuelles(
  id: string,
  donnees: { horaireDefautLignes: unknown[]; dureeHebdomadaire: string }
) {
  return appelerApiMutation<{
    horaireMensuelLignes: { typeHeureId: string; nombreHeures: string }[];
  }>('POST', `/etablissements/${id}/deduire-heures-mensuelles`, donnees);
}

export async function ecrireParametrageEtablissement(id: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<ParametrageEtablissement>(
    'PUT',
    `/etablissements/${id}/parametrage`,
    donnees
  );
}

export async function impactSuppressionEtablissement(id: string) {
  return appelerApiGet<ImpactSuppressionEtablissement>(`/etablissements/${id}/impact-suppression`);
}

export async function supprimerEtablissement(id: string, jeton: string) {
  return appelerApiMutation<ResultatSuppression>(
    'DELETE',
    `/etablissements/${id}?confirmationJeton=${encodeURIComponent(jeton)}`
  );
}

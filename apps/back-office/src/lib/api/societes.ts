import type {
  ImpactSuppressionSociete,
  ListResponseAvecOperations,
  ParametrageSociete,
  ResultatSuppression,
  RessourceAvecOperations,
  Societe,
  SocieteListe,
} from '@paymarh/shared-types';
import { appelerApiGet, appelerApiMutation } from './client';

export async function listerSocietes() {
  return appelerApiGet<ListResponseAvecOperations<SocieteListe>>('/societes');
}

export async function lireSociete(id: string) {
  return appelerApiGet<RessourceAvecOperations<Societe>>(`/societes/${id}`);
}

export async function creerSociete(donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<Societe>>('POST', '/societes', donnees);
}

export async function modifierSociete(id: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<Societe>>('PATCH', `/societes/${id}`, donnees);
}

export async function changerEtatSociete(id: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<RessourceAvecOperations<Societe>>(
    'PATCH',
    `/societes/${id}/etat`,
    donnees
  );
}

export async function lireParametrageSociete(id: string, mois: string) {
  return appelerApiGet<ParametrageSociete | null>(`/societes/${id}/parametrage?mois=${mois}`);
}

export async function ecrireParametrageSociete(id: string, donnees: Record<string, unknown>) {
  return appelerApiMutation<ParametrageSociete>('PUT', `/societes/${id}/parametrage`, donnees);
}

export async function impactSuppressionSociete(id: string) {
  return appelerApiGet<ImpactSuppressionSociete>(
    `/societes/${id}/impact-suppression`
  );
}

export async function supprimerSociete(id: string, jeton: string) {
  return appelerApiMutation<ResultatSuppression>(
    'DELETE',
    `/societes/${id}?confirmationJeton=${encodeURIComponent(jeton)}`
  );
}

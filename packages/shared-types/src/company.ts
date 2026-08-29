import type { Timestamps, Uuid } from './common';

/** Societe (fiche complete, exposee par l API /societes). */
export interface Societe extends Timestamps {
  readonly id: Uuid;
  readonly accountId: Uuid;
  readonly codeDossier: string;
  readonly raisonSociale: string;
  readonly nomCommercial: string | null;
  readonly formeJuridiqueId: Uuid;
  readonly activiteExercee: string | null;
  readonly identifiantFiscal: string | null;
  readonly registreCommerce: string | null;
  readonly tribunalRegistreCommerce: string | null;
  readonly dateCreation: string | null;
  readonly dateCessationActivite: string | null;
  readonly siteWeb: string | null;
  readonly regimeDeBase: 'NON_AGRICOLE';
  readonly periodicitePaie: 'MENSUEL';
  readonly etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  readonly moisDebutMontage: string;
  readonly moisDebutProduction: string;
  readonly dateInactivite: string | null;
  readonly moisEnCours: string;
  readonly signataireCivilite: string | null;
  readonly signatairePrenom: string | null;
  readonly signataireNom: string | null;
  readonly signataireQualite: string | null;
  readonly matriculePrefixe: string | null;
  readonly matriculeLongueur: number;
  readonly matriculeGenerationAuto: boolean;
  readonly calculAutoAbsencesEntreesSorties: boolean;
}

/** @deprecated Utiliser Societe. Alias de transition module 0. */
export type Company = Societe;

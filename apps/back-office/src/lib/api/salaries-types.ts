import type { Permission, RessourceAvecOperations } from '@paymarh/shared-types';

/** Fiche salarie telle que renvoyee par GET /salaries/:id (perimetre ecran). */
export interface FicheSalarie {
  readonly id: string;
  readonly version: number;
  readonly etat: 'ACTIF' | 'INACTIF';
  readonly moisEnCours: string;
  readonly matricule: string;
  readonly nom: string;
  readonly prenom: string;
  readonly sexe: 'HOMME' | 'FEMME';
  readonly dateNaissance: string;
  readonly villeNaissance: string | null;
  readonly paysNaissanceId: string | null;
  readonly nationaliteId: string | null;
  readonly situationFamiliale: { readonly code: string | null; readonly libelle: string | null };
  readonly numeroPiece: string | null;
  readonly numeroCnss: string | null;
  readonly numeroCimr: string | null;
  readonly adresse: string | null;
  readonly complementAdresse: string | null;
  readonly ville: string | null;
  readonly codePostal: string | null;
  readonly paysId: string | null;
  readonly telephonePersonnel: string | null;
  readonly telephoneProfessionnel: string | null;
  readonly emailPersonnel: string | null;
  readonly emailProfessionnel: string | null;
  readonly urgencePrenom: string | null;
  readonly urgenceNom: string | null;
  readonly urgenceTelephone: string | null;
  readonly urgenceEmail: string | null;
  readonly dateEntree: string;
  readonly dateAnciennete: string;
  readonly emplois: readonly unknown[];
  readonly operations: readonly Permission[];
}

export type FicheSalarieAvecOperations = RessourceAvecOperations<FicheSalarie>;

import type { Uuid } from './common';

export interface FormeJuridique {
  readonly id: Uuid;
  readonly code: string;
  readonly libelle: string;
}

export interface Banque {
  readonly id: Uuid;
  readonly nom: string;
  readonly ancienNom: string | null;
  readonly codeBanque: string | null;
  readonly couleur: string | null;
}

export interface JourFerie {
  readonly id: Uuid;
  readonly code: string;
  readonly libelle: string;
  readonly referenceDate: string;
  readonly type: 'CIVIL' | 'RELIGIEUX';
}

export interface TypeHeure {
  readonly id: Uuid;
  readonly code: string;
  readonly libelle: string;
  readonly ordre: number;
}

export interface TypeExoneration {
  readonly id: Uuid;
  readonly code: string;
  readonly libelle: string;
}

export interface Pays {
  readonly id: Uuid;
  readonly ordre: number;
  readonly codeIso: string;
  readonly libelle: string;
}

/** Referentiel : les deux libelles, jamais un seul. */
export interface SituationFamiliale {
  readonly id: Uuid;
  readonly code: string;
  readonly libelleMasculin: string;
  readonly libelleFeminin: string;
}

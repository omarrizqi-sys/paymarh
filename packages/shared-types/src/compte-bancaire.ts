import type { Timestamps, Uuid } from './common';

export interface CompteBancaire extends Timestamps {
  readonly id: Uuid;
  readonly companyId: Uuid;
  readonly libelle: string | null;
  readonly banqueId: Uuid | null;
  readonly banqueSaisieLibre: string | null;
  readonly rib: string | null;
  readonly iban: string | null;
  readonly bic: string | null;
  readonly nomPayeur: string | null;
  readonly usageSalaires: boolean;
  readonly usageCotisationsSociales: boolean;
  readonly usageIR: boolean;
  readonly etat: 'ACTIF' | 'CLOTURE';
  readonly etablissementIds: readonly Uuid[];
}
